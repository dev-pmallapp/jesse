"""Tests for jesse/services/historical_data/india/ - the shared NSE/BSE base layer
(sessions, symbol encoding, HTTP fetch quirks, source registry, and the provider
bridge). No network access: every HTTP interaction goes through a fake
`requests.Session`-alike, and clocks/sleeps are injected.
"""
from datetime import date, datetime, timedelta, timezone

import pytest
import requests

import jesse.services.historical_data.india.sources as sources_module
from jesse.services.historical_data.contracts import HistoricalCandleRange, HistoricalCandleRequest
from jesse.services.historical_data.errors import (
    HistoricalDataRequestError,
    ProviderNotRegisteredError,
    ProviderRateLimitError,
    ProviderRegistrationError,
    ProviderRequestError,
    ProviderUnavailableError,
)
from jesse.services.historical_data.india.http import IndiaHttpClient
from jesse.services.historical_data.india.provider import INDIA_MAX_CANDLES_PER_REQUEST, IndiaExchangeProvider
from jesse.services.historical_data.india.sessions import (
    next_session_row_timestamp,
    session_date,
    session_dates_in_range,
    session_row_timestamp,
)
from jesse.services.historical_data.india.sources import ArchiveDailySource, DailyBar, IndiaDailySource
from jesse.services.historical_data.india.symbols import to_exchange_ticker, to_jesse_symbol


# --------------------------------------------------------------------------------------
# sessions.py
# --------------------------------------------------------------------------------------

def test_session_row_timestamp_is_1529_ist_which_is_0959_utc():
    timestamp = session_row_timestamp(date(2024, 1, 1))

    assert datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc) == datetime(2024, 1, 1, 9, 59, tzinfo=timezone.utc)


def test_session_date_round_trips_through_session_row_timestamp():
    for d in (date(2024, 1, 1), date(2024, 6, 15), date(2024, 12, 31)):
        assert session_date(session_row_timestamp(d)) == d


def test_session_dates_in_range_skips_weekends_and_respects_half_open_bounds():
    friday = date(2024, 1, 5)
    monday = date(2024, 1, 8)  # Sat 01-06 and Sun 01-07 sit between them
    start = session_row_timestamp(friday)
    end = session_row_timestamp(monday) + 1  # +1ms so Monday's own row is included

    assert session_dates_in_range(HistoricalCandleRange(start, end)) == [friday, monday]
    # Moving start 1ms later excludes Friday's row.
    assert session_dates_in_range(HistoricalCandleRange(start + 1, end)) == [monday]
    # Moving end back to exactly Monday's row excludes it (half-open upper bound).
    assert session_dates_in_range(HistoricalCandleRange(start, session_row_timestamp(monday))) == [friday]


def test_next_session_row_timestamp_skips_weekend():
    saturday_reference = session_row_timestamp(date(2024, 1, 6))
    assert next_session_row_timestamp(saturday_reference) == session_row_timestamp(date(2024, 1, 8))

    just_after_friday = session_row_timestamp(date(2024, 1, 5)) + 1
    assert next_session_row_timestamp(just_after_friday) == session_row_timestamp(date(2024, 1, 8))

    # A weekday timestamp that has already passed that day's row rolls to the next weekday.
    friday_afternoon = session_row_timestamp(date(2024, 1, 5)) + 3_600_000
    assert next_session_row_timestamp(friday_afternoon) == session_row_timestamp(date(2024, 1, 8))


# --------------------------------------------------------------------------------------
# symbols.py
# --------------------------------------------------------------------------------------

def test_to_jesse_symbol_encodes_dash_and_keeps_ampersand():
    assert to_jesse_symbol('BAJAJ-AUTO') == 'BAJAJ_AUTO-INR'
    assert to_jesse_symbol('M&M') == 'M&M-INR'
    assert to_jesse_symbol('RELIANCE') == 'RELIANCE-INR'
    assert to_jesse_symbol(' bajaj-auto ') == 'BAJAJ_AUTO-INR'


def test_to_exchange_ticker_round_trips_every_encoded_form():
    assert to_exchange_ticker('BAJAJ_AUTO-INR') == 'BAJAJ-AUTO'
    assert to_exchange_ticker('M&M-INR') == 'M&M'
    assert to_exchange_ticker('RELIANCE-INR') == 'RELIANCE'


def test_to_exchange_ticker_normalizes_lowercase_and_padding():
    assert to_exchange_ticker(' bajaj_auto-inr ') == 'BAJAJ-AUTO'


def test_to_jesse_symbol_rejects_empty_whitespace_underscore_and_multi_dash():
    with pytest.raises(HistoricalDataRequestError, match='empty'):
        to_jesse_symbol('')
    with pytest.raises(HistoricalDataRequestError, match='empty'):
        to_jesse_symbol('   ')
    with pytest.raises(HistoricalDataRequestError, match='whitespace'):
        to_jesse_symbol('BAJAJ AUTO')
    with pytest.raises(HistoricalDataRequestError, match='_'):
        to_jesse_symbol('BAJAJ_AUTO')
    with pytest.raises(HistoricalDataRequestError, match='more than one'):
        to_jesse_symbol('A-B-C')


def test_to_exchange_ticker_rejects_missing_or_non_inr_quote_and_multi_dash():
    with pytest.raises(HistoricalDataRequestError, match='empty'):
        to_exchange_ticker('')
    with pytest.raises(HistoricalDataRequestError, match='whitespace'):
        to_exchange_ticker('RELIANCE INR')
    with pytest.raises(HistoricalDataRequestError, match='missing a quote'):
        to_exchange_ticker('RELIANCE')
    with pytest.raises(HistoricalDataRequestError, match='INR'):
        to_exchange_ticker('RELIANCE-USD')
    with pytest.raises(HistoricalDataRequestError, match='more than one'):
        to_exchange_ticker('A-B-INR')
    with pytest.raises(HistoricalDataRequestError, match='missing a base'):
        to_exchange_ticker('-INR')


# --------------------------------------------------------------------------------------
# http.py
# --------------------------------------------------------------------------------------

class FakeResponse:
    """Stands in for `requests.Response` - only the attributes IndiaHttpClient touches."""

    def __init__(self, status_code=200, content=b'', json_payload=None, json_raises=False, headers=None):
        self.status_code = status_code
        self.content = content
        self._json_payload = json_payload
        self._json_raises = json_raises
        self.headers = headers or {}
        self.closed = False

    def json(self):
        if self._json_raises:
            raise requests.exceptions.JSONDecodeError('Expecting value', '', 0)
        return self._json_payload

    def close(self):
        self.closed = True


class FakeSession:
    """Stands in for `requests.Session` - returns scripted responses/exceptions in order."""

    def __init__(self, responses, cookies_after_get=None):
        self._responses = list(responses)
        self.cookies = {}
        self._cookies_after_get = cookies_after_get or {}

    def get(self, url, headers=None, timeout=None):
        # A real requests.Session updates its cookie jar from Set-Cookie headers
        # regardless of the response's status code; simulate that here so prime_cookies
        # can be tested without reaching into requests' urllib3 internals.
        self.cookies.update(self._cookies_after_get)
        item = self._responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


def _client(session, sleeps=None, min_host_interval_seconds=0.0, monotonic=None):
    return IndiaHttpClient(
        session=session,
        sleep=(sleeps.append if sleeps is not None else (lambda seconds: None)),
        monotonic=monotonic or (lambda: 0.0),
        min_host_interval_seconds=min_host_interval_seconds,
    )


def test_get_returns_none_on_404():
    client = _client(FakeSession([FakeResponse(404)]))
    assert client.get('https://host/missing.csv', expect='csv') is None


@pytest.mark.parametrize('expect', ['csv', 'json', 'zip'])
def test_get_returns_none_for_soft_404_html_page(expect):
    session = FakeSession([FakeResponse(
        200, content=b'<html>not found</html>', headers={'Content-Type': 'text/html; charset=utf-8'},
    )])
    assert _client(session).get('https://host/x', expect=expect) is None


def test_get_detects_html_body_even_without_html_content_type():
    session = FakeSession([FakeResponse(
        200, content=b'<!DOCTYPE html><html></html>', headers={'Content-Type': 'application/octet-stream'},
    )])
    assert _client(session).get('https://host/x', expect='zip') is None


def test_get_returns_none_for_invalid_zip_magic():
    session = FakeSession([FakeResponse(
        200, content=b'not actually a zip', headers={'Content-Type': 'application/zip'},
    )])
    assert _client(session).get('https://host/x', expect='zip') is None


def test_get_returns_bytes_for_valid_csv_and_zip():
    csv_body = b'SYMBOL,OPEN\nRELIANCE,100\n'
    zip_body = b'PK\x03\x04fake-zip-bytes'
    session = FakeSession([
        FakeResponse(200, content=csv_body, headers={'Content-Type': 'text/csv'}),
        FakeResponse(200, content=zip_body, headers={'Content-Type': 'application/zip'}),
    ])
    client = _client(session)
    assert client.get('https://host/a.csv', expect='csv') == csv_body
    assert client.get('https://host/a.zip', expect='zip') == zip_body


def test_get_returns_parsed_json():
    payload = [{'symbol': 'RELIANCE'}]
    session = FakeSession([FakeResponse(
        200, content=b'[{"symbol": "RELIANCE"}]', json_payload=payload, headers={'Content-Type': 'application/json'},
    )])
    assert _client(session).get('https://host/x', expect='json') == payload


def test_get_returns_none_for_unparseable_json():
    session = FakeSession([FakeResponse(
        200, content=b'not json', json_raises=True, headers={'Content-Type': 'application/json'},
    )])
    assert _client(session).get('https://host/x', expect='json') is None


def test_get_raises_rate_limit_error_on_429():
    session = FakeSession([FakeResponse(429)])
    with pytest.raises(ProviderRateLimitError):
        _client(session).get('https://host/x', expect='csv')


def test_get_raises_request_error_on_other_4xx():
    session = FakeSession([FakeResponse(400)])
    with pytest.raises(ProviderRequestError):
        _client(session).get('https://host/x', expect='csv')


def test_get_retries_5xx_twice_then_raises_unavailable_with_backoff():
    session = FakeSession([FakeResponse(503), FakeResponse(503), FakeResponse(503)])
    sleeps = []
    with pytest.raises(ProviderUnavailableError):
        _client(session, sleeps=sleeps).get('https://host/x', expect='csv')
    assert sleeps == [2.0, 4.0]


def test_get_retries_connection_error_twice_then_raises_unavailable_with_backoff():
    session = FakeSession([
        requests.ConnectionError('boom'),
        requests.ConnectionError('boom'),
        requests.ConnectionError('boom'),
    ])
    sleeps = []
    with pytest.raises(ProviderUnavailableError):
        _client(session, sleeps=sleeps).get('https://host/x', expect='csv')
    assert sleeps == [2.0, 4.0]


def test_get_retries_chunked_encoding_error_then_raises_unavailable():
    # A ChunkedEncodingError (a mid-download break, e.g. a truncated bhavcopy zip) is a
    # requests.RequestException subclass, not a ConnectionError/Timeout - it must still
    # be retried and surfaced as ProviderUnavailableError, never as a raw requests error.
    session = FakeSession([
        requests.exceptions.ChunkedEncodingError('truncated'),
        requests.exceptions.ChunkedEncodingError('truncated'),
        requests.exceptions.ChunkedEncodingError('truncated'),
    ])
    sleeps = []
    with pytest.raises(ProviderUnavailableError):
        _client(session, sleeps=sleeps).get('https://host/x.zip', expect='zip')
    assert sleeps == [2.0, 4.0]


def test_get_shares_one_retry_budget_across_connection_error_and_5xx():
    session = FakeSession([
        requests.ConnectionError('boom'),
        FakeResponse(503),
        FakeResponse(503),
    ])
    sleeps = []
    with pytest.raises(ProviderUnavailableError):
        _client(session, sleeps=sleeps).get('https://host/x', expect='csv')
    assert sleeps == [2.0, 4.0]


def test_pacing_is_independent_per_host_but_shared_within_one_host():
    session = FakeSession([
        FakeResponse(200, content=b'a', headers={'Content-Type': 'text/csv'}),
        FakeResponse(200, content=b'b', headers={'Content-Type': 'text/csv'}),
        FakeResponse(200, content=b'c', headers={'Content-Type': 'text/csv'}),
    ])
    clock = [0.0]
    sleeps = []

    def monotonic():
        return clock[0]

    def sleep(seconds):
        sleeps.append(seconds)
        clock[0] += seconds

    client = IndiaHttpClient(session=session, sleep=sleep, monotonic=monotonic, min_host_interval_seconds=1.0)
    client.get('https://host-a/x', expect='csv')
    client.get('https://host-b/x', expect='csv')  # a different host: no wait needed
    assert sleeps == []

    client.get('https://host-a/y', expect='csv')  # back to host-a: must wait out the 1s gap
    assert sleeps == [1.0]


def test_get_paces_requests_per_host_using_injected_clock_and_sleep():
    session = FakeSession([
        FakeResponse(200, content=b'a', headers={'Content-Type': 'text/csv'}),
        FakeResponse(200, content=b'b', headers={'Content-Type': 'text/csv'}),
    ])
    clock = [0.0]
    sleeps = []

    def monotonic():
        return clock[0]

    def sleep(seconds):
        sleeps.append(seconds)
        clock[0] += seconds

    client = IndiaHttpClient(session=session, sleep=sleep, monotonic=monotonic, min_host_interval_seconds=1.0)
    client.get('https://host/a', expect='csv')
    client.get('https://host/b', expect='csv')

    # The clock never advances on its own; the second call must sleep out the 1s gap.
    assert sleeps == [1.0]


def test_prime_cookies_keeps_cookies_despite_403():
    session = FakeSession([FakeResponse(403)], cookies_after_get={'bm_sz': 'akamai-token'})
    _client(session).prime_cookies('https://www.nseindia.com/')

    assert session.cookies == {'bm_sz': 'akamai-token'}


def test_prime_cookies_wraps_connection_error():
    session = FakeSession([requests.ConnectionError('boom')])
    with pytest.raises(ProviderUnavailableError):
        _client(session).prime_cookies('https://www.nseindia.com/')


# --------------------------------------------------------------------------------------
# sources.py - registry
# --------------------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _isolated_india_source_registry(monkeypatch):
    """Registration is process-global module state; keep each test's sources private."""
    monkeypatch.setattr(sources_module, '_registered_sources', {})
    monkeypatch.setattr(sources_module, '_default_source_ids', {})
    yield


class _FakeSourceA(IndiaDailySource):
    source_id = 'fake-nse-a'
    exchange = 'NSE'
    prices_adjusted = False

    def fetch_daily_bars(self, ticker, sessions):
        return []


class _FakeSourceB(IndiaDailySource):
    source_id = 'fake-nse-b'
    exchange = 'NSE'
    prices_adjusted = False

    def fetch_daily_bars(self, ticker, sessions):
        return []


def test_registry_returns_default_and_supports_explicit_override():
    sources_module.register_source(_FakeSourceA, default=True)
    sources_module.register_source(_FakeSourceB)

    assert sources_module.available_sources('NSE') == ('fake-nse-a', 'fake-nse-b')
    assert isinstance(sources_module.create_source('NSE'), _FakeSourceA)
    assert isinstance(sources_module.create_source('NSE', 'fake-nse-b'), _FakeSourceB)


def test_create_source_raises_for_unknown_exchange_or_source_id():
    with pytest.raises(ProviderNotRegisteredError):
        sources_module.create_source('NSE')

    sources_module.register_source(_FakeSourceA, default=True)
    with pytest.raises(ProviderNotRegisteredError):
        sources_module.create_source('NSE', 'does-not-exist')
    with pytest.raises(ProviderNotRegisteredError):
        sources_module.create_source('BSE')


def test_register_source_rejects_duplicate_id_and_duplicate_default():
    sources_module.register_source(_FakeSourceA, default=True)

    with pytest.raises(ProviderRegistrationError, match='already registered'):
        sources_module.register_source(_FakeSourceA)
    with pytest.raises(ProviderRegistrationError, match='default'):
        sources_module.register_source(_FakeSourceB, default=True)


# --------------------------------------------------------------------------------------
# sources.py - ArchiveDailySource caching
# --------------------------------------------------------------------------------------

class _CountingArchiveSource(ArchiveDailySource):
    source_id = 'counting-archive'
    exchange = 'NSE'
    prices_adjusted = False

    def __init__(self):
        super().__init__()
        self.fetch_calls = []

    def fetch_session(self, session):
        self.fetch_calls.append(session)
        return {
            'RELIANCE': DailyBar(session, 100.0, 101.0, 99.0, 100.5, 1_000.0),
            'TCS': DailyBar(session, 200.0, 201.0, 199.0, 200.5, 2_000.0),
        }


def test_archive_source_downloads_each_session_once_across_symbols():
    source = _CountingArchiveSource()
    sessions = [date(2024, 1, 1), date(2024, 1, 2)]

    reliance_bars = source.fetch_daily_bars('RELIANCE', sessions)
    tcs_bars = source.fetch_daily_bars('TCS', sessions)

    assert [bar.close for bar in reliance_bars] == [100.5, 100.5]
    assert [bar.close for bar in tcs_bars] == [200.5, 200.5]
    # Two symbols over the same two sessions must still fetch each whole-market file once.
    assert source.fetch_calls == sessions


def test_archive_source_evicts_least_recently_used_session_at_capacity():
    source = _CountingArchiveSource()
    cache_size = source._SESSION_CACHE_SIZE
    sessions = [date(2024, 1, 1) + timedelta(days=i) for i in range(cache_size)]

    # Fill the cache to exactly its capacity - no eviction yet.
    for session in sessions:
        source.fetch_daily_bars('RELIANCE', [session])
    assert len(source.fetch_calls) == cache_size

    # A new, distinct session pushes the cache one past capacity, evicting the least
    # recently used entry (sessions[0]: it has not been touched since first fetched).
    newest_session = date(2024, 1, 1) + timedelta(days=cache_size)
    source.fetch_daily_bars('RELIANCE', [newest_session])
    assert len(source.fetch_calls) == cache_size + 1

    # The evicted session downloads again ...
    source.fetch_daily_bars('RELIANCE', [sessions[0]])
    assert source.fetch_calls[-1] == sessions[0]
    assert len(source.fetch_calls) == cache_size + 2

    # ... but a recently used session does not.
    calls_before = len(source.fetch_calls)
    source.fetch_daily_bars('RELIANCE', [newest_session])
    assert len(source.fetch_calls) == calls_before


def test_archive_source_treats_none_session_as_not_published():
    class HolidayAwareSource(ArchiveDailySource):
        source_id = 'holiday-archive'
        exchange = 'NSE'
        prices_adjusted = False

        def fetch_session(self, session):
            return None if session.weekday() >= 5 else {
                'RELIANCE': DailyBar(session, 1.0, 1.0, 1.0, 1.0, 1.0),
            }

    source = HolidayAwareSource()
    saturday = date(2024, 1, 6)
    monday = date(2024, 1, 8)

    bars = source.fetch_daily_bars('RELIANCE', [saturday, monday])

    assert [bar.session for bar in bars] == [monday]


# --------------------------------------------------------------------------------------
# provider.py
# --------------------------------------------------------------------------------------

class _FixtureSource(IndiaDailySource):
    source_id = 'fixture'
    exchange = 'NSE'
    prices_adjusted = True

    def __init__(self, bars_by_session):
        self._bars_by_session = bars_by_session

    def fetch_daily_bars(self, ticker, sessions):
        return [self._bars_by_session[session] for session in sessions if session in self._bars_by_session]


def test_provider_maps_daily_bars_to_session_stamped_candles():
    bars = {
        date(2024, 1, 1): DailyBar(date(2024, 1, 1), 100.0, 105.0, 99.0, 104.0, 12_345.0),
        date(2024, 1, 2): DailyBar(date(2024, 1, 2), 104.0, 106.0, 103.0, 105.5, 6_789.0),
    }
    provider = IndiaExchangeProvider('NSE', source=_FixtureSource(bars))
    request = HistoricalCandleRequest(
        'RELIANCE-INR',
        '1m',
        HistoricalCandleRange(session_row_timestamp(date(2024, 1, 1)), session_row_timestamp(date(2024, 1, 3))),
    )

    batch = provider.fetch_candles(request)

    assert [candle.timestamp for candle in batch.candles] == [
        session_row_timestamp(date(2024, 1, 1)),
        session_row_timestamp(date(2024, 1, 2)),
    ]
    assert batch.candles[0].close == 104.0
    assert batch.candles[0].volume == 12_345.0
    assert batch.candles[1].close == 105.5
    assert batch.next_available_timestamp is None
    assert provider.prices_adjusted is True
    assert provider.source_id == 'fixture'
    assert provider.provider_id == 'NSE'


def test_provider_sets_next_available_timestamp_when_range_has_no_bars():
    provider = IndiaExchangeProvider('NSE', source=_FixtureSource({}))
    friday = date(2024, 1, 5)
    monday = date(2024, 1, 8)
    request = HistoricalCandleRequest(
        'RELIANCE-INR',
        '1m',
        # Just past Friday's row through exactly Monday's row: a weekend-only range.
        HistoricalCandleRange(session_row_timestamp(friday) + 1, session_row_timestamp(monday)),
    )

    batch = provider.fetch_candles(request)

    assert batch.candles == ()
    assert batch.next_available_timestamp == session_row_timestamp(monday)


class _RogueSource(IndiaDailySource):
    """A deliberately misbehaving source that ignores the sessions it was asked for."""

    source_id = 'rogue'
    exchange = 'NSE'
    prices_adjusted = False

    def fetch_daily_bars(self, ticker, sessions):
        return [DailyBar(date(2099, 1, 1), 1.0, 1.0, 1.0, 1.0, 1.0)]


def test_provider_drops_bars_outside_the_requested_range():
    provider = IndiaExchangeProvider('NSE', source=_RogueSource())
    start = session_row_timestamp(date(2024, 1, 1))
    end = session_row_timestamp(date(2024, 1, 3))
    request = HistoricalCandleRequest('RELIANCE-INR', '1m', HistoricalCandleRange(start, end))

    batch = provider.fetch_candles(request)

    assert batch.candles == ()
    assert batch.next_available_timestamp == next_session_row_timestamp(end)


def test_provider_uses_create_source_when_none_given():
    sources_module.register_source(_FakeSourceA, default=True)
    provider = IndiaExchangeProvider('NSE')

    assert isinstance(provider._source, _FakeSourceA)
    assert provider.source_id == 'fake-nse-a'
    assert provider.prices_adjusted is False


def test_provider_capabilities_set_max_candles_per_request_for_the_importer():
    # import_candles_mode requires a finite max_candles_per_request; None raises ValueError there.
    provider = IndiaExchangeProvider('NSE', source=_FixtureSource({}))

    assert provider.capabilities.max_candles_per_request == INDIA_MAX_CANDLES_PER_REQUEST
    assert INDIA_MAX_CANDLES_PER_REQUEST == 31 * 24 * 60
