"""Tests for jesse/services/historical_data/india/universes.py (dev-pmallapp/jesse#14
- index universes with point-in-time membership). No network access: a fake client
serves fixture CSV bytes, same style as test_india_nse_indices.py/
test_india_bse_bhavcopy.py. `tmp_path` stands in for the snapshot store, and "today"
is frozen via monkeypatching the module's own `_today()` (see that function's
docstring for why it exists).
"""
from datetime import date, timedelta
from pathlib import Path

import pytest

from jesse.services.historical_data.errors import HistoricalDataRequestError, ProviderUnavailableError
from jesse.services.historical_data.india.nse_indices import _canonical_name, _derive_ticker
from jesse.services.historical_data.india.symbols import to_jesse_symbol
from jesse.services.historical_data.india import universes as universes_module
from jesse.services.historical_data.india.universes import (
    _UNIVERSE_REGISTRY,
    _last_trading_day_of_month,
    _next_boundary,
    _period_start,
    list_universes,
    universe,
)

FIXTURES_DIR = Path(__file__).parent / 'fixtures' / 'india'


def _read_fixture(name: str) -> bytes:
    return (FIXTURES_DIR / name).read_bytes()


# A synthetic constituents CSV (real schema, invented rows) covering: a hyphenated
# ticker (BAJAJ-AUTO, the case symbols.py's '-' -> '_' encoding exists for), a
# duplicate-ticker row (must be deduped, first occurrence wins), and a
# blank/malformed row (must be skipped, not raise).
_SYNTHETIC_CSV = (
    b'Company Name,Industry,Symbol,Series,ISIN Code\n'
    b'Reliance Industries Ltd.,Oil Gas & Consumable Fuels,RELIANCE,EQ,INE002A01018\n'
    b'Bajaj Auto Ltd.,Automobile and Auto Components,BAJAJ-AUTO,EQ,INE917I01010\n'
    b'Reliance Industries Ltd.,Oil Gas & Consumable Fuels,RELIANCE,EQ,INE002A01018\n'
    b',,,,\n'
)


class FakeIndiaHttpClient:
    """Stands in for IndiaHttpClient.get - returns scripted payloads and records call
    order. `files` maps an exact URL to its payload (bytes, or None for "not
    published"). A URL not in `files` raises, so a test never silently makes an
    unexpected network-shaped call.
    """

    def __init__(self, files: dict[str, bytes | None]):
        self._files = files
        self.calls: list[str] = []

    def get(self, url: str, *, expect: str, referer: str | None = None) -> bytes | None:
        self.calls.append(url)
        if url not in self._files:
            raise AssertionError(f'Unexpected request to {url!r}')
        return self._files[url]


class _FailingIndiaHttpClient:
    """Simulates a provider outage: `.get()` raises `ProviderUnavailableError`, the
    same as the real `IndiaHttpClient` does on a connection failure or a persistent
    5xx (see http.py) - as opposed to `FakeIndiaHttpClient`'s `None` payload, which
    stands in for a soft-404 (holiday/never-existed file).
    """

    def __init__(self):
        self.calls: list[str] = []

    def get(self, url: str, *, expect: str, referer: str | None = None) -> bytes | None:
        self.calls.append(url)
        raise ProviderUnavailableError(f'{url} is currently unavailable')


def _url_for(universe_name: str) -> str:
    spec = _UNIVERSE_REGISTRY[universe_name]
    return f'https://nsearchives.nseindia.com/content/indices/{spec.constituents_file}'


def _freeze_today(monkeypatch: pytest.MonkeyPatch, today: date) -> None:
    monkeypatch.setattr(universes_module, '_today', lambda: today)


# --------------------------------------------------------------------------------------
# name normalization / unknown-name error
# --------------------------------------------------------------------------------------

def test_list_universes_is_sorted_and_covers_the_registry():
    assert list_universes() == tuple(sorted(_UNIVERSE_REGISTRY))
    assert 'NIFTY ALPHA 50' in list_universes()


def test_name_lookup_is_case_and_whitespace_insensitive(monkeypatch, tmp_path):
    today = date(2026, 9, 24)
    _freeze_today(monkeypatch, today)
    client = FakeIndiaHttpClient({_url_for('NIFTY ALPHA 50'): _SYNTHETIC_CSV})

    lower = universe('nifty alpha 50', today, snapshot_dir=tmp_path, http_client=client)
    underscored = universe('NIFTY_ALPHA_50', today, snapshot_dir=tmp_path, http_client=client)

    assert lower.name == 'NIFTY ALPHA 50'
    assert underscored.name == 'NIFTY ALPHA 50'
    # Only one fetch: the second call reads the snapshot the first call already wrote.
    assert client.calls == [_url_for('NIFTY ALPHA 50')]


def test_unknown_universe_name_raises_with_valid_names_listed(tmp_path):
    with pytest.raises(HistoricalDataRequestError) as excinfo:
        universe('NIFTY500 ALPHA 30', snapshot_dir=tmp_path, http_client=FakeIndiaHttpClient({}))

    message = str(excinfo.value)
    assert 'NIFTY500 ALPHA 30' in message
    # "NIFTY500 Alpha 30" does not exist (D6/spike #41) - confirms it's not silently
    # accepted, and that the error lists the real, supported names.
    assert 'NIFTY ALPHA 50' in message
    assert 'NIFTY200 ALPHA 30' in message


# --------------------------------------------------------------------------------------
# parsing
# --------------------------------------------------------------------------------------

def test_parsing_fixture_yields_bare_tickers_and_internal_symbols(monkeypatch, tmp_path):
    today = date(2026, 9, 24)
    _freeze_today(monkeypatch, today)
    payload = _read_fixture('niftyindices_niftyalpha50_constituents_20260924.csv')
    client = FakeIndiaHttpClient({_url_for('NIFTY ALPHA 50'): payload})

    result = universe('NIFTY ALPHA 50', today, snapshot_dir=tmp_path, http_client=client)

    assert len(result.members) == 50
    assert 'AUBANK' in result.tickers
    assert 'AUBANK-INR' in result.symbols
    first = result.members[0]
    assert first.ticker == 'AUBANK'
    assert first.symbol == 'AUBANK-INR'
    assert first.company
    assert first.industry
    assert first.series == 'EQ'
    assert first.isin


def test_parsing_handles_hyphenated_ticker_duplicate_and_blank_rows(monkeypatch, tmp_path):
    today = date(2026, 9, 24)
    _freeze_today(monkeypatch, today)
    client = FakeIndiaHttpClient({_url_for('NIFTY ALPHA 50'): _SYNTHETIC_CSV})

    result = universe('NIFTY ALPHA 50', today, snapshot_dir=tmp_path, http_client=client)

    # Blank row skipped, duplicate RELIANCE row deduped -> exactly 2 members.
    assert len(result.members) == 2
    by_ticker = {member.ticker: member for member in result.members}
    assert by_ticker['BAJAJ-AUTO'].symbol == 'BAJAJ_AUTO-INR'
    assert by_ticker['RELIANCE'].symbol == 'RELIANCE-INR'


# --------------------------------------------------------------------------------------
# snapshot store: write-once-per-day, refresh
# --------------------------------------------------------------------------------------

def test_fetch_writes_a_dated_snapshot_file(monkeypatch, tmp_path):
    today = date(2026, 9, 24)
    _freeze_today(monkeypatch, today)
    client = FakeIndiaHttpClient({_url_for('NIFTY ALPHA 50'): _SYNTHETIC_CSV})

    universe('NIFTY ALPHA 50', today, snapshot_dir=tmp_path, http_client=client)

    snapshot_path = tmp_path / 'nifty-alpha-50' / '2026-09-24.csv'
    assert snapshot_path.exists()
    assert snapshot_path.read_bytes() == _SYNTHETIC_CSV
    assert client.calls == [_url_for('NIFTY ALPHA 50')]


def test_same_day_call_does_not_refetch(monkeypatch, tmp_path):
    today = date(2026, 9, 24)
    _freeze_today(monkeypatch, today)
    client = FakeIndiaHttpClient({_url_for('NIFTY ALPHA 50'): _SYNTHETIC_CSV})

    universe('NIFTY ALPHA 50', today, snapshot_dir=tmp_path, http_client=client)
    universe('NIFTY ALPHA 50', today, snapshot_dir=tmp_path, http_client=client)

    assert client.calls == [_url_for('NIFTY ALPHA 50')]


def test_refresh_true_refetches_and_overwrites_todays_snapshot(monkeypatch, tmp_path):
    today = date(2026, 9, 24)
    _freeze_today(monkeypatch, today)
    updated_csv = _SYNTHETIC_CSV + b'Tata Motors Ltd.,Automobile and Auto Components,TATAMOTORS,EQ,INE155A01022\n'
    client = FakeIndiaHttpClient({_url_for('NIFTY ALPHA 50'): _SYNTHETIC_CSV})

    universe('NIFTY ALPHA 50', today, snapshot_dir=tmp_path, http_client=client)

    client_v2 = FakeIndiaHttpClient({_url_for('NIFTY ALPHA 50'): updated_csv})
    result = universe('NIFTY ALPHA 50', today, refresh=True, snapshot_dir=tmp_path, http_client=client_v2)

    assert client_v2.calls == [_url_for('NIFTY ALPHA 50')]
    assert (tmp_path / 'nifty-alpha-50' / '2026-09-24.csv').read_bytes() == updated_csv
    assert any(member.ticker == 'TATAMOTORS' for member in result.members)


# --------------------------------------------------------------------------------------
# today/refresh fetch failure: fall back to an existing current-period snapshot
# --------------------------------------------------------------------------------------

def test_today_fetch_failure_falls_back_to_existing_current_period_snapshot(monkeypatch, tmp_path):
    # NIFTY ALPHA 50 is quarterly; 2026-09-20 sits in the same Jun30-Sep30 period as
    # today (2026-09-24). A provider outage on the today fetch shouldn't hard-fail when
    # that same-period snapshot is already on disk - it's still exact point-in-time data.
    _write_snapshot(tmp_path, 'nifty-alpha-50', date(2026, 9, 20))
    today = date(2026, 9, 24)
    _freeze_today(monkeypatch, today)
    client = _FailingIndiaHttpClient()

    result = universe('NIFTY ALPHA 50', snapshot_dir=tmp_path, http_client=client)

    assert result.snapshot_date == date(2026, 9, 20)
    assert result.used_current_members is False
    assert client.calls == [_url_for('NIFTY ALPHA 50')]


def test_today_fetch_failure_raises_when_no_current_period_snapshot_exists(monkeypatch, tmp_path):
    # Only a snapshot from an earlier period (well before the Jun30-Sep30 period today
    # sits in) exists - nothing usable for the current period, so the failure must
    # still propagate rather than silently falling back to stale, wrong-period data.
    _write_snapshot(tmp_path, 'nifty-alpha-50', date(2025, 10, 1))
    today = date(2026, 9, 24)
    _freeze_today(monkeypatch, today)
    client = _FailingIndiaHttpClient()

    with pytest.raises(ProviderUnavailableError):
        universe('NIFTY ALPHA 50', snapshot_dir=tmp_path, http_client=client)


def test_refresh_true_falls_back_to_existing_snapshot_when_fetch_fails(monkeypatch, tmp_path):
    # refresh=True bypasses the "already have today's file" early return and always
    # re-fetches - the same current-period fallback must still apply if that re-fetch
    # fails, rather than losing the snapshot that was already on disk.
    today = date(2026, 9, 24)
    _write_snapshot(tmp_path, 'nifty-alpha-50', today)
    _freeze_today(monkeypatch, today)
    client = _FailingIndiaHttpClient()

    result = universe('NIFTY ALPHA 50', refresh=True, snapshot_dir=tmp_path, http_client=client)

    assert result.snapshot_date == today
    assert result.used_current_members is False
    assert client.calls == [_url_for('NIFTY ALPHA 50')]


# --------------------------------------------------------------------------------------
# point-in-time resolution
# --------------------------------------------------------------------------------------

def _write_snapshot(tmp_path: Path, slug: str, snapshot_date: date, payload: bytes = _SYNTHETIC_CSV) -> None:
    directory = tmp_path / slug
    directory.mkdir(parents=True, exist_ok=True)
    (directory / f'{snapshot_date.isoformat()}.csv').write_bytes(payload)


def test_as_of_in_same_rebalance_period_uses_that_snapshot_without_current_members_flag(monkeypatch, tmp_path):
    # NIFTY ALPHA 50 is quarterly (Mar/Jun/Sep/Dec); last trading day of Mar-2024 is
    # 2024-03-28 (confirmed below to land on a holiday-adjusted date), so 2024-04-15
    # (mid-April) and 2024-05-01 both sit in the same Mar28-Jun28 period.
    _write_snapshot(tmp_path, 'nifty-alpha-50', date(2024, 4, 15))
    monkeypatch.setattr(universes_module, '_today', lambda: date(2026, 9, 24))

    result = universe('NIFTY ALPHA 50', date(2024, 5, 1), snapshot_dir=tmp_path, http_client=FakeIndiaHttpClient({}))

    assert result.snapshot_date == date(2024, 4, 15)
    assert result.used_current_members is False


def test_as_of_before_a_same_period_snapshot_is_still_exact_not_survivorship(monkeypatch, tmp_path):
    # Bug fix: only a 2024-04-15 snapshot exists (Mar28-Jun28 quarter) and as_of
    # (2024-04-01) sits earlier in that SAME period. Membership is constant within a
    # period, so this is real point-in-time data - used_current_members must be False,
    # not the True/survivorship flag a later-PERIOD fallback gets.
    _write_snapshot(tmp_path, 'nifty-alpha-50', date(2024, 4, 15))
    monkeypatch.setattr(universes_module, '_today', lambda: date(2026, 9, 24))

    result = universe('NIFTY ALPHA 50', date(2024, 4, 1), snapshot_dir=tmp_path, http_client=FakeIndiaHttpClient({}))

    assert result.snapshot_date == date(2024, 4, 15)
    assert result.used_current_members is False


def test_as_of_in_an_earlier_period_falls_back_to_the_nearest_later_snapshot(monkeypatch, tmp_path):
    # Only a Apr-2024 snapshot exists (Mar28-Jun28 period); asking for Jan-2024 (an
    # earlier, uncaptured Dec29-Mar28 period) must fall back to that later snapshot
    # and flag it, not silently claim it's point-in-time.
    _write_snapshot(tmp_path, 'nifty-alpha-50', date(2024, 4, 15))
    monkeypatch.setattr(universes_module, '_today', lambda: date(2026, 9, 24))

    result = universe('NIFTY ALPHA 50', date(2024, 1, 15), snapshot_dir=tmp_path, http_client=FakeIndiaHttpClient({}))

    assert result.snapshot_date == date(2024, 4, 15)
    assert result.used_current_members is True


def test_semiannual_and_quarterly_boundaries_differ_for_the_same_as_of(monkeypatch, tmp_path):
    # 2024-07-15 sits after NIFTY ALPHA 50's (quarterly) June boundary but before
    # NIFTY 50's (semi-annual) September boundary - the two universes must therefore
    # resolve to snapshots from different periods for the identical as_of date.
    as_of = date(2024, 7, 15)
    monkeypatch.setattr(universes_module, '_today', lambda: date(2026, 9, 24))
    _write_snapshot(tmp_path, 'nifty-alpha-50', date(2024, 6, 28))  # start of the Jun28-Sep30 quarter
    _write_snapshot(tmp_path, 'nifty-50', date(2024, 4, 1))  # inside the Mar28-Sep30 half-year

    alpha_result = universe('NIFTY ALPHA 50', as_of, snapshot_dir=tmp_path, http_client=FakeIndiaHttpClient({}))
    fifty_result = universe('NIFTY 50', as_of, snapshot_dir=tmp_path, http_client=FakeIndiaHttpClient({}))

    assert alpha_result.snapshot_date == date(2024, 6, 28)
    assert alpha_result.used_current_members is False
    assert fifty_result.snapshot_date == date(2024, 4, 1)
    assert fifty_result.used_current_members is False


def test_boundary_day_itself_belongs_to_the_new_period(monkeypatch, tmp_path):
    # Last trading day of March 2024 is 2024-03-28 (28th; 29th/30th/31st are
    # holiday/weekend - see test_last_trading_day_of_month_skips_holiday_and_weekend).
    boundary = date(2024, 3, 28)
    monkeypatch.setattr(universes_module, '_today', lambda: date(2026, 9, 24))
    _write_snapshot(tmp_path, 'nifty-alpha-50', date(2024, 1, 10))  # prior (Dec29-Mar28) period
    _write_snapshot(tmp_path, 'nifty-alpha-50', boundary)  # exactly the new period's own boundary

    on_boundary = universe('NIFTY ALPHA 50', boundary, snapshot_dir=tmp_path, http_client=FakeIndiaHttpClient({}))
    day_before = universe(
        'NIFTY ALPHA 50', boundary - timedelta(days=1), snapshot_dir=tmp_path, http_client=FakeIndiaHttpClient({}),
    )

    assert on_boundary.snapshot_date == boundary
    assert on_boundary.used_current_members is False
    assert day_before.snapshot_date == date(2024, 1, 10)
    assert day_before.used_current_members is False


def test_last_trading_day_of_month_skips_holiday_and_weekend():
    # 2024-03-31 is a Sunday, 2024-03-30 a Saturday, and 2024-03-29 is Good Friday (an
    # NSE holiday) - all three must be skipped back to the real last session, 28th.
    assert _last_trading_day_of_month(2024, 3) == date(2024, 3, 28)


def test_period_start_and_next_boundary_are_consistent_with_last_trading_day():
    quarterly = _UNIVERSE_REGISTRY['NIFTY ALPHA 50'].rebalance_months
    start = _period_start(date(2024, 7, 15), quarterly)
    assert start == date(2024, 6, 28)
    assert _next_boundary(start, quarterly) == date(2024, 9, 30)


def test_future_as_of_raises(monkeypatch, tmp_path):
    monkeypatch.setattr(universes_module, '_today', lambda: date(2026, 9, 24))

    with pytest.raises(ValueError):
        universe('NIFTY ALPHA 50', date(2026, 9, 25), snapshot_dir=tmp_path, http_client=FakeIndiaHttpClient({}))


def test_as_of_none_uses_todays_date_and_fetches_when_missing(monkeypatch, tmp_path):
    today = date(2026, 9, 24)
    _freeze_today(monkeypatch, today)
    client = FakeIndiaHttpClient({_url_for('NIFTY ALPHA 50'): _SYNTHETIC_CSV})

    result = universe('NIFTY ALPHA 50', snapshot_dir=tmp_path, http_client=client)

    assert result.as_of == today
    assert result.snapshot_date == today
    assert result.used_current_members is False
    assert client.calls == [_url_for('NIFTY ALPHA 50')]


def test_constituents_file_unavailable_raises_provider_error(monkeypatch, tmp_path):
    today = date(2026, 9, 24)
    _freeze_today(monkeypatch, today)
    client = FakeIndiaHttpClient({_url_for('NIFTY ALPHA 50'): None})

    with pytest.raises(ProviderUnavailableError):
        universe('NIFTY ALPHA 50', today, snapshot_dir=tmp_path, http_client=client)


# --------------------------------------------------------------------------------------
# benchmark symbols
# --------------------------------------------------------------------------------------

def test_benchmark_symbols_match_nse_index_source_derivation(monkeypatch, tmp_path):
    today = date(2026, 9, 24)
    _freeze_today(monkeypatch, today)

    # Cross-checked against the real ind_close_all row names for the Alpha family
    # (tests/fixtures/india/nse_ind_close_all_20240101.csv has 'Nifty Alpha 50',
    # 'NIFTY100 Alpha 30', 'Nifty200 Alpha 30' verbatim) using the exact production
    # functions NseIndexSource itself uses to derive a ticker from an index name.
    expectations = {
        'NIFTY 50': 'Nifty 50',
        'NIFTY 100': 'Nifty 100',
        'NIFTY 200': 'Nifty 200',
        'NIFTY 500': 'Nifty 500',
        'NIFTY ALPHA 50': 'Nifty Alpha 50',
        'NIFTY100 ALPHA 30': 'NIFTY100 Alpha 30',
        'NIFTY200 ALPHA 30': 'Nifty200 Alpha 30',
    }
    for universe_name, index_name in expectations.items():
        expected_symbol = to_jesse_symbol(_derive_ticker(_canonical_name(index_name)))
        client = FakeIndiaHttpClient({_url_for(universe_name): _SYNTHETIC_CSV})
        result = universe(universe_name, today, snapshot_dir=tmp_path, http_client=client)
        assert result.benchmark == ('NSE', expected_symbol), universe_name


def test_used_current_members_logs_a_survivorship_bias_warning(monkeypatch, tmp_path, capsys):
    _write_snapshot(tmp_path, 'nifty-alpha-50', date(2024, 4, 15))
    monkeypatch.setattr(universes_module, '_today', lambda: date(2026, 9, 24))

    universe('NIFTY ALPHA 50', date(2024, 1, 15), snapshot_dir=tmp_path, http_client=FakeIndiaHttpClient({}))

    # jh.debug writes to both stdout and the log file (jesse/helpers.py); stdout is
    # the cheap, deterministic thing to assert on here.
    captured = capsys.readouterr()
    assert 'survivorship bias' in captured.out.lower()


# --------------------------------------------------------------------------------------
# boot-path isolation
# --------------------------------------------------------------------------------------

def test_plain_import_jesse_research_does_not_load_india_modules():
    """Mirrors test_india_exchange_registration.py's boot-path test: `import jesse`/
    `import jesse.research` must never pull in the India package - `research.universe`/
    `research.list_universes` import it lazily inside their own function bodies (see
    jesse/research/universes.py's module docstring). Run in a fresh subprocess so this
    test file's own module-level India imports above don't make the assertion
    trivially true within this process.
    """
    import subprocess
    import sys

    result = subprocess.run(
        [
            sys.executable, '-c',
            "import jesse.research, sys; "
            "assert 'jesse.services.historical_data.india' not in sys.modules; "
            "assert 'jesse.markets.india' not in sys.modules",
        ],
        cwd=str(Path(__file__).resolve().parents[1]),
        capture_output=True,
        text=True,
        timeout=60,
    )

    assert result.returncode == 0, f'stdout={result.stdout!r} stderr={result.stderr!r}'
