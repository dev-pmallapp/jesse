"""Tests for story #8 (dev-pmallapp/jesse#8): the on-disk archive cache
(archive_cache.py), bulk session import (bulk_import.py), corporate-action
re-adjustment detection (adjustment_state.py), and the daily-bars-only route
timeframe rule (validators.py). No network access anywhere: every source is either a
fake `IndiaDailySource`/HTTP-client double, or exercises `ArchiveFileCache` directly
against a `tmp_path`. No real database either, following the same pattern
tests/test_import_candles_workflow.py already uses for `candle_repository` - the
`Candle`/`IndiaAdjustmentState` peewee models have no live connection in unit-test mode
(`jesse.services.db.Database.open_connection` is a no-op under `jh.is_unit_testing()`),
so every DB-touching call is monkeypatched instead of hitting a real table.
"""
from contextlib import contextmanager
from datetime import date, datetime, timedelta
from types import SimpleNamespace

import arrow
import numpy as np
import pytest

import jesse.helpers as jh
from jesse.repositories import candle_repository
from jesse.services import validators
from jesse.services.db import database
from jesse.services.historical_data.india import adjustment_state, bulk_import
from jesse.services.historical_data.india.archive_cache import (
    ARCHIVE_IMMUTABLE_AFTER_DAYS,
    ArchiveFileCache,
    _default_today,
)
from jesse.services.historical_data.india.corporate_actions import CorporateActionsStore
from jesse.services.historical_data.errors import ProviderUnavailableError
from jesse.services.historical_data.india.provider import IndiaExchangeProvider, UNADJUSTED_SIGNATURE_MARKER
from jesse.services.historical_data.india.sessions import IST, session_row_timestamp
from jesse.services.historical_data.india.sources import ArchiveDailySource, DailyBar, IndiaDailySource
from jesse.services import candle_service
from jesse.models.Route import Route

# --------------------------------------------------------------------------------------
# ArchiveFileCache - disk cache behavior (used indirectly through ArchiveDailySource)
# --------------------------------------------------------------------------------------


class _ConcreteArchiveSource(ArchiveDailySource):
    """Trivial concrete subclass so `ArchiveDailySource` (abstract) can be
    instantiated for `_fetch_and_parse` tests - `fetch_session` itself is never
    exercised here, only `_fetch_and_parse`.
    """

    source_id = 'fake_cached_source'
    exchange = 'NSE'
    prices_adjusted = False

    def fetch_session(self, session):
        raise NotImplementedError


class _CountingUdiffSource:
    """A minimal ArchiveDailySource stand-in - only exercises `_fetch_and_parse`
    against a single fake "udiff" URL/kind, so these tests are about the caching
    mechanism itself, not any real NSE/BSE parsing.
    """

    source_id = 'fake_cached_source'
    exchange = 'NSE'
    prices_adjusted = False

    def __init__(self, cache, files):
        self._impl = _ConcreteArchiveSource(cache=cache)
        self._files = files
        self.calls: list[str] = []

    def fetch(self, session: date):
        return self._impl._fetch_and_parse(
            f'https://example.test/{session.isoformat()}', kind='udiff', session=session, expect='zip',
            client=self, parse=lambda payload: {'TICKER': payload},
        )

    def get(self, url, *, expect):
        self.calls.append(url)
        return self._files.get(url)


def test_disk_cache_hit_avoids_a_second_network_fetch(tmp_path):
    cache = ArchiveFileCache(tmp_path, today=lambda: date(2024, 1, 10))
    session = date(2024, 1, 1)  # 9 days old - immutable
    source = _CountingUdiffSource(cache, {f'https://example.test/{session.isoformat()}': b'payload-bytes'})

    first = source.fetch(session)
    second = source.fetch(session)

    assert first == second == {'TICKER': b'payload-bytes'}
    assert source.calls == [f'https://example.test/{session.isoformat()}']  # only fetched once


def test_unpublished_marker_is_only_persisted_for_immutable_sessions(tmp_path):
    today = date(2024, 1, 10)
    cache = ArchiveFileCache(tmp_path, today=lambda: today)
    old_session = date(2024, 1, 1)  # 9 days old, past ARCHIVE_IMMUTABLE_AFTER_DAYS
    recent_session = today - timedelta(days=ARCHIVE_IMMUTABLE_AFTER_DAYS - 1)
    url_for = lambda session: f'https://example.test/{session.isoformat()}'
    old_source = _CountingUdiffSource(cache, {url_for(old_session): None})
    recent_source = _CountingUdiffSource(cache, {url_for(recent_session): None})

    assert old_source.fetch(old_session) is None
    assert old_source.fetch(old_session) is None
    assert old_source.calls == [url_for(old_session)]  # second call served from the "not published" marker

    assert recent_source.fetch(recent_session) is None
    assert recent_source.fetch(recent_session) is None
    assert recent_source.calls == [url_for(recent_session), url_for(recent_session)]  # re-fetched both times


def test_corrupt_cached_file_is_deleted_and_refetched_once(tmp_path):
    today = date(2024, 1, 10)
    cache = ArchiveFileCache(tmp_path, today=lambda: today)
    session = date(2024, 1, 1)  # immutable
    # Prime the cache directly with a payload that will fail to "parse".
    cache.put('fake_cached_source', 'udiff', session, b'stale-corrupt-bytes')

    files = {f'https://example.test/{session.isoformat()}': b'fresh-good-bytes'}
    source = _CountingUdiffSource(cache, files)

    call_count = {'n': 0}

    def parse(payload):
        call_count['n'] += 1
        if payload == b'stale-corrupt-bytes':
            raise ValueError('corrupt')
        return {'TICKER': payload}

    result = source._impl._fetch_and_parse(
        f'https://example.test/{session.isoformat()}', kind='udiff', session=session, expect='zip',
        client=source, parse=parse,
    )

    assert result == {'TICKER': b'fresh-good-bytes'}
    assert source.calls == [f'https://example.test/{session.isoformat()}']  # one real network fetch
    assert call_count['n'] == 2  # the corrupt cached parse attempt, then the fresh one
    # The disk cache now holds the fresh payload, not the corrupt one.
    assert cache.get('fake_cached_source', 'udiff', session) == b'fresh-good-bytes'


def test_cache_write_is_atomic_and_leaves_no_partial_file_on_failure(tmp_path, monkeypatch):
    # Simulate a crash/full-disk mid-write: the temp file is created and written, but
    # the final atomic rename onto the real path fails.
    import jesse.services.historical_data.india.archive_cache as archive_cache_module

    cache = ArchiveFileCache(tmp_path, today=lambda: date(2024, 1, 10))
    session = date(2024, 1, 1)  # immutable

    def boom(*_args, **_kwargs):
        raise OSError('simulated disk failure')

    monkeypatch.setattr(archive_cache_module.os, 'replace', boom)

    with pytest.raises(OSError):
        cache.put('fake_cached_source', 'udiff', session, b'payload')

    payload_path, absent_path = cache._paths('fake_cached_source', 'udiff', session)
    assert not payload_path.exists()  # no partially-written final file
    assert not absent_path.exists()
    # No stray temp file left behind in the directory either.
    assert list(payload_path.parent.iterdir()) == []


def test_cache_write_absent_marker_is_also_atomic_and_leaves_no_partial_file(tmp_path, monkeypatch):
    import jesse.services.historical_data.india.archive_cache as archive_cache_module

    cache = ArchiveFileCache(tmp_path, today=lambda: date(2024, 1, 10))
    session = date(2024, 1, 1)  # immutable - the only case an ".absent" marker is written

    monkeypatch.setattr(
        archive_cache_module.os, 'replace', lambda *a, **k: (_ for _ in ()).throw(OSError('disk failure')),
    )

    with pytest.raises(OSError):
        cache.put('fake_cached_source', 'udiff', session, None)

    payload_path, absent_path = cache._paths('fake_cached_source', 'udiff', session)
    assert not absent_path.exists()
    assert list(payload_path.parent.iterdir()) == []


def test_cache_source_id_and_kind_must_be_safe_path_segments(tmp_path):
    cache = ArchiveFileCache(tmp_path, today=lambda: date(2024, 1, 10))
    session = date(2024, 1, 1)

    with pytest.raises(ValueError):
        cache.get('../escape', 'udiff', session)
    with pytest.raises(ValueError):
        cache.get('nse_bhavcopy', 'not/a/kind', session)
    with pytest.raises(ValueError):
        cache.get('Upper-Case', 'udiff', session)  # hyphen and uppercase both rejected

    # A conforming key still works fine.
    cache.put('nse_bhavcopy', 'udiff', session, b'ok')
    assert cache.get('nse_bhavcopy', 'udiff', session) == b'ok'


def test_is_immutable_uses_ist_today_by_default():
    # `_default_today` (archive_cache.py's default `today` callable) must compute
    # "today" in IST, not the host's local timezone or a naive UTC date - see the
    # module's comment on why. Cross-check it against an independent computation.
    assert _default_today() == datetime.now(IST).date()


# --------------------------------------------------------------------------------------
# bulk_import.import_sessions
# --------------------------------------------------------------------------------------

ALLCARGO_ISIN = 'INE418H01029'
_ALLCARGO_ACTIONS_2024 = [{
    'isin': ALLCARGO_ISIN, 'symbol': 'ALLCARGO', 'exDate': '02-Jan-2024', 'subject': 'Bonus 3:1',
}]


class _FakeCorporateActionsClient:
    def __init__(self, records_by_year):
        self._records_by_year = records_by_year

    def fetch_year(self, year):
        return self._records_by_year.get(year, [])


class _BulkFakeSource(IndiaDailySource):
    """A whole-market source wired for `fetch_session_bars` (the bulk path) only -
    `fetch_daily_bars` deliberately raises so a test fails loudly if bulk_import ever
    falls back to the per-ticker path instead of the bulk one.
    """

    source_id = 'fake-bulk'
    exchange = 'NSE'
    prices_adjusted = False

    def __init__(self, bars_by_session, index_tickers=frozenset(), isin_by_ticker=None):
        self._bars_by_session = bars_by_session
        self._index_tickers = index_tickers
        self._isin_by_ticker = isin_by_ticker or {}
        self.fetch_session_bars_calls: list[date] = []

    def fetch_daily_bars(self, ticker, sessions):
        raise AssertionError('bulk import must use fetch_session_bars, not the per-ticker path')

    def fetch_session_bars(self, session):
        self.fetch_session_bars_calls.append(session)
        return self._bars_by_session.get(session)

    def is_index(self, ticker):
        return ticker in self._index_tickers

    def isin_for(self, ticker):
        return self._isin_by_ticker.get(ticker)


def _allcargo_bars():
    return {
        date(2023, 12, 29): 315.05, date(2024, 1, 1): 328.90, date(2024, 1, 2): 86.00,
    }


def _build_bars_by_session(tickers_and_opens: dict[str, dict[date, float]]) -> dict[date, dict[str, DailyBar]]:
    by_session: dict[date, dict[str, DailyBar]] = {}
    for ticker, opens_by_session in tickers_and_opens.items():
        for session, open_price in opens_by_session.items():
            bar = DailyBar(session, open_price, open_price + 1, open_price - 1, open_price + 0.5, 1000.0)
            by_session.setdefault(session, {})[ticker] = bar
    return by_session


@pytest.fixture
def bulk_provider(monkeypatch):
    """A real IndiaExchangeProvider (so `adjusted_candles_for_ticker`/
    `adjustment_signature` run their real adjustment logic) backed by `_BulkFakeSource`,
    with candle storage and adjustment-state persistence monkeypatched out so nothing
    touches a real database.
    """
    sessions = [date(2023, 12, 29), date(2024, 1, 1), date(2024, 1, 2)]  # Fri, Mon, Tue
    bars_by_session = _build_bars_by_session({
        'ALLCARGO': _allcargo_bars(),
        'RELIANCE': {s: 2500.0 for s in sessions},
        'NIFTY': {s: 21000.0 for s in sessions},
    })
    source = _BulkFakeSource(bars_by_session, index_tickers={'NIFTY'}, isin_by_ticker={'ALLCARGO': ALLCARGO_ISIN})
    store = CorporateActionsStore(
        client=_FakeCorporateActionsClient({2024: _ALLCARGO_ACTIONS_2024}), today=lambda: date(2024, 6, 1),
    )
    provider = IndiaExchangeProvider('NSE', source=source, corporate_actions_store=store)

    stored = {}
    monkeypatch.setattr(
        candle_repository, 'store_observed_candles',
        lambda exchange, symbol, timeframe, candles: stored.setdefault((exchange, symbol), []).extend(candles),
    )
    # bulk_import.py binds `record_adjustment_state` into its own namespace via
    # `from .adjustment_state import ...` - patch it there, not on the adjustment_state
    # module itself, since bulk_import's copy of the name is a separate reference.
    monkeypatch.setattr(bulk_import, 'record_adjustment_state', lambda *a, **k: None)
    return provider, source, stored


def test_import_sessions_downloads_each_session_once_and_stores_one_row_per_ticker(bulk_provider):
    provider, source, stored = bulk_provider

    summary = bulk_import.import_sessions(
        'NSE', date(2023, 12, 29), date(2024, 1, 2), provider=provider, check_adjustments=False,
    )

    assert source.fetch_session_bars_calls == [date(2023, 12, 29), date(2024, 1, 1), date(2024, 1, 2)]
    assert summary.sessions_processed == 3
    assert summary.sessions_unpublished == 0
    assert summary.symbols_seen == {'ALLCARGO-INR', 'RELIANCE-INR', 'NIFTY-INR'}
    assert summary.rows_stored == 9  # 3 tickers * 3 sessions
    for symbol in ('ALLCARGO-INR', 'RELIANCE-INR', 'NIFTY-INR'):
        assert len(stored[('NSE', symbol)]) == 3
        timestamps = [c.timestamp for c in stored[('NSE', symbol)]]
        assert timestamps == sorted(timestamps)
        assert timestamps == [session_row_timestamp(s) for s in (date(2023, 12, 29), date(2024, 1, 1), date(2024, 1, 2))]


def test_import_sessions_adjusts_allcargo_and_leaves_index_and_others_raw(bulk_provider):
    provider, source, stored = bulk_provider

    bulk_import.import_sessions('NSE', date(2023, 12, 29), date(2024, 1, 2), provider=provider, check_adjustments=False)

    allcargo_opens = [c.open for c in stored[('NSE', 'ALLCARGO-INR')]]
    # Pre-ex-date bars (29-Dec-2023, 01-Jan-2024) are multiplied by the bonus factor
    # (0.25, from "Bonus 3:1"); the ex-date bar (02-Jan-2024) itself is untouched.
    assert allcargo_opens == pytest.approx([315.05 * 0.25, 328.90 * 0.25, 86.00])

    nifty_opens = [c.open for c in stored[('NSE', 'NIFTY-INR')]]
    assert nifty_opens == pytest.approx([21000.0, 21000.0, 21000.0])  # never adjusted (an index)

    reliance_opens = [c.open for c in stored[('NSE', 'RELIANCE-INR')]]
    assert reliance_opens == pytest.approx([2500.0, 2500.0, 2500.0])  # no known actions - unadjusted


def test_import_sessions_symbols_filter_restricts_what_is_stored(bulk_provider):
    provider, source, stored = bulk_provider

    summary = bulk_import.import_sessions(
        'NSE', date(2023, 12, 29), date(2024, 1, 2), ['RELIANCE-INR'], provider=provider, check_adjustments=False,
    )

    assert summary.symbols_seen == {'RELIANCE-INR'}
    assert ('NSE', 'ALLCARGO-INR') not in stored
    assert ('NSE', 'NIFTY-INR') not in stored
    assert len(stored[('NSE', 'RELIANCE-INR')]) == 3
    # Every session's whole file is still fetched even though only one symbol is kept.
    assert source.fetch_session_bars_calls == [date(2023, 12, 29), date(2024, 1, 1), date(2024, 1, 2)]


def test_import_sessions_calls_refresh_adjustments_before_recording_and_skips_symbols_it_already_recorded(
    bulk_provider, monkeypatch,
):
    # Regression: `record_adjustment_state` must never run for a touched symbol BEFORE
    # `refresh_adjustments` has had a chance to compare its OLD stored signature - doing
    # so would overwrite that old signature first and make every symbol look
    # "unchanged", silently defeating the whole re-adjustment mechanism.
    provider, source, stored = bulk_provider
    recorded = []
    monkeypatch.setattr(bulk_import, 'record_adjustment_state', lambda exchange, symbol, sig: recorded.append(symbol))
    refresh_calls = []

    def fake_refresh_adjustments(exchange, touched_symbols, *, provider):
        refresh_calls.append(sorted(touched_symbols))
        # pretend refresh_adjustments found ALLCARGO stale and already re-recorded it
        return adjustment_state.RefreshAdjustmentsResult(reimported=['ALLCARGO-INR'], failed={})

    monkeypatch.setattr(bulk_import, 'refresh_adjustments', fake_refresh_adjustments)

    summary = bulk_import.import_sessions('NSE', date(2023, 12, 29), date(2024, 1, 2), provider=provider)

    assert refresh_calls == [['ALLCARGO-INR', 'NIFTY-INR', 'RELIANCE-INR']]
    assert summary.reimported_symbols == ['ALLCARGO-INR']
    assert 'ALLCARGO-INR' not in recorded  # refresh_adjustments already recorded it - not double-recorded
    assert set(recorded) == {'RELIANCE-INR', 'NIFTY-INR'}  # the still-current symbols get a plain record


def test_adjustment_signature_is_the_fixed_marker_for_an_index_symbol(bulk_provider):
    provider, source, stored = bulk_provider

    assert provider.adjustment_signature('NIFTY-INR') == UNADJUSTED_SIGNATURE_MARKER


def test_import_sessions_counts_unpublished_sessions(bulk_provider):
    provider, source, stored = bulk_provider
    # 2024-01-03 (Wed) has no entry in bars_by_session - simulates a holiday.
    summary = bulk_import.import_sessions(
        'NSE', date(2023, 12, 29), date(2024, 1, 3), provider=provider, check_adjustments=False,
    )

    assert summary.sessions_processed == 3
    assert summary.sessions_unpublished == 1


def _weekdays(start: date, end: date) -> list[date]:
    days = []
    current = start
    while current <= end:
        if current.weekday() < 5:
            days.append(current)
        current += timedelta(days=1)
    return days


class _AlwaysFailingCorporateActionsClient:
    """Simulates the NSE corporate-actions API being unavailable for every year."""

    def fetch_year(self, year):
        raise ProviderUnavailableError('NSE corporate actions API is currently unavailable')


def test_import_sessions_stores_indices_and_records_failed_tickers_when_corporate_actions_unavailable(monkeypatch):
    # An index short-circuits BEFORE ever consulting the corporate-actions store (see
    # IndiaExchangeProvider._resolve_adjustment - `is_index` is checked first), so it
    # must still import fine even while the store is completely unreachable; an
    # ordinary NSE stock always resolves an NSE symbol for itself and so always
    # attempts to consult the store, and must therefore fail cleanly instead of
    # crashing the whole import.
    session = date(2024, 1, 1)
    bars_by_session = _build_bars_by_session({'RELIANCE': {session: 2500.0}, 'NIFTY': {session: 21000.0}})
    source = _BulkFakeSource(bars_by_session, index_tickers={'NIFTY'})
    store = CorporateActionsStore(client=_AlwaysFailingCorporateActionsClient(), today=lambda: date(2024, 6, 1))
    provider = IndiaExchangeProvider('NSE', source=source, corporate_actions_store=store)

    stored = {}
    monkeypatch.setattr(
        candle_repository, 'store_observed_candles',
        lambda exchange, symbol, timeframe, candles: stored.setdefault((exchange, symbol), []).extend(candles),
    )
    recorded_symbols = []
    monkeypatch.setattr(
        bulk_import, 'record_adjustment_state', lambda exchange, symbol, sig: recorded_symbols.append(symbol),
    )

    summary = bulk_import.import_sessions('NSE', session, session, provider=provider, check_adjustments=False)

    assert ('NSE', 'NIFTY-INR') in stored  # the index still imports fine
    assert ('NSE', 'RELIANCE-INR') not in stored  # the stock's candle-building failed
    assert 'RELIANCE' in summary.failed_tickers
    assert summary.symbols_seen == {'NIFTY-INR'}
    assert 'NIFTY-INR' in recorded_symbols
    assert 'RELIANCE-INR' not in recorded_symbols  # no state recorded for a failed ticker


def test_import_sessions_persists_earlier_chunk_progress_when_a_later_chunk_fails_for_a_ticker(monkeypatch):
    # A range spanning more than IMPORT_CHUNK_SESSIONS (31) calendar days is processed
    # in more than one chunk; chunk 1 (Jan) succeeds, chunk 2 (Feb onward) fails for the
    # one ticker involved - chunk 1's rows must already be stored regardless.
    sessions = _weekdays(date(2024, 1, 1), date(2024, 2, 10))
    bars_by_session = _build_bars_by_session({'RELIANCE': {s: 2500.0 for s in sessions}})
    source = _BulkFakeSource(bars_by_session)
    provider = IndiaExchangeProvider(
        'NSE', source=source,
        corporate_actions_store=CorporateActionsStore(client=_FakeCorporateActionsClient({}), today=lambda: date(2024, 6, 1)),
    )

    stored = {}
    monkeypatch.setattr(
        candle_repository, 'store_observed_candles',
        lambda exchange, symbol, timeframe, candles: stored.setdefault((exchange, symbol), []).extend(candles),
    )
    recorded_symbols = []
    monkeypatch.setattr(
        bulk_import, 'record_adjustment_state', lambda exchange, symbol, sig: recorded_symbols.append(symbol),
    )

    real_adjusted = provider.adjusted_candles_for_ticker

    def flaky_adjusted(symbol, ticker, bars):
        if any(bar.session >= date(2024, 2, 1) for bar in bars):
            raise ProviderUnavailableError('simulated outage starting the second chunk')
        return real_adjusted(symbol, ticker, bars)

    monkeypatch.setattr(provider, 'adjusted_candles_for_ticker', flaky_adjusted)

    summary = bulk_import.import_sessions(
        'NSE', date(2024, 1, 1), date(2024, 2, 10), provider=provider, check_adjustments=False,
    )

    stored_dates = {jh.timestamp_to_arrow(c.timestamp).date() for c in stored[('NSE', 'RELIANCE-INR')]}
    assert stored_dates  # chunk 1's January rows made it to storage...
    assert all(d.month == 1 for d in stored_dates)  # ...and none of chunk 2's (failed) February rows did
    assert 'RELIANCE' in summary.failed_tickers
    assert 'RELIANCE-INR' not in recorded_symbols  # dirty (failed in a later chunk) - no state recorded


def test_chunk_date_range_splits_a_long_range_into_bounded_chunks():
    chunks = list(bulk_import._chunk_date_range(date(2024, 1, 1), date(2024, 2, 10), bulk_import.IMPORT_CHUNK_SESSIONS))

    assert chunks == [
        (date(2024, 1, 1), date(2024, 1, 31)),
        (date(2024, 2, 1), date(2024, 2, 10)),
    ]


# --------------------------------------------------------------------------------------
# adjustment_state.refresh_adjustments
# --------------------------------------------------------------------------------------

class _FakeAdjustmentField:
    """Stands in for a peewee model field enough to build the simple `==`/`&`
    expressions `refresh_adjustments` constructs, without a real database.
    """

    def __init__(self, name):
        self.name = name

    def __eq__(self, value):
        return _FakeAdjustmentExpr({self.name: value})


class _FakeAdjustmentExpr:
    def __init__(self, conditions):
        self.conditions = conditions

    def __and__(self, other):
        merged = dict(self.conditions)
        merged.update(other.conditions)
        return _FakeAdjustmentExpr(merged)


class _FakeAdjustmentStateTable:
    """In-memory stand-in for the `IndiaAdjustmentState` peewee model, keyed by
    (exchange, symbol) - avoids touching a real database in these tests.
    """

    exchange = _FakeAdjustmentField('exchange')
    symbol = _FakeAdjustmentField('symbol')

    def __init__(self):
        self.rows: dict[tuple[str, str], SimpleNamespace] = {}

    def get_or_none(self, expr):
        key = (expr.conditions['exchange'], expr.conditions['symbol'])
        return self.rows.get(key)

    def insert(self, **kwargs):
        return _FakeInsertQuery(self, kwargs)


class _FakeInsertQuery:
    def __init__(self, table, kwargs):
        self._table = table
        self._kwargs = kwargs

    def on_conflict(self, **_kwargs):
        return self

    def execute(self):
        key = (self._kwargs['exchange'], self._kwargs['symbol'])
        self._table.rows[key] = SimpleNamespace(**self._kwargs)


class _FakeRefreshProvider:
    """Reports a canned signature per symbol - stands in for
    `IndiaExchangeProvider.adjustment_signature` for `refresh_adjustments` tests.
    """

    def __init__(self, signatures: dict[str, str]):
        self._signatures = signatures

    def adjustment_signature(self, symbol):
        return self._signatures[symbol]


class _FakeAtomicDB:
    """Stands in for `database.db` - `.atomic()` is a context manager that just logs
    its enter/exit into `log`, alongside whatever delete/store/record calls happen
    between them, so a test can assert those three calls happened INSIDE one atomic
    block, in order - without a real database.
    """

    def __init__(self, log: list[str]):
        self._log = log

    @contextmanager
    def atomic(self):
        self._log.append('atomic_enter')
        yield
        self._log.append('atomic_exit')


@pytest.fixture
def fake_atomic_db(monkeypatch):
    """Patches `jesse.services.db.database.db` (what `adjustment_state.py`'s
    `with database.db.atomic():` resolves to) to `_FakeAtomicDB`, and returns the
    shared call/order log every patched call appends to.
    """
    log: list[str] = []
    monkeypatch.setattr(database, 'db', _FakeAtomicDB(log))
    return log


def _build_range_returning(candles_by_symbol: dict, failed_tickers: dict | None = None):
    """A fake `_build_range` that always returns the same canned result, regardless of
    the requested range - `refresh_adjustments` only ever calls it with `wanted_symbols`
    set to exactly one symbol, so one canned result per call is enough for these tests.
    """
    failed_tickers = failed_tickers or {}

    def fake(provider, start_date, end_date, wanted_symbols):
        return SimpleNamespace(candles_by_symbol=dict(candles_by_symbol), failed_tickers=dict(failed_tickers))

    return fake


def test_refresh_adjustments_skips_a_symbol_with_no_recorded_signature(monkeypatch):
    # No prior IndiaAdjustmentState row at all (e.g. a symbol whose import just
    # finished this instant, before the caller records its current signature) - there
    # is nothing to compare against, so this must NOT be treated as "changed".
    fake_table = _FakeAdjustmentStateTable()
    monkeypatch.setattr(adjustment_state, 'IndiaAdjustmentState', fake_table)
    monkeypatch.setattr(candle_repository, 'get_stored_symbols', lambda exchange: ['ALLCARGO-INR'])
    delete_calls = []
    monkeypatch.setattr(candle_repository, 'delete_candles_from_db', lambda exchange, symbol: delete_calls.append(symbol))
    build_calls = []
    monkeypatch.setattr(bulk_import, '_build_range', lambda *a, **k: build_calls.append(1))
    provider = _FakeRefreshProvider({'ALLCARGO-INR': 'some-signature'})

    result = adjustment_state.refresh_adjustments('NSE', provider=provider)

    assert result.reimported == []
    assert result.failed == {}
    assert delete_calls == []
    assert build_calls == []  # never even attempts a build - nothing to compare against


def test_refresh_adjustments_restricts_to_the_given_symbols(monkeypatch):
    fake_table = _FakeAdjustmentStateTable()
    # All three have a recorded signature that differs from the provider's current one
    # below, so every one of them WOULD be reimported if not for the `symbols` filter.
    for symbol in ('ALLCARGO-INR', 'RELIANCE-INR', 'NIFTY-INR'):
        fake_table.rows[('NSE', symbol)] = SimpleNamespace(signature='stale-signature')
    monkeypatch.setattr(adjustment_state, 'IndiaAdjustmentState', fake_table)
    monkeypatch.setattr(
        candle_repository, 'get_stored_symbols', lambda exchange: ['ALLCARGO-INR', 'RELIANCE-INR', 'NIFTY-INR'],
    )
    monkeypatch.setattr(
        candle_repository, 'get_candle_timestamp_bounds', lambda exchange, symbol, timeframe: (1_000, 2_000),
    )
    monkeypatch.setattr(candle_repository, 'delete_candles_from_db', lambda exchange, symbol: None)
    monkeypatch.setattr(candle_repository, 'store_observed_candles', lambda exchange, symbol, timeframe, candles: None)
    monkeypatch.setattr(adjustment_state, 'record_adjustment_state', lambda *a, **k: None)
    monkeypatch.setattr(bulk_import, '_build_range', _build_range_returning({'RELIANCE-INR': ['candle']}))
    monkeypatch.setattr(database, 'db', _FakeAtomicDB([]))
    provider = _FakeRefreshProvider({'ALLCARGO-INR': 'sig-a', 'RELIANCE-INR': 'sig-b', 'NIFTY-INR': 'sig-c'})

    result = adjustment_state.refresh_adjustments('NSE', ['RELIANCE-INR'], provider=provider)

    assert result.reimported == ['RELIANCE-INR']  # ALLCARGO/NIFTY excluded by the `symbols` filter, not visited at all


def test_refresh_adjustments_success_atomically_replaces_rows_and_signature(monkeypatch, fake_atomic_db):
    fake_table = _FakeAdjustmentStateTable()
    fake_table.rows[('NSE', 'ALLCARGO-INR')] = SimpleNamespace(signature='old-signature')
    monkeypatch.setattr(adjustment_state, 'IndiaAdjustmentState', fake_table)
    monkeypatch.setattr(candle_repository, 'get_stored_symbols', lambda exchange: ['ALLCARGO-INR'])
    monkeypatch.setattr(
        candle_repository, 'get_candle_timestamp_bounds', lambda exchange, symbol, timeframe: (1_000, 2_000),
    )
    log = fake_atomic_db
    monkeypatch.setattr(
        candle_repository, 'delete_candles_from_db', lambda exchange, symbol: log.append(f'delete:{symbol}'),
    )
    monkeypatch.setattr(
        candle_repository, 'store_observed_candles',
        lambda exchange, symbol, timeframe, candles: log.append(f'store:{symbol}:{len(candles)}'),
    )
    monkeypatch.setattr(
        adjustment_state, 'record_adjustment_state',
        lambda exchange, symbol, signature: log.append(f'record:{symbol}:{signature}'),
    )
    monkeypatch.setattr(
        bulk_import, '_build_range', _build_range_returning({'ALLCARGO-INR': ['candle-1', 'candle-2']}),
    )
    provider = _FakeRefreshProvider({'ALLCARGO-INR': 'new-signature'})

    result = adjustment_state.refresh_adjustments('NSE', provider=provider)

    assert result.reimported == ['ALLCARGO-INR']
    assert result.failed == {}
    # delete + store + record all happened INSIDE one atomic block, in that order.
    assert log == [
        'atomic_enter', 'delete:ALLCARGO-INR', 'store:ALLCARGO-INR:2', 'record:ALLCARGO-INR:new-signature',
        'atomic_exit',
    ]


def test_refresh_adjustments_build_failure_leaves_old_rows_and_signature_untouched(monkeypatch, fake_atomic_db):
    fake_table = _FakeAdjustmentStateTable()
    fake_table.rows[('NSE', 'ALLCARGO-INR')] = SimpleNamespace(signature='old-signature')
    monkeypatch.setattr(adjustment_state, 'IndiaAdjustmentState', fake_table)
    monkeypatch.setattr(candle_repository, 'get_stored_symbols', lambda exchange: ['ALLCARGO-INR'])
    monkeypatch.setattr(
        candle_repository, 'get_candle_timestamp_bounds', lambda exchange, symbol, timeframe: (1_000, 2_000),
    )
    delete_calls = []
    store_calls = []
    record_calls = []
    monkeypatch.setattr(candle_repository, 'delete_candles_from_db', lambda exchange, symbol: delete_calls.append(symbol))
    monkeypatch.setattr(
        candle_repository, 'store_observed_candles',
        lambda exchange, symbol, timeframe, candles: store_calls.append(symbol),
    )
    monkeypatch.setattr(adjustment_state, 'record_adjustment_state', lambda *a, **k: record_calls.append(a))
    monkeypatch.setattr(
        bulk_import, '_build_range', _build_range_returning({}, failed_tickers={'ALLCARGO': 'corporate actions API is down'}),
    )
    provider = _FakeRefreshProvider({'ALLCARGO-INR': 'new-signature'})

    result = adjustment_state.refresh_adjustments('NSE', provider=provider)

    assert result.reimported == []
    assert result.failed == {'ALLCARGO-INR': 'corporate actions API is down'}
    # Nothing was ever touched: no delete, no store, no new signature, and the atomic
    # block was never even entered (the build failed BEFORE any database work).
    assert delete_calls == []
    assert store_calls == []
    assert record_calls == []
    assert fake_atomic_db == []
    # The OLD signature is still exactly what it was - retried on the next run.
    assert fake_table.rows[('NSE', 'ALLCARGO-INR')].signature == 'old-signature'


def test_refresh_adjustments_mixed_batch_reimports_one_and_reports_the_others_failure(monkeypatch, fake_atomic_db):
    fake_table = _FakeAdjustmentStateTable()
    fake_table.rows[('NSE', 'ALLCARGO-INR')] = SimpleNamespace(signature='old-signature')
    fake_table.rows[('NSE', 'PGIL-INR')] = SimpleNamespace(signature='old-signature-2')
    monkeypatch.setattr(adjustment_state, 'IndiaAdjustmentState', fake_table)
    monkeypatch.setattr(candle_repository, 'get_stored_symbols', lambda exchange: ['ALLCARGO-INR', 'PGIL-INR'])
    monkeypatch.setattr(
        candle_repository, 'get_candle_timestamp_bounds', lambda exchange, symbol, timeframe: (1_000, 2_000),
    )
    monkeypatch.setattr(candle_repository, 'delete_candles_from_db', lambda exchange, symbol: None)
    monkeypatch.setattr(candle_repository, 'store_observed_candles', lambda exchange, symbol, timeframe, candles: None)
    monkeypatch.setattr(adjustment_state, 'record_adjustment_state', lambda *a, **k: None)

    def fake_build_range(provider, start_date, end_date, wanted_symbols):
        symbol = next(iter(wanted_symbols))
        if symbol == 'ALLCARGO-INR':
            return SimpleNamespace(candles_by_symbol={symbol: ['candle']}, failed_tickers={})
        return SimpleNamespace(candles_by_symbol={}, failed_tickers={'PGIL': 'corporate actions API is down'})

    monkeypatch.setattr(bulk_import, '_build_range', fake_build_range)
    provider = _FakeRefreshProvider({'ALLCARGO-INR': 'new-signature', 'PGIL-INR': 'new-signature-2'})

    result = adjustment_state.refresh_adjustments('NSE', provider=provider)

    assert result.reimported == ['ALLCARGO-INR']
    assert result.failed == {'PGIL-INR': 'corporate actions API is down'}
    assert fake_table.rows[('NSE', 'PGIL-INR')].signature == 'old-signature-2'  # untouched


# --------------------------------------------------------------------------------------
# Aggregation: 1D matches the stored daily bar; 1W's epoch (Thursday) alignment
# --------------------------------------------------------------------------------------

def _one_row_candle_array(session: date, bar: DailyBar) -> np.ndarray:
    timestamp = session_row_timestamp(session)
    return np.array([[timestamp, bar.open, bar.close, bar.high, bar.low, bar.volume]])


def test_1d_aggregation_of_the_stored_session_row_equals_the_daily_bar():
    session = date(2024, 1, 3)  # a Wednesday
    bar = DailyBar(session, 100.0, 110.0, 95.0, 105.0, 12_345.0)
    candles = _one_row_candle_array(session, bar)

    generated = candle_service.generate_candle_from_observed_minutes('1D', candles)

    assert generated[1] == bar.open
    assert generated[2] == bar.close
    assert generated[3] == bar.high
    assert generated[4] == bar.low
    assert generated[5] == bar.volume
    # The 1D bucket this session's 09:59 UTC row falls into starts at UTC midnight of
    # the SAME calendar day - i.e. the correct IST trading day (see validators.py).
    bucket_start = jh.timestamp_to_arrow(int(generated[0]))
    assert bucket_start.format('YYYY-MM-DD') == '2024-01-03'
    assert bucket_start.format('HH:mm:ss') == '00:00:00'


def test_1w_bucket_is_epoch_thursday_anchored_not_monday_of_the_trading_week():
    # 2024-01-03 (Wed) falls in the Mon 1-Jan..Fri 5-Jan trading week; a Monday-aligned
    # weekly candle would bucket it to 2024-01-01. It does not.
    session = date(2024, 1, 3)
    bar = DailyBar(session, 1.0, 1.0, 1.0, 1.0, 1.0)
    candles = _one_row_candle_array(session, bar)

    generated = candle_service.generate_candle_from_observed_minutes('1W', candles)

    bucket_start = jh.timestamp_to_arrow(int(generated[0]))
    assert bucket_start.format('YYYY-MM-DD') == '2023-12-28'
    assert bucket_start.format('dddd') == 'Thursday'  # NOT Monday - epoch (1970-01-01) was a Thursday


def test_daily_bars_only_allowed_timeframes_matches_the_bucket_alignment_evidence_above():
    # 1D and 1W are allowed (1W via Monday-aligned bucketing - see
    # jh.timeframe_bucket_start/story #67); 3D stays forbidden. See
    # validators.py's DAILY_BARS_ONLY_ALLOWED_TIMEFRAMES comment and the
    # aggregation tests directly above for the bucket-math evidence why.
    assert validators.DAILY_BARS_ONLY_ALLOWED_TIMEFRAMES == ('1D', '1W')


# --------------------------------------------------------------------------------------
# Route validation: daily-bars-only exchange timeframe rule
# --------------------------------------------------------------------------------------

class _FakeRouter:
    def __init__(self, routes, data_routes=None):
        self.routes = routes
        self.data_routes = data_routes or []


@pytest.fixture
def daily_bars_only_exchange_info(monkeypatch):
    from jesse import info as info_module

    patched = dict(info_module.exchange_info)
    patched['NSE'] = {'daily_bars_only': True}
    monkeypatch.setattr(info_module, 'exchange_info', patched)
    return 'NSE'


@pytest.mark.parametrize('timeframe', ['1m', '1h', '4h', '3D'])
def test_validate_routes_rejects_disallowed_timeframes_on_a_daily_bars_only_exchange(
    daily_bars_only_exchange_info, timeframe,
):
    exchange = daily_bars_only_exchange_info
    router = _FakeRouter([Route(exchange, 'RELIANCE-INR', timeframe, 'SomeStrategy')])

    with pytest.raises(Exception, match=exchange):
        validators.validate_routes(router)


def test_validate_routes_rejects_disallowed_timeframe_on_a_data_route_too(daily_bars_only_exchange_info):
    exchange = daily_bars_only_exchange_info
    router = _FakeRouter(
        routes=[Route(exchange, 'RELIANCE-INR', '1D', 'SomeStrategy')],
        data_routes=[Route(exchange, 'NIFTY-INR', '1h')],
    )

    with pytest.raises(Exception, match='1h'):
        validators.validate_routes(router)


def test_validate_routes_accepts_1d_on_a_daily_bars_only_exchange(daily_bars_only_exchange_info):
    exchange = daily_bars_only_exchange_info
    router = _FakeRouter([Route(exchange, 'RELIANCE-INR', '1D', 'SomeStrategy')])

    validators.validate_routes(router)  # must not raise


def test_validate_routes_accepts_1w_on_a_daily_bars_only_exchange(daily_bars_only_exchange_info):
    # Story #67: 1W is now Monday-aligned and accepted, same as 1D.
    exchange = daily_bars_only_exchange_info
    router = _FakeRouter([Route(exchange, 'RELIANCE-INR', '1W', 'SomeStrategy')])

    validators.validate_routes(router)  # must not raise


def test_validate_routes_is_unaffected_for_a_non_daily_bars_only_exchange():
    router = _FakeRouter([Route('Binance Spot', 'BTC-USDT', '1m', 'SomeStrategy')])

    validators.validate_routes(router)  # must not raise - crypto exchanges are untouched


def test_is_daily_bars_only_defaults_to_false_for_an_unregistered_exchange():
    assert validators.is_daily_bars_only('Some Exchange Not In exchange_info') is False


# --------------------------------------------------------------------------------------
# import_candles_mode's post-import adjustment-state hook never fails the import
# --------------------------------------------------------------------------------------

import jesse.modes.import_candles_mode as importer  # noqa: E402  (grouped with the tests that need it)


def test_record_india_adjustment_state_swallows_an_internal_exception():
    class _BoomProvider(IndiaExchangeProvider):
        def __init__(self):
            pass  # deliberately skip the real __init__ - never touches a real source

        def adjustment_signature(self, symbol):
            raise RuntimeError('boom')

    # Must not raise, despite `adjustment_signature` blowing up internally.
    importer._record_india_adjustment_state('NSE', 'RELIANCE-INR', _BoomProvider())


def test_record_india_adjustment_state_is_a_noop_for_a_non_india_provider():
    calls = []

    class _NotIndia:
        pass

    importer._record_india_adjustment_state('Binance Spot', 'BTC-USDT', _NotIndia())
    assert calls == []  # nothing to assert beyond "it returned without raising"


class _HookTestSource(IndiaDailySource):
    """A minimal real `IndiaDailySource` (no network) so `_run`'s whole pipeline can
    run against a genuine `IndiaExchangeProvider` instance - needed because the hook's
    `isinstance(provider, IndiaExchangeProvider)` check can't be faked with a bare
    double.
    """

    source_id = 'fake-hook-test'
    exchange = 'NSE'
    prices_adjusted = False

    def fetch_daily_bars(self, ticker, sessions):
        if not sessions:
            return []
        return [DailyBar(sessions[0], 100.0, 101.0, 99.0, 100.5, 10.0)]


def test_run_still_reports_success_when_the_adjustment_state_hook_raises(monkeypatch):
    # An explicit (fake, no-network) corporate_actions_store is required here: without
    # one, IndiaExchangeProvider defaults to the shared process-wide CorporateActionsStore,
    # which would make a REAL network call the moment adjustment resolution is attempted
    # (this source's `exchange == 'NSE'` always resolves an NSE symbol for itself).
    store = CorporateActionsStore(client=_FakeCorporateActionsClient({}), today=lambda: date(2024, 6, 1))
    provider = IndiaExchangeProvider('NSE', source=_HookTestSource(), corporate_actions_store=store)
    provider.name = 'NSE'  # import_candles_mode identifies a provider by `.name`
    monkeypatch.setattr(
        provider, 'adjustment_signature', lambda symbol: (_ for _ in ()).throw(RuntimeError('signature boom')),
    )

    fixed_now = arrow.get('2024-01-02T00:00:00Z')
    state = {'bounds': (None, None), 'stored': []}
    outcomes = []

    monkeypatch.setattr(importer, 'historical_provider_names', [provider.name])
    monkeypatch.setattr(
        importer, 'build_historical_provider_registry', lambda provider_ids: SimpleNamespace(get=lambda pid: provider),
    )
    monkeypatch.setattr(
        importer.candle_repository, 'get_candle_timestamp_bounds', lambda exchange, symbol, timeframe: state['bounds'],
    )
    monkeypatch.setattr(
        importer.candle_repository, 'store_observed_candles',
        lambda exchange, symbol, timeframe, candles: state['stored'].extend(candles),
    )
    monkeypatch.setattr(importer.arrow, 'utcnow', lambda: fixed_now)
    monkeypatch.setattr(importer.time, 'sleep', lambda seconds: None)
    monkeypatch.setattr(importer, 'sync_publish', lambda event, payload: None)
    monkeypatch.setattr(importer, 'is_process_active', lambda client_id: True)
    monkeypatch.setattr(importer, 'register_custom_exception_handler', lambda: None)
    monkeypatch.setattr(importer.store.app, 'set_session_id', lambda value: None)
    monkeypatch.setattr(database, 'open_connection', lambda: None)
    monkeypatch.setattr(database, 'close_connection', lambda: None)
    monkeypatch.setattr(importer, 'store_import_outcome', lambda client_id, status, *a, **k: outcomes.append(status))

    result = importer.run('client-hook-raises', 'NSE', 'RELIANCE-INR', '2024-01-01', running_via_dashboard=True)

    assert outcomes == ['running', 'finished']  # never 'failed', despite the hook raising internally
    assert result['processed_candles'] > 0
    assert len(state['stored']) > 0
