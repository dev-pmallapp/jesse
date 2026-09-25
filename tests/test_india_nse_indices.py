"""Tests for jesse/services/historical_data/india/nse_indices.py (the NSE index-close
source and its symbol catalog, story #6) and nse_composite.py (NseCompositeSource,
which routes NSE tickers between the index file and the stock/ETF bhavcopy). No
network access: a fake client returns fixture bytes, same style as
test_india_nse_bhavcopy.py/test_india_bse_bhavcopy.py.
"""
from datetime import date, timedelta
from pathlib import Path

import pytest

from jesse.services.historical_data.errors import ProviderSchemaError, ProviderUnavailableError
from jesse.services.historical_data.india.nse_archives import (
    NseBhavcopySource,
    _expected_legacy_member_name,
    _legacy_url as _bhavcopy_legacy_url,
    _udiff_url as _bhavcopy_udiff_url,
)
from jesse.services.historical_data.india.nse_composite import _SECURITY_CATALOG_CACHE_TTL_SECONDS, NseCompositeSource
from jesse.services.historical_data.india.nse_indices import (
    NSE_INDEX_FIRST_SESSION,
    NseIndexSource,
    _RECENT_INDEX_CACHE_TTL_SECONDS,
    _index_url,
)
from jesse.services.historical_data.india.provider import IndiaExchangeProvider
from jesse.services.historical_data.india.sources import create_source

FIXTURES_DIR = Path(__file__).parent / 'fixtures' / 'india'


def _read_fixture(name: str) -> str:
    return (FIXTURES_DIR / name).read_text()


class FakeIndiaHttpClient:
    """Stands in for IndiaHttpClient.get - returns scripted payloads and records call
    order. `files` maps an exact URL to its payload (bytes, or None for "not published").
    """

    def __init__(self, files: dict[str, bytes | None]):
        self._files = files
        self.calls: list[str] = []

    def get(self, url: str, *, expect: str, referer: str | None = None) -> bytes | None:
        self.calls.append(url)
        if url not in self._files:
            raise AssertionError(f'Unexpected request to {url!r}')
        return self._files[url]


def _index_zip_free(text: str) -> bytes:
    # The index file is served as plain (non-zipped) CSV - unlike bhavcopy, no zip
    # wrapping is needed for a test payload.
    return text.encode()


def _legacy_bhavcopy_bytes(text: str, session: date) -> bytes:
    import io
    import zipfile
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as archive:
        archive.writestr(_expected_legacy_member_name(session), text)
    return buffer.getvalue()


def _catalog_client(extra_files: dict[str, bytes | None] | None = None) -> FakeIndiaHttpClient:
    """A bhavcopy-style client with the equity/ETF security masters scripted, plus
    whatever extra URLs (e.g. a specific session's bhavcopy file) a test also needs.
    Every `NseCompositeSource` classification touches the security catalog (see
    `NseCompositeSource._classify`), so composite tests need these master URLs mapped
    even when the test is really about index routing.
    """
    from jesse.services.historical_data.india.nse_archives import _EQUITY_MASTER_URL, _ETF_MASTER_URL
    files = {
        _EQUITY_MASTER_URL: _read_fixture('nse_equity_l.csv').encode(),
        _ETF_MASTER_URL: _read_fixture('nse_eq_etfseclist.csv').encode(),
    }
    if extra_files:
        files.update(extra_files)
    return FakeIndiaHttpClient(files)


# --------------------------------------------------------------------------------------
# fetch_session: exact values, close-only handling
# --------------------------------------------------------------------------------------

def test_nifty_and_alpha_values_from_2024_fixture():
    session = date(2024, 1, 1)
    client = FakeIndiaHttpClient({_index_url(session): _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))})
    source = NseIndexSource(client=client)

    bars = source.fetch_session(session)

    nifty = bars['NIFTY']
    assert (nifty.open, nifty.high, nifty.low, nifty.close, nifty.volume) == (
        21727.75, 21834.35, 21680.85, 21741.9, 153995217.0,
    )

    # NIFTY100 Alpha 30 and Nifty200 Alpha 30 both report '-' for O/H/L on this date -
    # a flat bar (O=H=L=C), and both counted as close_only (verified indirectly here via
    # the resulting bar shape; the jh.debug count itself is not asserted on).
    nifty100alpha30 = bars['NIFTY100ALPHA30']
    assert (nifty100alpha30.open, nifty100alpha30.high, nifty100alpha30.low, nifty100alpha30.close) == (
        14800.59, 14800.59, 14800.59, 14800.59,
    )
    assert nifty100alpha30.volume == 223408647.0

    nifty200alpha30 = bars['NIFTY200ALPHA30']
    assert (nifty200alpha30.open, nifty200alpha30.high, nifty200alpha30.low, nifty200alpha30.close) == (
        20944.15, 20944.15, 20944.15, 20944.15,
    )

    # Nifty Alpha 50 has full OHLC on this date - not a flat bar.
    niftyalpha50 = bars['NIFTYALPHA50']
    assert (niftyalpha50.open, niftyalpha50.high, niftyalpha50.low, niftyalpha50.close) == (
        42421.65, 42579.0, 42333.7, 42422.35,
    )


def test_cnx_nifty_2015_row_maps_to_nifty_ticker():
    session = date(2015, 1, 5)
    client = FakeIndiaHttpClient({_index_url(session): _index_zip_free(_read_fixture('nse_ind_close_all_20150105.csv'))})
    source = NseIndexSource(client=client)

    bars = source.fetch_session(session)

    assert set(bars) == {'NIFTY'}
    assert bars['NIFTY'].close == 8378.4


# --------------------------------------------------------------------------------------
# Index Date field order: NSE writes DD-MM-YYYY almost everywhere, but at least one
# observed file (2023-04-06) writes MM-DD-YYYY for every row instead. `_parse_index_date`
# disambiguates using the requested session as the tie-breaker.
# --------------------------------------------------------------------------------------

_INDEX_HEADER = (
    'Index Name,Index Date,Open Index Value,High Index Value,Low Index Value,'
    'Closing Index Value,Points Change,Change(%),Volume,Turnover (Rs. Cr.),P/E,P/B,Div Yield\n'
)


def test_dd_mm_yyyy_index_file_parses_normally():
    session = date(2024, 1, 1)
    text = _INDEX_HEADER + 'Nifty 50,01-01-2024,10,11,9,10.5,0.5,1.2,1000,100,20,4,1.5\n'
    client = FakeIndiaHttpClient({_index_url(session): _index_zip_free(text)})
    source = NseIndexSource(client=client)

    bars = source.fetch_session(session)

    assert bars['NIFTY'].close == 10.5


def test_mm_dd_yyyy_index_file_for_2023_04_06_parses_as_requested_session():
    # Real NSE quirk: the 2023-04-06 index file writes every row's date as `04-06-2023`
    # (MM-DD-YYYY) rather than the usual DD-MM-YYYY - 4 June 2023 was a Sunday, so a
    # literal DD-MM reading would be nonsensical for a trading-session file anyway.
    session = date(2023, 4, 6)
    text = _INDEX_HEADER + 'Nifty 50,04-06-2023,17533.85,17638.7,17502.85,17599.15,42.1,0.24,242708337,23543.21,20.72,4.12,1.41\n'
    client = FakeIndiaHttpClient({_index_url(session): _index_zip_free(text)})
    source = NseIndexSource(client=client)

    bars = source.fetch_session(session)

    assert bars['NIFTY'].close == 17599.15


def test_mm_dd_yyyy_index_file_with_day_over_12_still_matches_session():
    # `04-13-2023` can't be read as DD-MM (month 13 is invalid), so the DD-MM/MM-DD
    # ambiguity doesn't even arise here - but the fix must still recognize the MM-DD
    # reading (13 April 2023) as matching the requested session.
    session = date(2023, 4, 13)
    text = _INDEX_HEADER + 'Nifty 50,04-13-2023,10,11,9,10.5,0.5,1.2,1000,100,20,4,1.5\n'
    client = FakeIndiaHttpClient({_index_url(session): _index_zip_free(text)})
    source = NseIndexSource(client=client)

    bars = source.fetch_session(session)

    assert bars['NIFTY'].close == 10.5


def test_index_file_date_matching_neither_field_order_still_raises():
    # A genuinely wrong file (neither DD-MM nor MM-DD equals the requested session) must
    # still trip `check_session_date` - the field-order fix only disambiguates, it never
    # hides a real "wrong day served" mismatch.
    session = date(2023, 4, 6)
    text = _INDEX_HEADER + 'Nifty 50,05-07-2023,10,11,9,10.5,0.5,1.2,1000,100,20,4,1.5\n'
    client = FakeIndiaHttpClient({_index_url(session): _index_zip_free(text)})
    source = NseIndexSource(client=client)

    with pytest.raises(ProviderSchemaError, match='does not match the requested session'):
        source.fetch_session(session)


def test_transposed_trading_day_pair_is_not_silently_accepted_as_mm_dd():
    # Review finding: a plain "prefer whichever reading equals session" is too loose. If
    # NSE served the wrong day's file and that wrong day happens to be the DD/MM-transpose
    # of a *different* real trading day, the MM-DD reading would also equal `session` -
    # e.g. session 2023-05-09 served the 2023-09-05 file (both real trading days), written
    # `05-09-2023`. The DD-MM reading (2023-09-05) is itself a valid trading day, so it
    # must win and still raise, rather than silently accepting the MM-DD reading.
    session = date(2023, 5, 9)
    text = _INDEX_HEADER + 'Nifty 50,05-09-2023,10,11,9,10.5,0.5,1.2,1000,100,20,4,1.5\n'
    client = FakeIndiaHttpClient({_index_url(session): _index_zip_free(text)})
    source = NseIndexSource(client=client)

    with pytest.raises(ProviderSchemaError, match='does not match the requested session'):
        source.fetch_session(session)


# --------------------------------------------------------------------------------------
# Ticker derivation
# --------------------------------------------------------------------------------------

@pytest.mark.parametrize('index_name,expected_ticker', [
    ('Nifty 50', 'NIFTY'),
    ('Nifty Bank', 'BANKNIFTY'),
    ('Nifty Alpha 50', 'NIFTYALPHA50'),
    ('NIFTY100 Alpha 30', 'NIFTY100ALPHA30'),
    ('Nifty200 Alpha 30', 'NIFTY200ALPHA30'),
])
def test_derived_tickers_for_overrides_and_alpha_indices(index_name, expected_ticker):
    session = date(2024, 1, 1)
    text = (
        'Index Name,Index Date,Open Index Value,High Index Value,Low Index Value,Closing Index Value,Volume\n'
        f'{index_name},01-01-2024,10,11,9,10.5,1000\n'
    )
    client = FakeIndiaHttpClient({_index_url(session): _index_zip_free(text)})
    source = NseIndexSource(client=client)

    bars = source.fetch_session(session)

    assert set(bars) == {expected_ticker}


def test_duplicate_derived_ticker_raises_provider_schema_error():
    session = date(2024, 1, 1)
    # Two differently-punctuated index names that both strip down to the same ticker -
    # neither is in the rename table, so both keep their raw (differing) canonical name,
    # which is exactly the collision this guard exists for.
    text = (
        'Index Name,Index Date,Open Index Value,High Index Value,Low Index Value,Closing Index Value,Volume\n'
        'Nifty Alpha 50,01-01-2024,10,11,9,10.5,1000\n'
        'NiftyAlpha50,01-01-2024,20,21,19,20.5,2000\n'
    )
    client = FakeIndiaHttpClient({_index_url(session): _index_zip_free(text)})
    source = NseIndexSource(client=client)

    with pytest.raises(ProviderSchemaError, match='both derive ticker'):
        source.fetch_session(session)


# --------------------------------------------------------------------------------------
# Zero volume kept, missing close skipped
# --------------------------------------------------------------------------------------

def test_zero_volume_index_rows_are_kept():
    session = date(2024, 1, 1)
    text = (
        'Index Name,Index Date,Open Index Value,High Index Value,Low Index Value,Closing Index Value,Volume\n'
        'Nifty 50,01-01-2024,10,11,9,10.5,0\n'
    )
    client = FakeIndiaHttpClient({_index_url(session): _index_zip_free(text)})
    source = NseIndexSource(client=client)

    bars = source.fetch_session(session)

    # Unlike stock bhavcopy, a zero-volume index row must NOT be dropped.
    assert bars['NIFTY'].volume == 0.0


def test_missing_close_is_skipped():
    session = date(2024, 1, 1)
    text = (
        'Index Name,Index Date,Open Index Value,High Index Value,Low Index Value,Closing Index Value,Volume\n'
        'Nifty 50,01-01-2024,10,11,9,-,1000\n'
        'Nifty Bank,01-01-2024,10,11,9,,1000\n'
        'Nifty 500,01-01-2024,10,11,9,10.5,1000\n'
    )
    client = FakeIndiaHttpClient({_index_url(session): _index_zip_free(text)})
    source = NseIndexSource(client=client)

    bars = source.fetch_session(session)

    assert set(bars) == {'NIFTY500'}


# --------------------------------------------------------------------------------------
# Request gating
# --------------------------------------------------------------------------------------

def test_session_before_first_session_makes_zero_requests():
    session = NSE_INDEX_FIRST_SESSION - timedelta(days=1)
    client = FakeIndiaHttpClient({})
    source = NseIndexSource(client=client)

    bars = source.fetch_session(session)

    assert bars is None
    assert client.calls == []


# --------------------------------------------------------------------------------------
# Symbol catalog: kind Index, walk-back, TTL
# --------------------------------------------------------------------------------------

def test_catalog_reports_kind_index():
    today = date(2024, 1, 1)
    client = FakeIndiaHttpClient({_index_url(today): _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))})
    source = NseIndexSource(client=client, today=lambda: today)

    entries = {entry.symbol: entry for entry in source.list_symbol_entries()}

    assert entries['NIFTY-INR'].kind == 'Index'
    assert entries['NIFTY-INR'].name == 'Nifty 50'
    assert entries['NIFTY-INR'].venue == 'NSE'


def test_catalog_walks_back_over_unpublished_days():
    today = date(2024, 1, 10)
    published_day = today - timedelta(days=3)
    files = {_index_url(today - timedelta(days=offset)): None for offset in range(3)}
    files[_index_url(published_day)] = _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))
    client = FakeIndiaHttpClient(files)
    source = NseIndexSource(client=client, today=lambda: today)

    entries = source.list_symbol_entries()

    assert any(entry.symbol == 'NIFTY-INR' for entry in entries)
    assert client.calls == [
        _index_url(today), _index_url(today - timedelta(days=1)), _index_url(today - timedelta(days=2)),
        _index_url(published_day),
    ]


def test_catalog_lookback_exhausted_raises_provider_unavailable():
    today = date(2024, 1, 20)
    files = {_index_url(today - timedelta(days=offset)): None for offset in range(10)}
    client = FakeIndiaHttpClient(files)
    source = NseIndexSource(client=client, today=lambda: today)

    with pytest.raises(ProviderUnavailableError):
        source.list_symbol_entries()


def test_catalog_cache_not_refreshed_before_ttl():
    today = date(2024, 1, 1)
    client = FakeIndiaHttpClient({_index_url(today): _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))})
    clock = [1_000.0]
    source = NseIndexSource(client=client, today=lambda: today, monotonic=lambda: clock[0])

    source.list_symbol_entries()
    calls_after_first = list(client.calls)
    clock[0] += _RECENT_INDEX_CACHE_TTL_SECONDS - 1
    source.list_symbol_entries()

    assert client.calls == calls_after_first


def test_catalog_cache_refreshes_after_ttl():
    today = date(2024, 1, 1)
    client = FakeIndiaHttpClient({_index_url(today): _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))})
    clock = [1_000.0]
    source = NseIndexSource(client=client, today=lambda: today, monotonic=lambda: clock[0])

    source.list_symbol_entries()
    calls_after_first = list(client.calls)
    clock[0] += _RECENT_INDEX_CACHE_TTL_SECONDS + 1
    source.list_symbol_entries()

    assert len(client.calls) == len(calls_after_first) + 1
    assert client.calls[-1] == _index_url(today)


def test_known_index_tickers_includes_overrides_even_when_catalog_unavailable():
    today = date(2024, 1, 20)
    files = {_index_url(today - timedelta(days=offset)): None for offset in range(10)}
    client = FakeIndiaHttpClient(files)
    source = NseIndexSource(client=client, today=lambda: today)

    tickers, loaded = source.known_index_tickers()

    assert loaded is False
    assert {'NIFTY', 'BANKNIFTY'} <= tickers


# --------------------------------------------------------------------------------------
# NseCompositeSource: classification rules (a)-(d) - fetch_daily_bars, list_symbol_entries
# and is_index must all agree, since all three go through `_classify`.
# --------------------------------------------------------------------------------------

def test_collision_ticker_routes_to_bhavcopy_and_catalog_reports_stock():
    # Rule (a): a stock always wins a collision, even though a same-named index exists.
    catalog_day = date(2024, 1, 5)
    session = date(2024, 1, 1)  # distinct from catalog_day: a wrong route to the index
    # source would try an unmapped `_index_url(session)` and the fake client would raise.
    index_text = (
        'Index Name,Index Date,Open Index Value,High Index Value,Low Index Value,Closing Index Value,Volume\n'
        'Reliance,05-01-2024,10,11,9,10.5,1000\n'
    )
    index_source = NseIndexSource(
        client=FakeIndiaHttpClient({_index_url(catalog_day): _index_zip_free(index_text)}), today=lambda: catalog_day,
    )
    bhavcopy_source = NseBhavcopySource(client=_catalog_client({
        _bhavcopy_udiff_url(session): None,
        _bhavcopy_legacy_url(session): _legacy_bhavcopy_bytes(_read_fixture('nse_bhavcopy_legacy_20240101.csv'), session),
    }))
    composite = NseCompositeSource(bhavcopy_source=bhavcopy_source, index_source=index_source)

    bars = composite.fetch_daily_bars('RELIANCE', [session])
    entries = {entry.symbol: entry for entry in composite.list_symbol_entries()}

    assert bars[0].close == 2590.25  # the real bhavcopy close, not the synthetic index row
    assert entries['RELIANCE-INR'].kind == 'Stock'


def test_non_override_index_ticker_raises_when_index_catalog_unavailable():
    # Rule (c): NIFTY200ALPHA30 is not a static override and not in the security
    # catalog - with the index catalog also unreachable, this must raise rather than
    # silently guessing (unlike NIFTY/BANKNIFTY, which the overrides always answer for).
    today = date(2024, 1, 20)
    files = {_index_url(today - timedelta(days=offset)): None for offset in range(10)}
    composite = NseCompositeSource(
        bhavcopy_source=NseBhavcopySource(client=_catalog_client()),
        index_source=NseIndexSource(client=FakeIndiaHttpClient(files), today=lambda: today),
    )

    with pytest.raises(ProviderUnavailableError, match='cannot classify'):
        composite.fetch_daily_bars('NIFTY200ALPHA30', [date(2024, 1, 1)])


def test_non_override_index_ticker_routes_to_index_source_when_catalog_loaded():
    # Rule (b): same ticker as above, but now the index catalog loads fine.
    today = date(2024, 1, 1)
    index_source = NseIndexSource(
        client=FakeIndiaHttpClient({_index_url(today): _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))}),
        today=lambda: today,
    )
    # No bhavcopy session URL scripted - a wrong route to bhavcopy would raise here.
    bhavcopy_source = NseBhavcopySource(client=_catalog_client())
    composite = NseCompositeSource(bhavcopy_source=bhavcopy_source, index_source=index_source)

    bars = composite.fetch_daily_bars('NIFTY200ALPHA30', [today])

    assert bars[0].close == 20944.15


def test_ticker_in_neither_catalog_defaults_to_bhavcopy():
    # Rule (d): both catalogs loaded, ticker in neither - a delisted stock absent from
    # today's masters but still present in an old bhavcopy file.
    today = date(2024, 1, 1)
    session = date(2024, 1, 1)
    delisted_row = 'DELISTED,EQ,10,11,9,10.5,100,01-JAN-2024\n'
    legacy_text = 'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,TOTTRDQTY,TIMESTAMP\n' + delisted_row
    bhavcopy_source = NseBhavcopySource(client=_catalog_client({
        _bhavcopy_udiff_url(session): None,
        _bhavcopy_legacy_url(session): _legacy_bhavcopy_bytes(legacy_text, session),
    }))
    index_source = NseIndexSource(
        client=FakeIndiaHttpClient({_index_url(today): _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))}),
        today=lambda: today,
    )
    composite = NseCompositeSource(bhavcopy_source=bhavcopy_source, index_source=index_source)

    bars = composite.fetch_daily_bars('DELISTED', [session])

    assert bars[0].close == 10.5


# --------------------------------------------------------------------------------------
# NseCompositeSource: security-ticker cache (TTL, no negative caching)
# --------------------------------------------------------------------------------------

def test_security_catalog_cache_not_refreshed_before_ttl_then_refreshes_after():
    clock = [1_000.0]
    catalog_client = _catalog_client()
    index_source = NseIndexSource(
        client=FakeIndiaHttpClient({_index_url(date(2024, 1, 1)): _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))}),
        today=lambda: date(2024, 1, 1),
    )
    composite = NseCompositeSource(
        bhavcopy_source=NseBhavcopySource(client=catalog_client), index_source=index_source, monotonic=lambda: clock[0],
    )

    composite.is_index('RELIANCE')  # RELIANCE hits rule (a) - populates the security cache
    calls_after_first = list(catalog_client.calls)

    clock[0] += _SECURITY_CATALOG_CACHE_TTL_SECONDS - 1
    composite.is_index('RELIANCE')
    assert catalog_client.calls == calls_after_first  # still fresh - no re-fetch

    clock[0] += 2
    composite.is_index('RELIANCE')
    assert len(catalog_client.calls) > len(calls_after_first)  # TTL expired - re-fetched


def test_security_catalog_failure_is_not_cached():
    from jesse.services.historical_data.india.nse_archives import _EQUITY_MASTER_URL, _ETF_MASTER_URL
    etf_bytes = (
        'Symbol,Underlying Asset,SecurityName,DateofListing,MarketLot,ISINNumber,FaceValue,ETF Underlying,'
        'Underlying Key\n'
    ).encode()
    # The equity master 404s (simulated as None) every time - the security catalog can
    # never be built, but each call must still retry it, not remember the failure.
    client = FakeIndiaHttpClient({_ETF_MASTER_URL: etf_bytes, _EQUITY_MASTER_URL: None})
    index_source = NseIndexSource(
        client=FakeIndiaHttpClient({_index_url(date(2024, 1, 1)): _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))}),
        today=lambda: date(2024, 1, 1),
    )
    composite = NseCompositeSource(bhavcopy_source=NseBhavcopySource(client=client), index_source=index_source)

    composite.is_index('RELIANCE')  # falls through to rule (d) - security catalog failure is swallowed
    assert client.calls.count(_EQUITY_MASTER_URL) == 1

    composite.is_index('RELIANCE')

    assert client.calls.count(_EQUITY_MASTER_URL) == 2  # retried, not cached as a permanent failure


# --------------------------------------------------------------------------------------
# NseCompositeSource: merged catalog and collision handling
# --------------------------------------------------------------------------------------

def test_composite_merges_stock_and_index_catalogs():
    today = date(2024, 1, 1)
    index_client = FakeIndiaHttpClient({_index_url(today): _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))})
    composite = NseCompositeSource(
        bhavcopy_source=NseBhavcopySource(client=_catalog_client()),
        index_source=NseIndexSource(client=index_client, today=lambda: today),
    )

    entries = {entry.symbol: entry for entry in composite.list_symbol_entries()}

    assert entries['RELIANCE-INR'].kind == 'Stock'
    assert entries['NIFTYBEES-INR'].kind == 'ETF'
    assert entries['NIFTY-INR'].kind == 'Index'
    assert entries['BANKNIFTY-INR'].kind == 'Index'


def test_composite_collision_keeps_stock_and_skips_index():
    today = date(2024, 1, 1)
    # A synthetic index literally named "Reliance" would derive the ticker RELIANCE,
    # which the stock master (nse_equity_l.csv) already uses for a real, tradable stock.
    index_text = (
        'Index Name,Index Date,Open Index Value,High Index Value,Low Index Value,Closing Index Value,Volume\n'
        'Reliance,01-01-2024,10,11,9,10.5,1000\n'
    )
    index_client = FakeIndiaHttpClient({_index_url(today): _index_zip_free(index_text)})
    composite = NseCompositeSource(
        bhavcopy_source=NseBhavcopySource(client=_catalog_client()),
        index_source=NseIndexSource(client=index_client, today=lambda: today),
    )

    entries = {entry.symbol: entry for entry in composite.list_symbol_entries()}

    assert entries['RELIANCE-INR'].kind == 'Stock'  # the stock wins, the index entry is dropped


# --------------------------------------------------------------------------------------
# is_index: single-authority hook, on the source, the composite, and the provider
# --------------------------------------------------------------------------------------

def test_is_index_on_nse_index_source():
    today = date(2024, 1, 1)
    source = NseIndexSource(
        client=FakeIndiaHttpClient({_index_url(today): _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))}),
        today=lambda: today,
    )

    assert source.is_index('NIFTY') is True
    assert source.is_index('nifty200alpha30') is True  # case-insensitive
    assert source.is_index('RELIANCE') is False


def test_is_index_on_composite_matches_classification():
    today = date(2024, 1, 1)
    composite = NseCompositeSource(
        bhavcopy_source=NseBhavcopySource(client=_catalog_client()),
        index_source=NseIndexSource(
            client=FakeIndiaHttpClient({_index_url(today): _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))}),
            today=lambda: today,
        ),
    )

    assert composite.is_index('NIFTY') is True
    assert composite.is_index('RELIANCE') is False


def test_is_index_on_composite_raises_for_rule_c():
    today = date(2024, 1, 20)
    files = {_index_url(today - timedelta(days=offset)): None for offset in range(10)}
    composite = NseCompositeSource(
        bhavcopy_source=NseBhavcopySource(client=_catalog_client()),
        index_source=NseIndexSource(client=FakeIndiaHttpClient(files), today=lambda: today),
    )

    with pytest.raises(ProviderUnavailableError, match='cannot classify'):
        composite.is_index('NIFTY200ALPHA30')


def test_is_index_on_provider_converts_jesse_symbol_and_delegates():
    today = date(2024, 1, 1)
    composite = NseCompositeSource(
        bhavcopy_source=NseBhavcopySource(client=_catalog_client()),
        index_source=NseIndexSource(
            client=FakeIndiaHttpClient({_index_url(today): _index_zip_free(_read_fixture('nse_ind_close_all_20240101.csv'))}),
            today=lambda: today,
        ),
    )
    provider = IndiaExchangeProvider('NSE', source=composite)

    assert provider.is_index('NIFTY-INR') is True
    assert provider.is_index('RELIANCE-INR') is False


# --------------------------------------------------------------------------------------
# Default registration
# --------------------------------------------------------------------------------------

def test_india_exchange_provider_resolves_to_nse_composite_source_by_default():
    provider = IndiaExchangeProvider('NSE')

    assert isinstance(provider._source, NseCompositeSource)
    assert provider.source_id == 'nse'


def test_nse_indices_source_still_selectable_explicitly_by_id():
    source = create_source('NSE', 'nse_indices')

    assert isinstance(source, NseIndexSource)


# --------------------------------------------------------------------------------------
# Guard: no derived index ticker collides with a real stock/ETF ticker (fixture data)
# --------------------------------------------------------------------------------------

def test_no_derived_index_ticker_equals_a_stock_or_etf_ticker_in_fixtures():
    import csv
    import io

    index_text = _read_fixture('nse_ind_close_all_20240101.csv')
    index_names = [row['Index Name'].strip() for row in csv.DictReader(io.StringIO(index_text)) if row.get('Index Name', '').strip()]

    from jesse.services.historical_data.india.nse_indices import _canonical_name, _derive_ticker
    derived_tickers = {_derive_ticker(_canonical_name(name)) for name in index_names}

    equity_text = _read_fixture('nse_equity_l.csv')
    etf_text = _read_fixture('nse_eq_etfseclist.csv')
    stock_tickers = {row['SYMBOL'].strip().upper() for row in csv.DictReader(io.StringIO(equity_text)) if row.get('SYMBOL', '').strip()}
    etf_tickers = {row['Symbol'].strip().upper() for row in csv.DictReader(io.StringIO(etf_text)) if row.get('Symbol', '').strip()}

    assert derived_tickers.isdisjoint(stock_tickers | etf_tickers)
