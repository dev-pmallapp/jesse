"""Tests for jesse/services/historical_data/india/nse_archives.py - the NSE bhavcopy
source (legacy + UDiFF formats) and its symbol catalog (story #4). No network access:
a fake client returns fixture bytes (zipped in memory where the real file is a zip),
built from the trimmed real payloads under tests/fixtures/india/.
"""
import io
import zipfile
from datetime import date
from pathlib import Path

import pytest

from jesse.services.historical_data.contracts import HistoricalCandleRange, HistoricalCandleRequest
from jesse.services.historical_data.errors import ProviderSchemaError
from jesse.services.historical_data.india.provider import IndiaExchangeProvider
from jesse.services.historical_data.india.sessions import session_row_timestamp
from jesse.services.historical_data.india.sources import IndiaDailySource
from jesse.services.historical_data.india.nse_archives import (
    NSE_FIRST_SESSION,
    UDIFF_SWITCH_DATE,
    NseBhavcopySource,
    _EQUITY_MASTER_URL,
    _ETF_MASTER_URL,
    _UDIFF_REQUIRED_COLUMNS,
    _expected_legacy_member_name,
    _legacy_url,
    _udiff_url,
)

FIXTURES_DIR = Path(__file__).parent / 'fixtures' / 'india'


def _read_fixture(name: str) -> str:
    return (FIXTURES_DIR / name).read_text()


def _zip_bytes(text: str, filename: str = 'bhav.csv') -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as archive:
        archive.writestr(filename, text)
    return buffer.getvalue()


def _legacy_zip_bytes(text: str, session: date) -> bytes:
    """A legacy zip with a realistic member name (`check_archive_member_name` in
    archive_parsing.py now rejects a mismatch), for tests that exercise the legacy path
    successfully rather than deliberately testing that guard.
    """
    return _zip_bytes(text, filename=_expected_legacy_member_name(session))


class FakeIndiaHttpClient:
    """Stands in for IndiaHttpClient.get - returns scripted payloads and records call order.

    `files` maps an exact URL to its payload (bytes, or None to simulate "not published" -
    the same not-a-404-necessarily-but-effectively-absent contract IndiaHttpClient.get()
    itself already normalizes to None for its callers).
    """

    def __init__(self, files: dict[str, bytes | None]):
        self._files = files
        self.calls: list[str] = []

    def get(self, url: str, *, expect: str, referer: str | None = None) -> bytes | None:
        self.calls.append(url)
        if url not in self._files:
            raise AssertionError(f'Unexpected request to {url!r}')
        return self._files[url]


# --------------------------------------------------------------------------------------
# UDiFF parsing
# --------------------------------------------------------------------------------------

def test_udiff_parses_exact_tcs_and_niftybees_values():
    session = date(2024, 7, 8)
    client = FakeIndiaHttpClient({_udiff_url(session): _zip_bytes(_read_fixture('nse_bhavcopy_udiff_20240708.csv'))})
    source = NseBhavcopySource(client=client)

    bars = source.fetch_session(session)

    tcs = bars['TCS']
    assert (tcs.open, tcs.high, tcs.low, tcs.close, tcs.volume) == (4022.00, 4031.25, 3978.05, 3993.20, 1758882.0)
    niftybees = bars['NIFTYBEES']
    assert (niftybees.open, niftybees.high, niftybees.low, niftybees.close, niftybees.volume) == (
        270.12, 271.45, 269.60, 270.04, 2632351.0,
    )


# --------------------------------------------------------------------------------------
# Legacy parsing - both header eras
# --------------------------------------------------------------------------------------

def test_legacy_parses_2024_header_with_totaltrades_and_isin():
    session = date(2024, 1, 1)
    client = FakeIndiaHttpClient({
        _udiff_url(session): None,
        _legacy_url(session): _legacy_zip_bytes(_read_fixture('nse_bhavcopy_legacy_20240101.csv'), session),
    })
    source = NseBhavcopySource(client=client)

    bars = source.fetch_session(session)

    reliance = bars['RELIANCE']
    assert (reliance.open, reliance.high, reliance.low, reliance.close, reliance.volume) == (
        2580.55, 2606.85, 2573.15, 2590.25, 2015270.0,
    )
    assert set(bars) == {'ALLCARGO', 'NIFTYBEES', 'RELIANCE', 'TCS'}


def test_legacy_parses_1995_header_missing_totaltrades_and_isin():
    session = date(1995, 1, 2)
    client = FakeIndiaHttpClient({
        _udiff_url(session): None,
        _legacy_url(session): _legacy_zip_bytes(_read_fixture('nse_bhavcopy_legacy_19950102.csv'), session),
    })
    source = NseBhavcopySource(client=client)

    bars = source.fetch_session(session)

    assert set(bars) == {'ABB', 'ACC', 'RELIANCE'}
    reliance = bars['RELIANCE']
    assert (reliance.open, reliance.high, reliance.low, reliance.close, reliance.volume) == (
        341.0, 343.0, 340.5, 341.2, 13600.0,
    )


# --------------------------------------------------------------------------------------
# Request order
# --------------------------------------------------------------------------------------

def test_udiff_tried_first_then_legacy_fallback_for_pre_switch_date():
    session = date(2024, 1, 1)
    client = FakeIndiaHttpClient({
        _udiff_url(session): None,  # simulate not (yet) backfilled for this test
        _legacy_url(session): _legacy_zip_bytes(_read_fixture('nse_bhavcopy_legacy_20240101.csv'), session),
    })
    source = NseBhavcopySource(client=client)

    bars = source.fetch_session(session)

    assert client.calls == [_udiff_url(session), _legacy_url(session)]
    assert 'RELIANCE' in bars


def test_post_switch_date_with_udiff_missing_makes_exactly_one_request():
    session = date(2024, 7, 9)  # after UDIFF_SWITCH_DATE - legacy 404s by design, never tried
    client = FakeIndiaHttpClient({_udiff_url(session): None})
    source = NseBhavcopySource(client=client)

    bars = source.fetch_session(session)

    assert bars is None
    assert client.calls == [_udiff_url(session)]


def test_session_before_nse_first_session_makes_zero_requests():
    session = date(1994, 1, 1)
    assert session < NSE_FIRST_SESSION
    client = FakeIndiaHttpClient({})
    source = NseBhavcopySource(client=client)

    bars = source.fetch_session(session)

    assert bars is None
    assert client.calls == []


def test_udiff_switch_date_constant_matches_first_udiff_fixture_date():
    assert UDIFF_SWITCH_DATE == date(2024, 7, 8)


# --------------------------------------------------------------------------------------
# ALLCARGO unadjusted-prices proof, through IndiaExchangeProvider
# --------------------------------------------------------------------------------------

def _allcargo_proof_row_for(session_label: str) -> str:
    """Slice the header + the one matching row out of the 3-date proof fixture.

    The real proof file concatenates three separate bhavcopy days into one CSV for
    documentation purposes only; a real NSE archive file only ever holds one day, so
    a source-under-test must be handed one single-day file per session, same as production.
    """
    lines = _read_fixture('nse_bhavcopy_legacy_allcargo_unadjusted_proof.csv').splitlines()
    header = lines[0]
    (row,) = (line for line in lines[1:] if line.split(',')[10] == session_label)
    return f'{header}\n{row}\n'


def test_allcargo_proof_gives_raw_unadjusted_closes_at_0959_utc():
    day1 = date(2024, 1, 1)
    day2 = date(2024, 1, 2)
    client = FakeIndiaHttpClient({
        _udiff_url(day1): None,
        _legacy_url(day1): _legacy_zip_bytes(_allcargo_proof_row_for('01-JAN-2024'), day1),
        _udiff_url(day2): None,
        _legacy_url(day2): _legacy_zip_bytes(_allcargo_proof_row_for('02-JAN-2024'), day2),
    })
    provider = IndiaExchangeProvider('NSE', source=NseBhavcopySource(client=client))
    request = HistoricalCandleRequest(
        'ALLCARGO-INR',
        '1m',
        HistoricalCandleRange(session_row_timestamp(day1), session_row_timestamp(day2) + 1),
    )

    batch = provider.fetch_candles(request)

    assert [candle.close for candle in batch.candles] == [329.05, 90.10]
    for candle in batch.candles:
        # 15:29 IST == 09:59 UTC (D3 session-row stamping).
        assert candle.timestamp % 86_400_000 == (9 * 3600 + 59 * 60) * 1000


# --------------------------------------------------------------------------------------
# Schema errors
# --------------------------------------------------------------------------------------

def test_row_date_mismatch_raises_provider_schema_error():
    session = date(2024, 1, 2)  # fixture rows are all dated 01-JAN-2024
    client = FakeIndiaHttpClient({
        _udiff_url(session): None,
        # Member name matches the *requested* session (2024-01-02) - the mismatch this
        # test targets is the row-level TIMESTAMP (01-JAN-2024), not the archive member.
        _legacy_url(session): _legacy_zip_bytes(_read_fixture('nse_bhavcopy_legacy_20240101.csv'), session),
    })
    source = NseBhavcopySource(client=client)

    with pytest.raises(ProviderSchemaError, match='does not match the requested session'):
        source.fetch_session(session)


def test_missing_required_column_raises_provider_schema_error():
    session = date(2024, 1, 1)
    # No SERIES column at all - a structural break, not a per-row problem.
    text = 'SYMBOL,OPEN,HIGH,LOW,CLOSE,TOTTRDQTY,TIMESTAMP\nFOO,10,11,9,10.5,100,01-JAN-2024\n'
    client = FakeIndiaHttpClient({_udiff_url(session): None, _legacy_url(session): _legacy_zip_bytes(text, session)})
    source = NseBhavcopySource(client=client)

    with pytest.raises(ProviderSchemaError, match='missing required column'):
        source.fetch_session(session)


def test_legacy_archive_member_name_mismatch_raises_provider_schema_error():
    session = date(2024, 1, 1)
    # Real content, but zipped under an unrelated member name - simulates a wrong-day
    # file being served under this session's URL. This is the *only* per-file guard NSE
    # has for the legacy format beyond the row-level TIMESTAMP check.
    client = FakeIndiaHttpClient({
        _udiff_url(session): None,
        _legacy_url(session): _zip_bytes(_read_fixture('nse_bhavcopy_legacy_20240101.csv'), filename='cm02JAN2024bhav.csv'),
    })
    source = NseBhavcopySource(client=client)

    with pytest.raises(ProviderSchemaError, match='does not match the expected'):
        source.fetch_session(session)


def test_zip_with_two_files_raises_provider_schema_error():
    session = date(2024, 1, 1)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as archive:
        archive.writestr('a.csv', 'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,TOTTRDQTY,TIMESTAMP\n')
        archive.writestr('b.csv', 'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,TOTTRDQTY,TIMESTAMP\n')
    client = FakeIndiaHttpClient({_udiff_url(session): buffer.getvalue()})
    source = NseBhavcopySource(client=client)

    with pytest.raises(ProviderSchemaError, match='exactly one file'):
        source.fetch_session(session)


# --------------------------------------------------------------------------------------
# Series priority, exclusion, zero-volume and invalid-row skipping
# --------------------------------------------------------------------------------------

_SERIES_TEST_HEADER = 'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,TOTTRDQTY,TIMESTAMP'


def _series_test_source(*rows: str) -> tuple[NseBhavcopySource, date]:
    session = date(2024, 1, 1)
    text = _SERIES_TEST_HEADER + '\n' + '\n'.join(rows) + '\n'
    client = FakeIndiaHttpClient({_udiff_url(session): None, _legacy_url(session): _legacy_zip_bytes(text, session)})
    return NseBhavcopySource(client=client), session


def test_series_priority_prefers_eq_over_be_and_bz_for_the_same_ticker():
    source, session = _series_test_source(
        'FOO,BZ,10,11,9,10.7,300,01-JAN-2024',
        'FOO,BE,10,11,9,10.5,100,01-JAN-2024',
        'FOO,EQ,10,11,9,10.6,200,01-JAN-2024',
    )

    bars = source.fetch_session(session)

    assert bars['FOO'].close == 10.6  # EQ wins even though it's not the first row


def test_series_priority_prefers_be_over_bz_when_eq_absent():
    source, session = _series_test_source(
        'FOO,BZ,10,11,9,10.7,300,01-JAN-2024',
        'FOO,BE,10,11,9,10.5,100,01-JAN-2024',
    )

    bars = source.fetch_session(session)

    assert bars['FOO'].close == 10.5


def test_excluded_series_are_dropped():
    source, session = _series_test_source(
        'FOO,GS,10,11,9,10.5,100,01-JAN-2024',
        'BAR,SM,10,11,9,10.5,100,01-JAN-2024',
    )

    bars = source.fetch_session(session)

    assert bars == {}


def test_zero_volume_rows_are_skipped():
    source, session = _series_test_source('FOO,EQ,10,11,9,10.5,0,01-JAN-2024')

    bars = source.fetch_session(session)

    assert bars == {}


def test_invalid_rows_are_skipped_without_aborting_the_session():
    source, session = _series_test_source(
        # open (-5) is below low (9): fails HistoricalCandle's OHLC-ordering check.
        'BAD,EQ,-5,11,9,10,100,01-JAN-2024',
        'GOOD,EQ,10,11,9,10.5,200,01-JAN-2024',
    )

    bars = source.fetch_session(session)

    assert set(bars) == {'GOOD'}


# --------------------------------------------------------------------------------------
# Symbol catalog
# --------------------------------------------------------------------------------------

def _catalog_client() -> FakeIndiaHttpClient:
    return FakeIndiaHttpClient({
        _EQUITY_MASTER_URL: _read_fixture('nse_equity_l.csv').encode(),
        _ETF_MASTER_URL: _read_fixture('nse_eq_etfseclist.csv').encode(),
    })


def test_catalog_reports_stock_and_etf_kinds_with_names():
    source = NseBhavcopySource(client=_catalog_client())

    entries = {entry.symbol: entry for entry in source.list_symbol_entries()}

    assert entries['RELIANCE-INR'].kind == 'Stock'
    assert entries['RELIANCE-INR'].name == 'Reliance Industries Limited'
    assert entries['TCS-INR'].kind == 'Stock'
    assert entries['NIFTYBEES-INR'].kind == 'ETF'
    assert entries['NIFTYBEES-INR'].name == 'NIPINDETFNIFTYBEES'
    assert entries['ALPHAETF-INR'].kind == 'ETF'
    assert all(entry.venue == 'NSE' for entry in entries.values())


def test_search_symbols_ranks_symbol_prefix_matches_first():
    provider = IndiaExchangeProvider('NSE', source=NseBhavcopySource(client=_catalog_client()))

    results = provider.search_symbols('TCS')

    assert results[0] == 'TCS-INR'


def test_ticker_search_capability_true_for_nse_false_for_source_without_catalog():
    nse_provider = IndiaExchangeProvider('NSE', source=NseBhavcopySource(client=_catalog_client()))
    assert nse_provider.capabilities.ticker_search is True

    class _NoCatalogSource(IndiaDailySource):
        source_id = 'no-catalog'
        exchange = 'NSE'
        prices_adjusted = False

        def fetch_daily_bars(self, ticker, sessions):
            return []

    no_catalog_provider = IndiaExchangeProvider('NSE', source=_NoCatalogSource())
    assert no_catalog_provider.capabilities.ticker_search is False


# --------------------------------------------------------------------------------------
# Default registration
# --------------------------------------------------------------------------------------

def test_india_exchange_provider_resolves_to_nse_bhavcopy_source_by_default():
    provider = IndiaExchangeProvider('NSE')

    assert isinstance(provider._source, NseBhavcopySource)
    assert provider.source_id == 'nse_bhavcopy'


# --------------------------------------------------------------------------------------
# Fix-up 1: short rows must never raise AttributeError
# --------------------------------------------------------------------------------------

def test_legacy_row_with_missing_trailing_timestamp_is_skipped_as_invalid_not_raised():
    # The row has 6 fields where the header has 8 - TOTTRDQTY and TIMESTAMP are missing,
    # filled in by DictReader as None. Must not raise AttributeError on `.strip()`.
    source, session = _series_test_source(
        'FOO,EQ,10,11,9,10.5',
        'GOOD,EQ,10,11,9,10.5,200,01-JAN-2024',
    )

    bars = source.fetch_session(session)

    assert set(bars) == {'GOOD'}


def test_udiff_row_truncated_mid_way_is_skipped_as_invalid_not_raised():
    session = date(2024, 7, 8)
    header = ','.join(_UDIFF_REQUIRED_COLUMNS)
    # Only the first 5 columns are present (TckrSymb, SctySrs, OpnPric, HghPric, LwPric in
    # this header's column order) - ClsPric, TtlTradgVol, TradDt, Sgmt, FinInstrmTp are all
    # missing/None, same as a response cut off mid-transfer.
    truncated_row = 'TCS,EQ,4022.00,4031.25,3978.05'
    good_row = 'RELIANCE,EQ,3178.00,3217.60,3165.05,3201.80,4750403,2024-07-08,CM,STK'
    text = f'{header}\n{truncated_row}\n{good_row}\n'
    client = FakeIndiaHttpClient({_udiff_url(session): _zip_bytes(text)})
    source = NseBhavcopySource(client=client)

    bars = source.fetch_session(session)

    assert set(bars) == {'RELIANCE'}


# --------------------------------------------------------------------------------------
# Fix-up 2: catalog resilience against a ticker to_jesse_symbol rejects
# --------------------------------------------------------------------------------------

def test_catalog_skips_a_ticker_to_jesse_symbol_rejects_without_aborting():
    equity_text = (
        'SYMBOL,NAME OF COMPANY, SERIES, DATE OF LISTING, PAID UP VALUE, MARKET LOT, ISIN NUMBER, FACE VALUE\n'
        'RELIANCE,Reliance Industries Limited,EQ,29-NOV-1995,10,1,INE002A01018,10\n'
        'A-B-C,Two Hyphen Ticker Ltd,EQ,01-JAN-2000,1,1,INE000000000,1\n'  # rejected: more than one '-'
    )
    etf_text = 'Symbol,Underlying Asset,SecurityName,DateofListing,MarketLot,ISINNumber,FaceValue,ETF Underlying,Underlying Key\n'
    client = FakeIndiaHttpClient({_EQUITY_MASTER_URL: equity_text.encode(), _ETF_MASTER_URL: etf_text.encode()})
    source = NseBhavcopySource(client=client)

    entries = source.list_symbol_entries()

    symbols = {entry.symbol for entry in entries}
    assert symbols == {'RELIANCE-INR'}


# --------------------------------------------------------------------------------------
# Fix-up 3: zip/decode errors
# --------------------------------------------------------------------------------------

def test_corrupted_zip_body_with_valid_pk_signature_raises_provider_schema_error():
    session = date(2024, 1, 1)
    corrupted = b'PK\x03\x04' + b'\x00' * 40  # looks like a zip, isn't a valid one
    client = FakeIndiaHttpClient({_udiff_url(session): corrupted})
    source = NseBhavcopySource(client=client)

    with pytest.raises(ProviderSchemaError, match='corrupted'):
        source.fetch_session(session)


def test_non_utf8_archive_content_raises_provider_schema_error():
    session = date(2024, 1, 1)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as archive:
        archive.writestr('bhav.csv', b'\xff\xfe\x00\x01not utf-8')
    client = FakeIndiaHttpClient({_udiff_url(session): buffer.getvalue()})
    source = NseBhavcopySource(client=client)

    with pytest.raises(ProviderSchemaError, match='UTF-8'):
        source.fetch_session(session)


def test_non_utf8_master_file_raises_provider_schema_error():
    # A plain (non-zipped) master-file payload that isn't valid UTF-8 - exercises
    # `read_csv_rows`'s use of the shared `decode_csv_bytes`, distinct from the zipped
    # bhavcopy path covered by `test_non_utf8_archive_content_raises_provider_schema_error`.
    client = FakeIndiaHttpClient({
        _EQUITY_MASTER_URL: b'\xff\xfe\x00\x01not utf-8',
        _ETF_MASTER_URL: b'Symbol,Underlying Asset,SecurityName,DateofListing,MarketLot,ISINNumber,FaceValue,ETF Underlying,Underlying Key\n',
    })
    source = NseBhavcopySource(client=client)

    with pytest.raises(ProviderSchemaError, match='UTF-8'):
        source.list_symbol_entries()


def test_zip_with_directory_entry_plus_one_csv_parses_fine():
    session = date(2024, 1, 1)
    text = _SERIES_TEST_HEADER + '\nFOO,EQ,10,11,9,10.5,200,01-JAN-2024\n'
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as archive:
        archive.writestr('folder/', '')  # a directory entry, not a second data file
        archive.writestr(_expected_legacy_member_name(session), text)
    client = FakeIndiaHttpClient({_udiff_url(session): None, _legacy_url(session): buffer.getvalue()})
    source = NseBhavcopySource(client=client)

    bars = source.fetch_session(session)

    assert set(bars) == {'FOO'}


# --------------------------------------------------------------------------------------
# Fix-up 4: a ticker in both master files is listed exactly once, as ETF
# --------------------------------------------------------------------------------------

def test_ticker_in_both_master_files_is_listed_once_as_etf():
    equity_text = (
        'SYMBOL,NAME OF COMPANY, SERIES, DATE OF LISTING, PAID UP VALUE, MARKET LOT, ISIN NUMBER, FACE VALUE\n'
        'DUALTICKER,Dual Ticker As Stock,EQ,01-JAN-2000,1,1,INE000000001,1\n'
    )
    etf_text = (
        'Symbol,Underlying Asset,SecurityName,DateofListing,MarketLot,ISINNumber,FaceValue,ETF Underlying,Underlying Key\n'
        'DUALTICKER,Some Index,Dual Ticker As ETF,01-JAN-2000,1,INE000000001,1,EQUITY,Some Index\n'
    )
    client = FakeIndiaHttpClient({_EQUITY_MASTER_URL: equity_text.encode(), _ETF_MASTER_URL: etf_text.encode()})
    source = NseBhavcopySource(client=client)

    entries = [entry for entry in source.list_symbol_entries() if entry.symbol == 'DUALTICKER-INR']

    assert len(entries) == 1
    assert entries[0].kind == 'ETF'


# --------------------------------------------------------------------------------------
# Fix-up 5: non-positive prices are rejected
# --------------------------------------------------------------------------------------

@pytest.mark.parametrize('bad_row', [
    'FOO,EQ,0,11,9,10.5,200,01-JAN-2024',      # open == 0
    'FOO,EQ,10,11,9,-1,200,01-JAN-2024',       # close < 0 (also violates low<=close, belt & suspenders)
    'FOO,EQ,10,0,9,10,200,01-JAN-2024',        # high == 0
])
def test_non_positive_prices_are_skipped_as_invalid(bad_row):
    source, session = _series_test_source(bad_row, 'GOOD,EQ,10,11,9,10.5,200,01-JAN-2024')

    bars = source.fetch_session(session)

    assert set(bars) == {'GOOD'}


# --------------------------------------------------------------------------------------
# Fix-up 6: dates - empty/unparseable is a row-scoped invalid skip; a parseable but
# mismatched date still aborts the whole session (test_row_date_mismatch_raises_
# provider_schema_error above already covers the second half).
# --------------------------------------------------------------------------------------

def test_empty_or_unparseable_date_is_skipped_as_invalid_not_raised():
    source, session = _series_test_source(
        'EMPTYDATE,EQ,10,11,9,10.5,200,',
        'BADDATE,EQ,10,11,9,10.5,200,not-a-date',
        'GOOD,EQ,10,11,9,10.5,200,01-JAN-2024',
    )

    bars = source.fetch_session(session)

    assert set(bars) == {'GOOD'}


# --------------------------------------------------------------------------------------
# Fix-up 7: search_symbols edge cases, limit truncation, BOM and quoted-comma masters
# --------------------------------------------------------------------------------------

def test_search_symbols_returns_empty_tuple_for_blank_query():
    provider = IndiaExchangeProvider('NSE', source=NseBhavcopySource(client=_catalog_client()))

    assert provider.search_symbols('') == ()
    assert provider.search_symbols('   ') == ()


def test_search_symbols_respects_limit():
    provider = IndiaExchangeProvider('NSE', source=NseBhavcopySource(client=_catalog_client()))

    # 'A' matches multiple catalog entries in the fixtures (ALLCARGO, ALPHA, ALPHAETF, ...).
    results = provider.search_symbols('A', limit=1)

    assert len(results) == 1


def test_catalog_master_with_bom_prefix_parses_fine():
    # No literal '﻿' in this string - encode(..., 'utf-8-sig') below is what adds the
    # real 3-byte UTF-8 BOM, same as NSE's file would arrive as raw bytes over the wire.
    equity_text = (
        'SYMBOL,NAME OF COMPANY, SERIES, DATE OF LISTING, PAID UP VALUE, MARKET LOT, ISIN NUMBER, FACE VALUE\n'
        'RELIANCE,Reliance Industries Limited,EQ,29-NOV-1995,10,1,INE002A01018,10\n'
    )
    etf_text = 'Symbol,Underlying Asset,SecurityName,DateofListing,MarketLot,ISINNumber,FaceValue,ETF Underlying,Underlying Key\n'
    client = FakeIndiaHttpClient({
        _EQUITY_MASTER_URL: equity_text.encode('utf-8-sig'),
        _ETF_MASTER_URL: etf_text.encode(),
    })
    source = NseBhavcopySource(client=client)

    entries = {entry.symbol: entry for entry in source.list_symbol_entries()}

    assert entries['RELIANCE-INR'].name == 'Reliance Industries Limited'


def test_catalog_master_with_quoted_comma_in_company_name_parses_correctly():
    equity_text = (
        'SYMBOL,NAME OF COMPANY, SERIES, DATE OF LISTING, PAID UP VALUE, MARKET LOT, ISIN NUMBER, FACE VALUE\n'
        '"TATASTEEL","Tata Steel, Limited",EQ,29-NOV-1995,10,1,INE081A01012,10\n'
    )
    etf_text = 'Symbol,Underlying Asset,SecurityName,DateofListing,MarketLot,ISINNumber,FaceValue,ETF Underlying,Underlying Key\n'
    client = FakeIndiaHttpClient({_EQUITY_MASTER_URL: equity_text.encode(), _ETF_MASTER_URL: etf_text.encode()})
    source = NseBhavcopySource(client=client)

    entries = {entry.symbol: entry for entry in source.list_symbol_entries()}

    assert entries['TATASTEEL-INR'].name == 'Tata Steel, Limited'
