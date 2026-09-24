import json
from types import SimpleNamespace

import arrow
import pytest

from jesse import exceptions
import jesse.modes.import_candles_mode as importer
from jesse.services.historical_data import (
    HistoricalCandle,
    HistoricalCandleBatch,
    HistoricalCandleProvider,
    ProviderCapabilities,
)


class _Expression:
    def __or__(self, other):
        return self


class _Field:
    def __init__(self, state):
        self.state = state

    def __eq__(self, other):
        return _Expression()

    def is_null(self):
        return _Expression()

    def between(self, start, end):
        self.state['range'] = (start, end)
        return _Expression()

    def asc(self):
        return self


def _candle_model(state):
    """Build a state-backed Peewee fake for page counts and backup-range reads."""
    class CountQuery:
        def where(self, *expressions):
            return self

        def count(self):
            start, _ = state['range']
            return state['counts'].get(start, 0)

    class TupleQuery:
        def where(self, *expressions):
            return self

        def order_by(self, *fields):
            return self

        def tuples(self):
            return list(state.get('tuples', []))

    class Candle:
        exchange = _Field(state)
        symbol = _Field(state)
        timeframe = _Field(state)
        timestamp = _Field(state)
        open = _Field(state)
        close = _Field(state)
        high = _Field(state)
        low = _Field(state)
        volume = _Field(state)

        @classmethod
        def select(cls, *fields):
            return TupleQuery() if fields else CountQuery()

    return Candle


class _FakeDriver(HistoricalCandleProvider):
    """Return deterministic pages whose size exposes pagination and resume errors.

    A minimal `HistoricalCandleProvider` (mirrors the shape any real provider, e.g.
    `IndiaExchangeProvider`, implements) rather than a legacy per-exchange adapter -
    Jesse no longer ships any of those.
    """

    def __init__(self, fetches, count=720, starting_time=None):
        self.name = 'Fake Provider'
        self.provider_id = self.name
        self.capabilities = ProviderCapabilities(
            native_timeframes=('1m',),
            max_candles_per_request=count,
        )
        self.count = count
        self.fetches = fetches
        self.starting_time = starting_time

    def fetch(self, symbol, start_timestamp, timeframe='1m'):
        self.fetches.append((symbol, start_timestamp, timeframe))
        return self._rows(symbol, start_timestamp, timeframe)

    def _rows(self, symbol, start_timestamp, timeframe):
        return [
            {
                'timestamp': start_timestamp + i * 60_000,
                'open': float(i + 1),
                'close': float(i + 2),
                'high': float(i + 3),
                'low': float(i),
                'volume': 4.0,
            }
            for i in range(self.count)
        ]

    def _fetch_candles(self, request) -> HistoricalCandleBatch:
        rows = self.fetch(request.symbol, request.requested_range.start_timestamp, request.timeframe)
        normalized_rows = tuple((int(row['timestamp']), row) for row in rows)
        candles = tuple(
            HistoricalCandle(
                timestamp=timestamp,
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume'],
            )
            for timestamp, row in normalized_rows
            if request.requested_range.start_timestamp <= timestamp < request.requested_range.end_timestamp
        )
        # Mirrors the shared batch contract's "first real candle after an empty pre-listing
        # page" hint (see IndiaExchangeProvider._fetch_candles) so the prefix-backfill tests
        # below can exercise `_run`'s listing-clip logic without a real provider.
        future_timestamps = tuple(
            timestamp for timestamp, _ in normalized_rows if timestamp >= request.requested_range.end_timestamp
        )
        next_available_timestamp = min(future_timestamps) if not candles and future_timestamps else None
        return HistoricalCandleBatch(
            request=request, candles=candles, next_available_timestamp=next_available_timestamp,
        )

    def find_earliest_available_timestamp(self, request):
        if self.starting_time is None:
            return request.requested_range.start_timestamp
        if self.starting_time >= request.requested_range.end_timestamp:
            return None
        return max(request.requested_range.start_timestamp, self.starting_time)


def _configure_import(monkeypatch, state, driver, fixed_now):
    """Isolate an import run from the clock, database, Redis, and real providers."""
    from jesse.services.db import database

    database_events = []
    monkeypatch.setattr(importer, 'Candle', _candle_model(state))
    monkeypatch.setattr(importer, 'historical_provider_names', [driver.name])
    monkeypatch.setattr(
        importer,
        'build_historical_provider_registry',
        lambda provider_ids: SimpleNamespace(get=lambda provider_id: driver),
    )
    monkeypatch.setattr(
        importer.candle_repository,
        'get_candle_timestamp_bounds',
        lambda exchange, symbol, timeframe: state.get('bounds', (None, None)),
    )
    monkeypatch.setattr(
        importer.candle_repository,
        'store_observed_candles',
        lambda exchange, symbol, timeframe, candles: state.setdefault('stored', []).extend(candles),
    )
    monkeypatch.setattr(importer.arrow, 'utcnow', lambda: fixed_now)
    monkeypatch.setattr(importer.jh, 'now_to_timestamp', lambda: fixed_now.int_timestamp * 1000 - 1)
    monkeypatch.setattr(importer.time, 'sleep', lambda seconds: None)
    monkeypatch.setattr(importer, 'sync_publish', lambda event, payload: None)
    monkeypatch.setattr(database, 'open_connection', lambda: database_events.append('open'))
    monkeypatch.setattr(database, 'close_connection', lambda: database_events.append('close'))
    return database_events


def test_import_paginates_with_exact_timestamps_and_closes_database(monkeypatch):
    fixed_now = arrow.get('2024-01-02T00:00:00Z')
    start = arrow.get('2024-01-01T00:00:00Z').int_timestamp * 1000
    state = {'range': None, 'counts': {}}
    fetches = []
    progress = []
    driver = _FakeDriver(fetches)
    database_events = _configure_import(monkeypatch, state, driver, fixed_now)

    monkeypatch.setattr(importer, '_store_import_progress', lambda *values: progress.append(values))

    result = importer.run(
        'client-1', driver.name, 'btc-usdt', '2024-01-01', running_via_dashboard=False,
    )

    assert fetches == [
        ('BTC-USDT', start, '1m'),
        ('BTC-USDT', start + 720 * 60_000, '1m'),
    ]
    assert len(state['stored']) == 1440
    assert state['stored'][0].timestamp == start
    assert state['stored'][-1].timestamp == start + 1439 * 60_000
    assert progress and progress[0][0] == 'client-1'
    assert database_events == ['open', 'close']
    assert '1440 observed candles' in result


def test_import_resume_skips_complete_page_without_duplicate_fetch(monkeypatch):
    fixed_now = arrow.get('2024-01-02T00:00:00Z')
    start = arrow.get('2024-01-01T00:00:00Z').int_timestamp * 1000
    state = {
        'range': None,
        'counts': {},
        'bounds': (start, start + 719 * 60_000),
    }
    fetches = []
    driver = _FakeDriver(fetches)
    _configure_import(monkeypatch, state, driver, fixed_now)
    monkeypatch.setattr(importer, '_store_import_progress', lambda *values: None)

    result = importer.run(
        'client-2', driver.name, 'BTC-USDT', '2024-01-01', running_via_dashboard=False,
    )

    assert fetches == [('BTC-USDT', start + 720 * 60_000, '1m')]
    assert len(state['stored']) == 720
    assert state['stored'][0].timestamp == start + 720 * 60_000
    assert '720 observed candles' in result
    assert 'Existing rows were retained' in result


def test_import_empty_response_raises_stable_error(monkeypatch):
    fixed_now = arrow.get('2024-01-02T00:00:00Z')
    state = {'range': None, 'counts': {}}
    driver = _FakeDriver([])
    _configure_import(monkeypatch, state, driver, fixed_now)
    monkeypatch.setattr(driver, 'fetch', lambda *args, **kwargs: [])

    with pytest.raises(exceptions.CandleNotFoundInExchange, match='No observed candles were returned'):
        importer.run(
            'client-3', driver.name, 'BTC-USDT', '2024-01-01', running_via_dashboard=False,
        )


def test_dashboard_import_checks_cancellation_in_active_path(monkeypatch):
    fixed_now = arrow.get('2024-01-02T00:00:00Z')
    start = arrow.get('2024-01-01T00:00:00Z').int_timestamp * 1000
    state = {'range': None, 'counts': {start: 1440}}
    driver = _FakeDriver([], count=1440)
    _configure_import(monkeypatch, state, driver, fixed_now)
    events = []
    published = []
    monkeypatch.setattr(importer, 'register_custom_exception_handler', lambda: events.append('handler'))
    monkeypatch.setattr(importer.store.app, 'set_session_id', lambda value: events.append(('session', value)))
    monkeypatch.setattr(importer, 'sync_publish', lambda channel, payload: published.append((channel, payload)))
    monkeypatch.setattr(importer, '_store_import_progress', lambda *values: None)
    monkeypatch.setattr(
        importer,
        'store_import_outcome',
        lambda client_id, status, *args: events.append(('outcome', status)),
    )
    monkeypatch.setattr(importer, 'is_process_active', lambda client_id: False)

    with pytest.raises(exceptions.Termination):
        importer.run('client-4', driver.name, 'BTC-USDT', '2024-01-01')

    assert events == [
        ('outcome', 'running'),
        'handler',
        ('session', 'client-4'),
        ('outcome', 'cancelled'),
    ]
    assert published == []


def test_import_progress_is_persisted_and_redis_failures_are_non_fatal(monkeypatch):
    calls = []

    class FakeRedis:
        def set(self, key, value, ex=None):
            calls.append((key, json.loads(value), ex))

    monkeypatch.setattr(importer, 'sync_redis', FakeRedis())
    monkeypatch.setattr(importer, 'ENV_VALUES', {'APP_PORT': '9100'})

    importer._store_import_progress('client-5', 25.0, 12.5, '2024-01-01')

    assert calls == [(
        '9100|candle-import-progress|client-5',
        {'current': 25.0, 'estimated_remaining_seconds': 12.5, 'current_date': '2024-01-01'},
        86400,
    )]

    monkeypatch.setattr(importer.sync_redis, 'set', lambda *args, **kwargs: (_ for _ in ()).throw(OSError('down')))
    importer._store_import_progress('client-5', 50.0, 5.0, '2024-01-02')


def test_import_outcome_round_trips_and_redis_failures_are_non_fatal(monkeypatch):
    values = {}

    class FakeRedis:
        def set(self, key, value, ex=None):
            values[key] = (value, ex)

        def get(self, key):
            stored = values.get(key)
            return stored[0] if stored else None

    monkeypatch.setattr(importer, 'sync_redis', FakeRedis())
    monkeypatch.setattr(importer, 'ENV_VALUES', {'APP_PORT': '9100'})

    importer.store_import_outcome(
        'client-6',
        'failed',
        'RuntimeError: provider unavailable',
        'serialized traceback',
    )

    assert importer.get_import_outcome('client-6') == {
        'status': 'failed',
        'error': 'RuntimeError: provider unavailable',
        'traceback': 'serialized traceback',
    }
    assert values['9100|candle-import-outcome|client-6'][1] == 86400

    monkeypatch.setattr(
        importer.sync_redis,
        'get',
        lambda key: (_ for _ in ()).throw(OSError('down')),
    )
    assert importer.get_import_outcome('client-6') == {}


def test_dashboard_import_failure_persists_typed_terminal_outcome(monkeypatch):
    fixed_now = arrow.get('2024-01-02T00:00:00Z')
    state = {'range': None, 'counts': {}}
    driver = _FakeDriver([])
    _configure_import(monkeypatch, state, driver, fixed_now)
    outcomes = []
    monkeypatch.setattr(driver, 'fetch', lambda *args, **kwargs: [])
    monkeypatch.setattr(importer, 'register_custom_exception_handler', lambda: None)
    monkeypatch.setattr(importer.store.app, 'set_session_id', lambda value: None)
    monkeypatch.setattr(importer, 'is_process_active', lambda client_id: True)
    monkeypatch.setattr(
        importer,
        'store_import_outcome',
        lambda client_id, status, error=None, error_traceback=None: outcomes.append(
            (status, error, error_traceback)
        ),
    )

    with pytest.raises(exceptions.CandleNotFoundInExchange):
        importer.run('client-7', driver.name, 'BTC-USDT', '2024-01-01')

    assert outcomes[0] == ('running', None, None)
    assert outcomes[1][0] == 'failed'
    assert outcomes[1][1].startswith('CandleNotFoundInExchange:')
    assert outcomes[1][1] in outcomes[1][2]


class _ListedDriver(_FakeDriver):
    """A start before the listing returns the first real candles instead."""

    def __init__(self, fetches, listing, count=720, starting_time=None):
        super().__init__(fetches, count=count, starting_time=starting_time)
        self.listing = listing

    def fetch(self, symbol, start_timestamp, timeframe='1m'):
        self.fetches.append((symbol, start_timestamp, timeframe))
        return self._rows(symbol, max(start_timestamp, self.listing), timeframe)


def test_import_with_existing_candles_skips_history_before_the_listing(monkeypatch):
    # regression: an earlier start date on a recently listed symbol paged backward through years
    # of empty history one request at a time, taking minutes to import nothing.
    fixed_now = arrow.get('2024-01-03T00:00:00Z')
    listing = arrow.get('2024-01-01T12:00:00Z').int_timestamp * 1000
    stored_first = listing
    stored_latest = arrow.get('2024-01-02T00:00:00Z').int_timestamp * 1000 - 60_000
    state = {'range': None, 'counts': {}, 'bounds': (stored_first, stored_latest)}
    fetches = []
    driver = _ListedDriver(fetches, listing, starting_time=listing)
    _configure_import(monkeypatch, state, driver, fixed_now)
    monkeypatch.setattr(importer, '_store_import_progress', lambda *values: None)

    result = importer.run('client-listed', driver.name, 'AAPL-USDT', '2022-01-01', running_via_dashboard=False)

    # Only the suffix after the stored data is requested; nothing before the listing is paged.
    assert all(start >= stored_latest + 60_000 for _, start, _ in fetches)
    assert len(fetches) == 2
    assert len(state['stored']) == 1440
    assert 'earliest available candle was "2024-01-01"' in result


def test_prefix_backfill_stops_when_the_exchange_only_has_later_candles(monkeypatch):
    # A driver that cannot report its listing still stops after one empty pre-listing page.
    fixed_now = arrow.get('2024-01-03T00:00:00Z')
    listing = arrow.get('2024-01-01T12:00:00Z').int_timestamp * 1000
    stored_latest = arrow.get('2024-01-03T00:00:00Z').int_timestamp * 1000 - 60_000
    state = {'range': None, 'counts': {}, 'bounds': (listing, stored_latest)}
    fetches = []
    driver = _ListedDriver(fetches, listing, starting_time=None)
    _configure_import(monkeypatch, state, driver, fixed_now)
    monkeypatch.setattr(importer, '_store_import_progress', lambda *values: None)

    result = importer.run('client-prefix', driver.name, 'AAPL-USDT', '2022-01-01', running_via_dashboard=False)

    assert len(fetches) == 1
    assert fetches[0][1] < listing
    assert state.get('stored', []) == []
    assert '0 observed candles' in result
    assert 'Existing rows were retained' in result


def test_fake_driver_clips_the_requested_start_to_the_listing_time():
    from jesse.services.historical_data import HistoricalCandleRange, HistoricalCandleRequest

    start, end = 1_000_000, 5_000_000

    def request():
        return HistoricalCandleRequest('AAPL-USDT', '1m', HistoricalCandleRange(start, end))

    assert _FakeDriver([], starting_time=None).find_earliest_available_timestamp(request()) == start
    assert _FakeDriver([], starting_time=500_000).find_earliest_available_timestamp(request()) == start
    assert _FakeDriver([], starting_time=2_000_000).find_earliest_available_timestamp(request()) == 2_000_000
    assert _FakeDriver([], starting_time=end).find_earliest_available_timestamp(request()) is None
