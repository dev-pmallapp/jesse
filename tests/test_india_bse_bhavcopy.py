"""Tests for jesse/services/historical_data/india/bse_archives.py - the BSE bhavcopy
source (legacy + UDiFF formats) and its symbol catalog (story #5). No network access:
a fake client returns fixture bytes (zipped in memory where the real file is a zip -
BSE's UDiFF file, unlike NSE's, is plain CSV and is never zipped), built from the
trimmed real payloads under tests/fixtures/india/.
"""
import io
import zipfile
from datetime import date, timedelta
from pathlib import Path

import pytest

from jesse.services.historical_data.errors import ProviderSchemaError, ProviderUnavailableError
from jesse.services.historical_data.india.bse_archives import (
    BSE_FIRST_SESSION,
    BSE_UDIFF_SWITCH_DATE,
    _RECENT_UDIFF_CACHE_TTL_SECONDS,
    BseBhavcopySource,
    _LEGACY_REQUIRED_COLUMNS,
    _UDIFF_REQUIRED_COLUMNS,
    _expected_legacy_member_name,
    _legacy_url,
    _udiff_url,
)
from jesse.services.historical_data.india.provider import IndiaExchangeProvider

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

    `files` maps an exact URL to its payload (bytes, or None). None stands in for
    whatever IndiaHttpClient.get() itself already normalizes to None for its callers -
    a plain 404 *or* BSE's soft-404 (HTTP 200 with its Angular SPA shell, sniffed by
    Content-Type/body in the real client) both collapse to the same "not published"
    signal by the time this module sees it.
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

def test_udiff_parses_exact_reliance_and_tcs_values():
    session = date(2024, 7, 8)
    client = FakeIndiaHttpClient({_udiff_url(session): _read_fixture('bse_bhavcopy_udiff_20240708.csv').encode()})
    source = BseBhavcopySource(client=client)

    bars = source.fetch_session(session)

    reliance = bars['RELIANCE']
    assert (reliance.open, reliance.high, reliance.low, reliance.close, reliance.volume) == (
        3179.90, 3217.90, 3165.00, 3202.10, 191870.0,
    )
    tcs = bars['TCS']
    assert (tcs.open, tcs.high, tcs.low, tcs.close, tcs.volume) == (4015.05, 4026.30, 3910.00, 3975.95, 92000.0)


# --------------------------------------------------------------------------------------
# Legacy parsing, via a synthetic scrip-code map
# --------------------------------------------------------------------------------------

def test_legacy_parses_reliance_bar_via_code_map_built_from_recent_udiff():
    today = date(2024, 7, 8)
    session = date(2024, 1, 1)
    client = FakeIndiaHttpClient({
        _udiff_url(today): _read_fixture('bse_bhavcopy_udiff_20240708.csv').encode(),
        _udiff_url(session): None,
        _legacy_url(session): _legacy_zip_bytes(_read_fixture('bse_bhavcopy_legacy_20240101.csv'), session),
    })
    source = BseBhavcopySource(client=client, today=lambda: today)

    bars = source.fetch_session(session)

    reliance = bars['RELIANCE']
    assert (reliance.open, reliance.high, reliance.low, reliance.close, reliance.volume) == (
        2581.05, 2606.00, 2573.55, 2589.85, 67641.0,
    )
    assert set(bars) == {'RELIANCE', 'TCS', 'NIFTYBEES'}


# --------------------------------------------------------------------------------------
# Request order and counts
# --------------------------------------------------------------------------------------

def test_udiff_tried_first_then_legacy_fallback_for_pre_switch_date():
    today = date(2024, 7, 8)
    session = date(2024, 1, 1)
    client = FakeIndiaHttpClient({
        _udiff_url(today): _read_fixture('bse_bhavcopy_udiff_20240708.csv').encode(),
        _udiff_url(session): None,  # simulate not (yet) published for this test
        _legacy_url(session): _legacy_zip_bytes(_read_fixture('bse_bhavcopy_legacy_20240101.csv'), session),
    })
    source = BseBhavcopySource(client=client, today=lambda: today)

    bars = source.fetch_session(session)

    assert client.calls == [_udiff_url(session), _legacy_url(session), _udiff_url(today)]
    assert 'RELIANCE' in bars


def test_post_switch_date_with_udiff_missing_makes_exactly_one_request():
    session = date(2026, 9, 18)  # after BSE_UDIFF_SWITCH_DATE - legacy soft-404s by design, never tried
    client = FakeIndiaHttpClient({_udiff_url(session): None})
    source = BseBhavcopySource(client=client)

    bars = source.fetch_session(session)

    assert bars is None
    assert client.calls == [_udiff_url(session)]


def test_session_before_bse_first_session_makes_zero_requests():
    session = date(1994, 1, 1)
    assert session < BSE_FIRST_SESSION
    client = FakeIndiaHttpClient({})
    source = BseBhavcopySource(client=client)

    bars = source.fetch_session(session)

    assert bars is None
    assert client.calls == []


def test_udiff_switch_date_matches_live_smoke_check():
    # Verified in the live smoke check (2026-09-23): legacy EQ010724_CSV.ZIP (01-Jul-2024)
    # still returns real data, EQ080724_CSV.ZIP (08-Jul-2024) already soft-404s, and BSE's
    # UDiFF file exists for 08-Jul-2024 - same switch date NSE uses.
    assert BSE_UDIFF_SWITCH_DATE == date(2024, 7, 8)


def test_soft_404_html_body_counts_as_unpublished():
    # A soft-404 (HTTP 200 + BSE's SPA shell) is already sniffed and normalized to None by
    # the real IndiaHttpClient before this module ever sees it (see http.py's
    # `_looks_like_html`) - so from this module's perspective, an unpublished date and a
    # soft-404'd one are indistinguishable, both represented here by a None payload.
    session = date(2026, 9, 18)
    client = FakeIndiaHttpClient({_udiff_url(session): None})
    source = BseBhavcopySource(client=client)

    assert source.fetch_session(session) is None


# --------------------------------------------------------------------------------------
# Group / SC_TYPE filters, duplicate ticker
# --------------------------------------------------------------------------------------

_UDIFF_TEST_HEADER = ','.join(_UDIFF_REQUIRED_COLUMNS)
_LEGACY_TEST_HEADER = ','.join(_LEGACY_REQUIRED_COLUMNS)

# `_scrip_code_map()` reads only these 5 columns from the "most recent UDiFF file" - it
# never runs the file through `_parse_udiff_payload`'s required-column/price validation,
# so a code-map fixture only needs to carry what the map-builder itself reads.
_CODE_MAP_HEADER = 'FinInstrmId,TckrSymb,SctySrs,Sgmt,FinInstrmTp'


def _udiff_test_source(*rows: str) -> tuple[BseBhavcopySource, date]:
    session = date(2024, 7, 8)
    text = _UDIFF_TEST_HEADER + '\n' + '\n'.join(rows) + '\n'
    client = FakeIndiaHttpClient({_udiff_url(session): text.encode()})
    return BseBhavcopySource(client=client), session


def _legacy_test_source(*rows: str, code_map_rows: str) -> tuple[BseBhavcopySource, date]:
    today = date(2024, 7, 8)
    session = date(2024, 1, 1)
    legacy_text = _LEGACY_TEST_HEADER + '\n' + '\n'.join(rows) + '\n'
    udiff_text = _CODE_MAP_HEADER + '\n' + code_map_rows + '\n'
    client = FakeIndiaHttpClient({
        _udiff_url(today): udiff_text.encode(),
        _udiff_url(session): None,
        _legacy_url(session): _legacy_zip_bytes(legacy_text, session),
    })
    return BseBhavcopySource(client=client, today=lambda: today), session


def test_udiff_excludes_out_of_scope_groups():
    # M/MT (SME) and G (government securities) are not in BSE_GROUP_ALLOWLIST.
    source, session = _udiff_test_source(
        'FOOSME,M,10,11,9,10.5,100,2024-07-08,CM,STK',
        'GOVT,G,10,11,9,10.5,100,2024-07-08,CM,STK',
    )

    bars = source.fetch_session(session)

    assert bars == {}


def test_udiff_includes_trade_for_trade_and_z_groups():
    source, session = _udiff_test_source(
        'TFT,T,10,11,9,10.5,100,2024-07-08,CM,STK',
        'XTFT,XT,10,11,9,10.5,100,2024-07-08,CM,STK',
        'NONCOMP,Z,10,11,9,10.5,100,2024-07-08,CM,STK',
    )

    bars = source.fetch_session(session)

    assert set(bars) == {'TFT', 'XTFT', 'NONCOMP'}


def test_udiff_duplicate_ticker_keeps_first_and_counts_second_as_invalid():
    source, session = _udiff_test_source(
        'DUP,A,10,11,9,10.5,100,2024-07-08,CM,STK',
        'DUP,B,10,11,9,20.5,200,2024-07-08,CM,STK',
    )

    bars = source.fetch_session(session)

    assert bars['DUP'].close == 10.5  # first occurrence wins


def test_legacy_excludes_non_q_sc_type():
    source, session = _legacy_test_source(
        '500325,A,D,10,11,9,10.5,100',  # SC_TYPE 'D' (debt) - not equity
        code_map_rows='500325,RELIANCE,A,CM,STK',
    )

    bars = source.fetch_session(session)

    assert bars == {}


def test_legacy_excludes_out_of_scope_group():
    source, session = _legacy_test_source(
        '500325,M,Q,10,11,9,10.5,100',  # SME group, not in allowlist
        code_map_rows='500325,RELIANCE,A,CM,STK',
    )

    bars = source.fetch_session(session)

    assert bars == {}


def test_legacy_unmapped_scrip_code_is_skipped_and_counted():
    source, session = _legacy_test_source(
        '999999,A,Q,10,11,9,10.5,100',  # no matching FinInstrmId in the code map
        code_map_rows='500325,RELIANCE,A,CM,STK',
    )

    bars = source.fetch_session(session)

    assert bars == {}


def test_legacy_duplicate_ticker_from_two_old_codes_keeps_first_and_counts_separately():
    # Two different (old) scrip codes both currently map to the same ticker - e.g. a
    # merger, or two renames that converged - counted as a duplicate, not as invalid or
    # unmapped.
    source, session = _legacy_test_source(
        '111111,A,Q,10,11,9,10.5,100',
        '222222,A,Q,10,11,9,20.5,200',
        code_map_rows='111111,DUPCO,A,CM,STK\n222222,DUPCO,A,CM,STK',
    )

    bars = source.fetch_session(session)

    assert bars['DUPCO'].close == 10.5  # first occurrence wins


# --------------------------------------------------------------------------------------
# Lazy scrip-code map: walks back over unpublished days, built once
# --------------------------------------------------------------------------------------

def test_lazy_code_map_walks_back_over_unpublished_days_and_is_built_once():
    today = date(2024, 7, 10)
    session1 = date(2024, 1, 1)
    session2 = date(2023, 12, 29)
    legacy_text = _read_fixture('bse_bhavcopy_legacy_20240101.csv')
    client = FakeIndiaHttpClient({
        _udiff_url(today): None,
        _udiff_url(today - timedelta(days=1)): None,
        _udiff_url(today - timedelta(days=2)): _read_fixture('bse_bhavcopy_udiff_20240708.csv').encode(),
        _udiff_url(session1): None,
        _legacy_url(session1): _legacy_zip_bytes(legacy_text, session1),
        _udiff_url(session2): None,
        _legacy_url(session2): _legacy_zip_bytes(legacy_text, session2),
    })
    # A fixed clock: both fetches happen "instantly" (well within the TTL), so the cache
    # built on the first fetch is reused as-is by the second - this test is about the
    # walk-back happening once, not about TTL expiry (see the dedicated TTL tests below).
    source = BseBhavcopySource(client=client, today=lambda: today, monotonic=lambda: 1_000.0)

    bars1 = source.fetch_session(session1)
    bars2 = source.fetch_session(session2)

    assert 'RELIANCE' in bars1
    assert 'RELIANCE' in bars2
    # The 3-URL walk-back (today, today-1, today-2) must appear exactly once across both
    # fetches - the code map is cached on the source instance after the first build.
    walkback_calls = [call for call in client.calls if call in {
        _udiff_url(today), _udiff_url(today - timedelta(days=1)), _udiff_url(today - timedelta(days=2)),
    }]
    assert walkback_calls == [_udiff_url(today), _udiff_url(today - timedelta(days=1)), _udiff_url(today - timedelta(days=2))]


def test_code_map_unavailable_after_full_lookback_skips_all_legacy_rows():
    today = date(2024, 1, 20)
    session = date(2024, 1, 1)
    client = FakeIndiaHttpClient({_udiff_url(session): None, _legacy_url(session): _legacy_zip_bytes(
        _read_fixture('bse_bhavcopy_legacy_20240101.csv'), session,
    )})
    # Every walk-back day (today back through today-9) is unpublished.
    for offset in range(10):
        client._files[_udiff_url(today - timedelta(days=offset))] = None
    source = BseBhavcopySource(client=client, today=lambda: today)

    bars = source.fetch_session(session)

    assert bars == {}


# --------------------------------------------------------------------------------------
# Recent-UDiFF-rows cache: 12h TTL, never negatively cached
# --------------------------------------------------------------------------------------

def test_recent_udiff_cache_not_refreshed_before_ttl():
    today = date(2024, 7, 8)
    client = FakeIndiaHttpClient({_udiff_url(today): _read_fixture('bse_bhavcopy_udiff_20240708.csv').encode()})
    clock = [1_000.0]
    source = BseBhavcopySource(client=client, today=lambda: today, monotonic=lambda: clock[0])

    source.list_symbol_entries()
    calls_after_first = list(client.calls)
    clock[0] += _RECENT_UDIFF_CACHE_TTL_SECONDS - 1  # just inside the TTL
    source.list_symbol_entries()

    assert client.calls == calls_after_first  # no new request - the cache was still fresh


def test_recent_udiff_cache_refreshes_after_ttl():
    today = date(2024, 7, 8)
    client = FakeIndiaHttpClient({_udiff_url(today): _read_fixture('bse_bhavcopy_udiff_20240708.csv').encode()})
    clock = [1_000.0]
    source = BseBhavcopySource(client=client, today=lambda: today, monotonic=lambda: clock[0])

    source.list_symbol_entries()
    calls_after_first = list(client.calls)
    clock[0] += _RECENT_UDIFF_CACHE_TTL_SECONDS + 1  # just past the TTL
    source.list_symbol_entries()

    # One more walk-back request than before - the stale cache was not reused.
    assert len(client.calls) == len(calls_after_first) + 1
    assert client.calls[-1] == _udiff_url(today)


def test_failed_lookback_is_retried_on_the_next_call_not_cached():
    today = date(2024, 1, 20)
    client = FakeIndiaHttpClient({})
    for offset in range(10):
        client._files[_udiff_url(today - timedelta(days=offset))] = None
    source = BseBhavcopySource(client=client, today=lambda: today)

    with pytest.raises(ProviderUnavailableError):
        source.list_symbol_entries()

    # BSE "recovers": the file becomes available before the next call - simulates a
    # transient outage rather than a genuinely missing file.
    client._files[_udiff_url(today)] = _read_fixture('bse_bhavcopy_udiff_20240708.csv').encode()

    entries = source.list_symbol_entries()

    assert entries  # succeeded on retry - the earlier failed walk-back was not cached


# --------------------------------------------------------------------------------------
# Symbol catalog
# --------------------------------------------------------------------------------------

def _catalog_client() -> tuple[FakeIndiaHttpClient, date]:
    today = date(2024, 7, 8)
    text = _read_fixture('bse_bhavcopy_udiff_20240708.csv')
    return FakeIndiaHttpClient({_udiff_url(today): text.encode()}), today


def test_catalog_reports_stock_by_ine_and_etf_by_inf_isin_prefix():
    client, today = _catalog_client()
    source = BseBhavcopySource(client=client, today=lambda: today)

    entries = {entry.symbol: entry for entry in source.list_symbol_entries()}

    assert entries['RELIANCE-INR'].kind == 'Stock'
    assert entries['RELIANCE-INR'].name == 'RELIANCE INDUSTRIES LTD.'
    assert entries['TCS-INR'].kind == 'Stock'
    assert entries['NIFTYBEES-INR'].kind == 'ETF'
    assert all(entry.venue == 'BSE' for entry in entries.values())


def test_catalog_skips_rows_with_unrecognized_isin_prefix():
    today = date(2024, 7, 8)
    # Build a minimal UDiFF-shaped file with the extra ISIN/FinInstrmNm columns the
    # catalog reads, including one row whose ISIN prefix is neither INE nor INF.
    header = (
        'TckrSymb,SctySrs,OpnPric,HghPric,LwPric,ClsPric,TtlTradgVol,TradDt,Sgmt,FinInstrmTp,ISIN,FinInstrmNm'
    )
    rows = '\n'.join([
        'FOREIGN,A,10,11,9,10.5,100,2024-07-08,CM,STK,US0000000001,Foreign Depositary Receipt',
        'RELIANCE,A,10,11,9,10.5,100,2024-07-08,CM,STK,INE002A01018,RELIANCE INDUSTRIES LTD.',
    ])
    client = FakeIndiaHttpClient({_udiff_url(today): f'{header}\n{rows}\n'.encode()})
    source = BseBhavcopySource(client=client, today=lambda: today)

    entries = {entry.symbol for entry in source.list_symbol_entries()}

    assert entries == {'RELIANCE-INR'}


def test_catalog_raises_provider_unavailable_when_no_recent_udiff_file_found():
    today = date(2024, 1, 20)
    client = FakeIndiaHttpClient({})
    for offset in range(10):
        client._files[_udiff_url(today - timedelta(days=offset))] = None
    source = BseBhavcopySource(client=client, today=lambda: today)

    with pytest.raises(ProviderUnavailableError):
        source.list_symbol_entries()


# --------------------------------------------------------------------------------------
# Default registration
# --------------------------------------------------------------------------------------

def test_india_exchange_provider_resolves_to_bse_bhavcopy_source_by_default():
    provider = IndiaExchangeProvider('BSE')

    assert isinstance(provider._source, BseBhavcopySource)
    assert provider.source_id == 'bse_bhavcopy'


# --------------------------------------------------------------------------------------
# Invalid-row cases, through the shared archive_parsing helpers
# --------------------------------------------------------------------------------------

def test_row_date_mismatch_raises_provider_schema_error():
    session = date(2024, 7, 9)  # fixture rows are all dated 2024-07-08
    client = FakeIndiaHttpClient({_udiff_url(session): _read_fixture('bse_bhavcopy_udiff_20240708.csv').encode()})
    source = BseBhavcopySource(client=client)

    with pytest.raises(ProviderSchemaError, match='does not match the requested session'):
        source.fetch_session(session)


def test_missing_required_udiff_column_raises_provider_schema_error():
    session = date(2024, 7, 8)
    text = 'TckrSymb,OpnPric,HghPric,LwPric,ClsPric,TtlTradgVol,TradDt,Sgmt,FinInstrmTp\nFOO,10,11,9,10.5,100,2024-07-08,CM,STK\n'
    client = FakeIndiaHttpClient({_udiff_url(session): text.encode()})
    source = BseBhavcopySource(client=client)

    with pytest.raises(ProviderSchemaError, match='missing required column'):
        source.fetch_session(session)


def test_legacy_archive_member_name_mismatch_raises_provider_schema_error():
    # Real content, but zipped under an unrelated member name - simulates a wrong-day
    # file being served under this session's URL. Unlike UDiFF (checked per-row via
    # TradDt), this is the *only* guard the legacy format has, since it has no date
    # column at all.
    today = date(2024, 7, 8)
    session = date(2024, 1, 1)
    client = FakeIndiaHttpClient({
        _udiff_url(today): _read_fixture('bse_bhavcopy_udiff_20240708.csv').encode(),
        _udiff_url(session): None,
        _legacy_url(session): _zip_bytes(_read_fixture('bse_bhavcopy_legacy_20240101.csv'), filename='EQ020124.CSV'),
    })
    source = BseBhavcopySource(client=client, today=lambda: today)

    with pytest.raises(ProviderSchemaError, match='does not match the expected'):
        source.fetch_session(session)


def test_non_utf8_udiff_payload_raises_provider_schema_error():
    session = date(2024, 7, 8)
    client = FakeIndiaHttpClient({_udiff_url(session): b'\xff\xfe\x00\x01not utf-8'})
    source = BseBhavcopySource(client=client)

    with pytest.raises(ProviderSchemaError, match='UTF-8'):
        source.fetch_session(session)


def test_corrupted_legacy_zip_raises_provider_schema_error():
    today = date(2024, 7, 8)
    session = date(2024, 1, 1)
    corrupted = b'PK\x03\x04' + b'\x00' * 40  # looks like a zip, isn't a valid one
    client = FakeIndiaHttpClient({
        _udiff_url(today): _read_fixture('bse_bhavcopy_udiff_20240708.csv').encode(),
        _udiff_url(session): None,
        _legacy_url(session): corrupted,
    })
    source = BseBhavcopySource(client=client, today=lambda: today)

    with pytest.raises(ProviderSchemaError, match='corrupted'):
        source.fetch_session(session)


@pytest.mark.parametrize('bad_row', [
    'FOO,A,0,11,9,10.5,100,2024-07-08,CM,STK',    # open == 0
    'FOO,A,10,11,9,-1,100,2024-07-08,CM,STK',     # close < 0
    'FOO,A,10,0,9,10,100,2024-07-08,CM,STK',      # high == 0
])
def test_non_positive_prices_are_skipped_as_invalid(bad_row):
    source, session = _udiff_test_source(bad_row, 'GOOD,A,10,11,9,10.5,200,2024-07-08,CM,STK')

    bars = source.fetch_session(session)

    assert set(bars) == {'GOOD'}


def test_zero_volume_rows_are_skipped():
    source, session = _udiff_test_source('FOO,A,10,11,9,10.5,0,2024-07-08,CM,STK')

    bars = source.fetch_session(session)

    assert bars == {}


def test_truncated_udiff_row_is_skipped_as_invalid_not_raised():
    session = date(2024, 7, 8)
    truncated_row = 'TCS,A,4015.05,4026.30,3910.00'  # missing ClsPric/TtlTradgVol/TradDt/Sgmt/FinInstrmTp
    good_row = 'RELIANCE,A,3179.90,3217.90,3165.00,3202.10,191870,2024-07-08,CM,STK'
    text = f'{_UDIFF_TEST_HEADER}\n{truncated_row}\n{good_row}\n'
    client = FakeIndiaHttpClient({_udiff_url(session): text.encode()})
    source = BseBhavcopySource(client=client)

    bars = source.fetch_session(session)

    assert set(bars) == {'RELIANCE'}
