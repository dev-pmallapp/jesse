"""NSE bhavcopy daily-bar source (story #4 in docs/india-markets/PLAN.md).

Implements `ArchiveDailySource` against NSE's two published whole-market
"bhavcopy" formats, both served unauthenticated from `nsearchives.nseindia.com`
(see docs/india-markets/spike-sources.md sections 1/2/8 for the verified
findings this module encodes):

- UDiFF (`BhavCopy_NSE_CM_0_0_0_<YYYYMMDD>_F_0000.csv.zip`): NSE's current
  format, confirmed backfilled to at least 2024-01-01. Its full depth was not
  probed, so it is tried first for every session rather than only from the
  known switch date onward.
- legacy (`cm<DD><MON><YYYY>bhav.csv.zip`): the older format. Confirmed to
  404 for any date on/after the UDiFF switch, so it is only ever tried as a
  fallback for earlier dates.

Also implements the symbol catalog from NSE's separate equity/ETF security
master files (`EQUITY_L.csv` / `eq_etfseclist.csv`).

Format-level parsing shared with BSE's UDiFF file (zip unwrapping, None-safe
field access, CSV parsing, date parsing/validation, the positive-price rule)
lives in `archive_parsing.py`; this module keeps only what is NSE-specific:
URLs, the series allowlist/priority, the legacy zip's expected member name, and
the catalog.
"""
from datetime import date

import jesse.helpers as jh

from ..contracts import SymbolCatalogEntry
from ..errors import HistoricalDataRequestError, ProviderSchemaError, ProviderUnavailableError
from .archive_parsing import (
    MONTH_ABBREVIATIONS,
    ROW_INVALID,
    ROW_SKIPPED,
    build_bar,
    check_archive_member_name,
    check_session_date,
    field,
    parse_iso_date,
    parse_legacy_date,
    read_csv_rows,
    read_csv_rows_from_text,
    unzip_single_csv,
)
from .http import IndiaHttpClient
from .sources import ArchiveDailySource, DailyBar, register_source
from .symbols import to_jesse_symbol

# NSE's capital market (CM) segment began trading on this date (verified in the
# source-probe spike: cm03JAN1994bhav.csv.zip 404s, cm03NOV1994bhav.csv.zip
# doesn't). Requesting bhavcopy for an earlier date would always be a wasted
# request confirming a fact that is already known.
NSE_FIRST_SESSION = date(1994, 11, 3)

# NSE switched its canonical bhavcopy format to UDiFF on this date. The legacy
# file format stops being generated for sessions on/after it (confirmed 404 in
# the spike), so legacy is only ever tried as a fallback strictly before it.
UDIFF_SWITCH_DATE = date(2024, 7, 8)

# Series priority, lower is kept when a ticker appears in more than one on the
# same day. EQ is normal rolling-settlement trading; BE/BZ are the same
# company moved to trade-for-trade/surveillance and still tradable, so a stock
# keeps its history across such a move instead of appearing to stop trading.
# SME (SM/ST), debt/government-security series (GS, TB, N*, ...) and every
# other series are out of scope for now and excluded entirely.
SERIES_PRIORITY = {'EQ': 0, 'BE': 1, 'BZ': 2}

_UDIFF_URL_TEMPLATE = 'https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_{yyyymmdd}_F_0000.csv.zip'
_LEGACY_URL_TEMPLATE = (
    'https://nsearchives.nseindia.com/content/historical/EQUITIES/{year}/{month}/'
    'cm{day:02d}{month}{year}bhav.csv.zip'
)
_EQUITY_MASTER_URL = 'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv'
_ETF_MASTER_URL = 'https://nsearchives.nseindia.com/content/equities/eq_etfseclist.csv'

# Columns this module actually reads. The legacy format's column set varies by
# era (e.g. the 1995 file lacks TOTALTRADES/ISIN, which are not read here
# anyway), so only these are required - a file missing one of them is treated
# as a schema break rather than assuming a fixed layout. Per-row (as opposed to
# per-file) absence of one of these - e.g. a row truncated mid-way, or a blank
# trailing value - is a different, row-scoped failure; see `_parse_udiff_row`/
# `_parse_legacy_row`.
_UDIFF_REQUIRED_COLUMNS = (
    'TckrSymb', 'SctySrs', 'OpnPric', 'HghPric', 'LwPric', 'ClsPric', 'TtlTradgVol', 'TradDt', 'Sgmt', 'FinInstrmTp',
)
_LEGACY_REQUIRED_COLUMNS = ('SYMBOL', 'SERIES', 'OPEN', 'HIGH', 'LOW', 'CLOSE', 'TOTTRDQTY', 'TIMESTAMP')


class NseBhavcopySource(ArchiveDailySource):
    """NSE's free daily whole-market CSV archive (legacy + UDiFF), no auth required."""

    source_id = 'nse_bhavcopy'
    exchange = 'NSE'
    # Verified raw/as-traded in the source-probe spike: ALLCARGO's 3:1 bonus
    # (ex-date 2024-01-02) is not retroactively applied to earlier bhavcopy
    # closes, and PREVCLOSE is never adjusted either.
    prices_adjusted = False

    def __init__(self, client: IndiaHttpClient | None = None) -> None:
        super().__init__()
        self._client = client if client is not None else IndiaHttpClient()

    def fetch_session(self, session: date) -> dict[str, DailyBar] | None:
        if session < NSE_FIRST_SESSION:
            return None

        payload = self._client.get(_udiff_url(session), expect='zip')
        if payload is not None:
            return self._parse_archive(payload, session, is_udiff=True)

        if session < UDIFF_SWITCH_DATE:
            payload = self._client.get(_legacy_url(session), expect='zip')
            if payload is not None:
                return self._parse_archive(payload, session, is_udiff=False)

        # Neither format published for this date: a holiday, weekend, or a day
        # the archive simply doesn't have - not an error.
        return None

    def list_symbol_entries(self) -> tuple[SymbolCatalogEntry, ...]:
        etf_rows = self._fetch_master_rows(_ETF_MASTER_URL)
        etf_tickers: set[str] = set()
        entries: list[SymbolCatalogEntry] = []
        skipped_ticker_count = 0

        for row in etf_rows:
            ticker = field(row, 'Symbol').strip().upper()
            if not ticker:
                continue
            # Recorded even if the ticker later fails to encode below, so an
            # unencodable ETF ticker still excludes itself from the Stock pass.
            etf_tickers.add(ticker)
            entry = _build_catalog_entry(ticker, field(row, 'SecurityName').strip() or None, kind='ETF')
            if entry is None:
                skipped_ticker_count += 1
                continue
            entries.append(entry)

        equity_rows = self._fetch_master_rows(_EQUITY_MASTER_URL)
        for row in equity_rows:
            ticker = field(row, 'SYMBOL').strip().upper()
            # A ticker listed in both files is an ETF - EQUITY_L.csv is meant to
            # be the operating-company universe only, but nothing on the NSE
            # side guarantees the two master files are actually disjoint.
            if not ticker or ticker in etf_tickers:
                continue
            series = field(row, 'SERIES').strip().upper()
            if series not in SERIES_PRIORITY:
                continue
            entry = _build_catalog_entry(ticker, field(row, 'NAME OF COMPANY').strip() or None, kind='Stock')
            if entry is None:
                skipped_ticker_count += 1
                continue
            entries.append(entry)

        if skipped_ticker_count:
            jh.debug(
                f'NSE symbol catalog: skipped {skipped_ticker_count} ticker(s) that could not be '
                'encoded as a Jesse symbol'
            )

        return tuple(entries)

    def _fetch_master_rows(self, url: str) -> list[dict[str, str]]:
        payload = self._client.get(url, expect='csv')
        if payload is None:
            raise ProviderUnavailableError(f'NSE security master file is currently unavailable: {url}')
        return read_csv_rows(payload, label='NSE security master file')

    def _parse_archive(self, payload: bytes, session: date, *, is_udiff: bool) -> dict[str, DailyBar]:
        text, member_name = unzip_single_csv(payload, label='NSE bhavcopy')
        if not is_udiff:
            # UDiFF rows carry their own TradDt, checked per-row below; the legacy
            # format's member name is an extra guard specifically for the legacy path
            # (mirrors BSE's legacy check, where it's the *only* guard - see
            # archive_parsing.check_archive_member_name).
            check_archive_member_name(member_name, _expected_legacy_member_name(session), label='NSE bhavcopy legacy')
        fieldnames, rows = read_csv_rows_from_text(text)
        required_columns = _UDIFF_REQUIRED_COLUMNS if is_udiff else _LEGACY_REQUIRED_COLUMNS
        missing_columns = [column for column in required_columns if column not in fieldnames]
        if missing_columns:
            raise ProviderSchemaError(
                f'NSE bhavcopy for {session} is missing required column(s) {missing_columns}'
            )

        bars_by_ticker: dict[str, DailyBar] = {}
        series_by_ticker: dict[str, str] = {}
        invalid_row_count = 0
        for row in rows:
            parsed = _parse_udiff_row(row, session) if is_udiff else _parse_legacy_row(row, session)
            if parsed is ROW_SKIPPED:
                continue
            if parsed is ROW_INVALID:
                invalid_row_count += 1
                continue

            ticker, series, bar = parsed
            existing_series = series_by_ticker.get(ticker)
            if existing_series is not None and SERIES_PRIORITY[existing_series] <= SERIES_PRIORITY[series]:
                continue
            bars_by_ticker[ticker] = bar
            series_by_ticker[ticker] = series

        if invalid_row_count:
            jh.debug(f'NSE bhavcopy {session}: skipped {invalid_row_count} row(s) failing candle validation')

        return bars_by_ticker


def _udiff_url(session: date) -> str:
    return _UDIFF_URL_TEMPLATE.format(yyyymmdd=session.strftime('%Y%m%d'))


def _legacy_url(session: date) -> str:
    month = MONTH_ABBREVIATIONS[session.month - 1]
    return _LEGACY_URL_TEMPLATE.format(year=session.year, month=month, day=session.day)


def _expected_legacy_member_name(session: date) -> str:
    # The legacy zip's one CSV member is named the same as the URL's path component,
    # minus the trailing `.zip` (verified against a real download: cm01JAN2024bhav.csv
    # inside cm01JAN2024bhav.csv.zip).
    month = MONTH_ABBREVIATIONS[session.month - 1]
    return f'cm{session.day:02d}{month}{session.year}bhav.csv'


def _build_catalog_entry(ticker: str, name: str | None, *, kind: str) -> SymbolCatalogEntry | None:
    try:
        symbol = to_jesse_symbol(ticker)
    except HistoricalDataRequestError:
        # e.g. a ticker with two hyphens, or one already containing '_' - `to_jesse_symbol`
        # rejects it as ambiguous. One bad master-file row must not sink the whole catalog.
        return None
    return SymbolCatalogEntry(symbol, name=name, kind=kind, venue='NSE')


def _parse_udiff_row(row: dict[str, str], session: date) -> tuple[str, str, DailyBar] | object:
    values = {column: field(row, column) for column in _UDIFF_REQUIRED_COLUMNS}
    if any(not value for value in values.values()):
        # A truncated/short row is missing data this module needs - a row-scoped
        # problem, not a reason to abort the whole session's file.
        return ROW_INVALID

    row_date = parse_iso_date(values['TradDt'])
    if row_date is None:
        return ROW_INVALID
    check_session_date(row_date, session, label='NSE bhavcopy')

    # Both ETFs and equities trade under FinInstrmTp == 'STK' in the CM segment
    # (see spike-sources.md §8) - the series allowlist below is what actually
    # distinguishes in-scope rows, this just excludes non-cash-market rows.
    if values['Sgmt'] != 'CM' or values['FinInstrmTp'] != 'STK':
        return ROW_SKIPPED
    series = values['SctySrs'].strip().upper()
    if series not in SERIES_PRIORITY:
        return ROW_SKIPPED
    ticker = values['TckrSymb'].strip().upper()
    return build_bar(
        ticker, series, row_date, values['OpnPric'], values['HghPric'], values['LwPric'], values['ClsPric'],
        values['TtlTradgVol'],
    )


def _parse_legacy_row(row: dict[str, str], session: date) -> tuple[str, str, DailyBar] | object:
    values = {column: field(row, column) for column in _LEGACY_REQUIRED_COLUMNS}
    if any(not value for value in values.values()):
        return ROW_INVALID

    row_date = parse_legacy_date(values['TIMESTAMP'])
    if row_date is None:
        return ROW_INVALID
    check_session_date(row_date, session, label='NSE bhavcopy')

    series = values['SERIES'].strip().upper()
    if series not in SERIES_PRIORITY:
        return ROW_SKIPPED
    ticker = values['SYMBOL'].strip().upper()
    return build_bar(ticker, series, row_date, values['OPEN'], values['HIGH'], values['LOW'], values['CLOSE'], values['TOTTRDQTY'])


# Registered as a non-default NSE source: story #6 (nse_composite.py) registers
# NseCompositeSource as NSE's default instead, so a bare `IndiaExchangeProvider('NSE')`
# routes between this and NseIndexSource automatically. This module's own registration
# stays (non-default) so bhavcopy can still be selected explicitly
# (`create_source('NSE', 'nse_bhavcopy')`) when a caller wants stocks/ETFs only.
# Exchange registration into jesse's own info/drivers layer is a separate later story
# (#9), not this one.
register_source(NseBhavcopySource)
