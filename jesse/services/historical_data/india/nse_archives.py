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
"""
import csv
import io
import zipfile
import zlib
from datetime import date

import jesse.helpers as jh

from ..contracts import HistoricalCandle, SymbolCatalogEntry
from ..errors import (
    HistoricalCandleValidationError,
    HistoricalDataRequestError,
    ProviderSchemaError,
    ProviderUnavailableError,
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

# 3-letter uppercase English month abbreviations used by the legacy archive's
# URL path. Built explicitly (never via a locale-dependent strftime('%b'))
# so the URL is identical regardless of the running process's locale.
_MONTH_ABBREVIATIONS = (
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
)

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

# Sentinels distinguishing a routinely-excluded row (out-of-scope series/segment,
# no trades) from one that actively fails validation - only the latter is worth
# counting and reporting, per session, via jh.debug.
_ROW_SKIPPED = object()
_ROW_INVALID = object()


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
            ticker = _field(row, 'Symbol').strip().upper()
            if not ticker:
                continue
            # Recorded even if the ticker later fails to encode below, so an
            # unencodable ETF ticker still excludes itself from the Stock pass.
            etf_tickers.add(ticker)
            entry = _build_catalog_entry(ticker, _field(row, 'SecurityName').strip() or None, kind='ETF')
            if entry is None:
                skipped_ticker_count += 1
                continue
            entries.append(entry)

        equity_rows = self._fetch_master_rows(_EQUITY_MASTER_URL)
        for row in equity_rows:
            ticker = _field(row, 'SYMBOL').strip().upper()
            # A ticker listed in both files is an ETF - EQUITY_L.csv is meant to
            # be the operating-company universe only, but nothing on the NSE
            # side guarantees the two master files are actually disjoint.
            if not ticker or ticker in etf_tickers:
                continue
            series = _field(row, 'SERIES').strip().upper()
            if series not in SERIES_PRIORITY:
                continue
            entry = _build_catalog_entry(ticker, _field(row, 'NAME OF COMPANY').strip() or None, kind='Stock')
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
        return _read_csv_rows(payload)

    def _parse_archive(self, payload: bytes, session: date, *, is_udiff: bool) -> dict[str, DailyBar]:
        text = _unzip_single_csv(payload)
        fieldnames, rows = _read_csv_rows_from_text(text)
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
            if parsed is _ROW_SKIPPED:
                continue
            if parsed is _ROW_INVALID:
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
    month = _MONTH_ABBREVIATIONS[session.month - 1]
    return _LEGACY_URL_TEMPLATE.format(year=session.year, month=month, day=session.day)


def _unzip_single_csv(payload: bytes) -> str:
    try:
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            # Directory entries (e.g. a `folder/` member some zip writers emit) never
            # hold data - only count actual files when checking for exactly one CSV.
            names = [info.filename for info in archive.infolist() if not info.is_dir()]
            if len(names) != 1:
                raise ProviderSchemaError(
                    f'Expected exactly one file inside the NSE bhavcopy archive, found {len(names)}'
                )
            content = archive.read(names[0])
    except (zipfile.BadZipFile, zlib.error, EOFError) as exc:
        # A corrupted download (truncated transfer, bit flip, etc.) - not a bug in this
        # module and not worth a raw zipfile/zlib traceback reaching the caller.
        raise ProviderSchemaError('NSE bhavcopy archive is corrupted or not a valid zip file') from exc

    try:
        # utf-8-sig strips a BOM if NSE ever adds one; plain ASCII/UTF-8 files decode unaffected.
        return content.decode('utf-8-sig')
    except UnicodeDecodeError as exc:
        raise ProviderSchemaError('NSE bhavcopy archive is not valid UTF-8 text') from exc


def _read_csv_rows(payload: bytes) -> list[dict[str, str]]:
    _fieldnames, rows = _read_csv_rows_from_text(payload.decode('utf-8-sig'))
    return rows


def _read_csv_rows_from_text(text: str) -> tuple[list[str], list[dict[str, str]]]:
    reader = csv.DictReader(io.StringIO(text))
    fieldnames = reader.fieldnames
    if fieldnames is None:
        return [], []
    # NSE headers may carry surrounding whitespace (e.g. EQUITY_L.csv's
    # "SYMBOL,NAME OF COMPANY, SERIES, ...") and the legacy bhavcopy has a
    # trailing empty column from its trailing comma; strip names by identity
    # rather than by position so lookups below are by header name.
    stripped_fieldnames = [name.strip() for name in fieldnames]
    reader.fieldnames = stripped_fieldnames
    rows = []
    for raw_row in reader:
        # A short row (fewer fields than the header) is filled out by DictReader with
        # None for its missing trailing columns - left as None here (not `.strip()`ed)
        # so `_field()` is the single place that normalizes that into ''.
        rows.append(
            {key: (value.strip() if isinstance(value, str) else value) for key, value in raw_row.items() if key}
        )
    return stripped_fieldnames, rows


def _field(row: dict[str, str | None], key: str) -> str:
    """Read one CSV field as a string, treating a short row's missing value as ''.

    `csv.DictReader` fills a row that has fewer columns than the header with None for
    the missing trailing ones; calling `.strip()` directly on that None is what used to
    raise AttributeError here. Every row field must be read through this helper instead
    of `row[key]`/`row.get(key, '')` (whose default only applies when the key itself is
    absent, not when its value is None).
    """
    value = row.get(key)
    return value if value is not None else ''


def _build_catalog_entry(ticker: str, name: str | None, *, kind: str) -> SymbolCatalogEntry | None:
    try:
        symbol = to_jesse_symbol(ticker)
    except HistoricalDataRequestError:
        # e.g. a ticker with two hyphens, or one already containing '_' - `to_jesse_symbol`
        # rejects it as ambiguous. One bad master-file row must not sink the whole catalog.
        return None
    return SymbolCatalogEntry(symbol, name=name, kind=kind, venue='NSE')


def _parse_udiff_row(row: dict[str, str], session: date) -> tuple[str, str, DailyBar] | object:
    values = {column: _field(row, column) for column in _UDIFF_REQUIRED_COLUMNS}
    if any(not value for value in values.values()):
        # A truncated/short row is missing data this module needs - a row-scoped
        # problem, not a reason to abort the whole session's file.
        return _ROW_INVALID

    row_date = _parse_iso_date(values['TradDt'])
    if row_date is None:
        return _ROW_INVALID
    _check_session_date(row_date, session)

    # Both ETFs and equities trade under FinInstrmTp == 'STK' in the CM segment
    # (see spike-sources.md §8) - the series allowlist below is what actually
    # distinguishes in-scope rows, this just excludes non-cash-market rows.
    if values['Sgmt'] != 'CM' or values['FinInstrmTp'] != 'STK':
        return _ROW_SKIPPED
    series = values['SctySrs'].strip().upper()
    if series not in SERIES_PRIORITY:
        return _ROW_SKIPPED
    ticker = values['TckrSymb'].strip().upper()
    return _build_bar(
        ticker, series, row_date, values['OpnPric'], values['HghPric'], values['LwPric'], values['ClsPric'],
        values['TtlTradgVol'],
    )


def _parse_legacy_row(row: dict[str, str], session: date) -> tuple[str, str, DailyBar] | object:
    values = {column: _field(row, column) for column in _LEGACY_REQUIRED_COLUMNS}
    if any(not value for value in values.values()):
        return _ROW_INVALID

    row_date = _parse_legacy_date(values['TIMESTAMP'])
    if row_date is None:
        return _ROW_INVALID
    _check_session_date(row_date, session)

    series = values['SERIES'].strip().upper()
    if series not in SERIES_PRIORITY:
        return _ROW_SKIPPED
    ticker = values['SYMBOL'].strip().upper()
    return _build_bar(ticker, series, row_date, values['OPEN'], values['HIGH'], values['LOW'], values['CLOSE'], values['TOTTRDQTY'])


def _build_bar(
    ticker: str, series: str, row_date: date, open_str: str, high_str: str, low_str: str, close_str: str, volume_str: str,
) -> tuple[str, str, DailyBar] | object:
    try:
        open_price, high_price, low_price, close_price, volume = (
            float(open_str), float(high_str), float(low_str), float(close_str), float(volume_str),
        )
    except (TypeError, ValueError):
        # An unparseable number is the same failure mode as failing HistoricalCandle
        # validation below (a row that cannot become a valid bar) - count it the same way.
        return _ROW_INVALID
    if open_price <= 0 or high_price <= 0 or low_price <= 0 or close_price <= 0:
        # A zero or negative price is never a real traded price, and it would poison
        # indicators and returns computed off it downstream. HistoricalCandle's own
        # validation doesn't check this (only finiteness/OHLC ordering), so it's
        # enforced explicitly here rather than assumed.
        return _ROW_INVALID
    if volume <= 0:
        # No trades that day for this ticker means no bar, not a zero-volume bar -
        # routine and not worth counting alongside genuinely invalid rows.
        return _ROW_SKIPPED
    try:
        # HistoricalCandle's own validation (finite numbers, OHLC ordering, etc.) is the
        # single source of truth for what a valid bar looks like; reuse it here instead
        # of duplicating those rules, and skip just this row - rather than aborting the
        # whole session - when it fails.
        HistoricalCandle(
            timestamp=0, open=open_price, high=high_price, low=low_price, close=close_price, volume=volume,
        )
    except HistoricalCandleValidationError:
        return _ROW_INVALID
    return ticker, series, DailyBar(row_date, open_price, high_price, low_price, close_price, volume)


def _parse_iso_date(value: str) -> date | None:
    try:
        return date.fromisoformat(value.strip())
    except ValueError:
        # Empty or malformed - a row-scoped problem (counted as invalid by the caller),
        # not the file-wide "NSE served the wrong day" problem `_check_session_date` guards.
        return None


def _parse_legacy_date(value: str) -> date | None:
    parts = value.strip().split('-')
    if len(parts) != 3:
        return None
    day_str, month_str, year_str = parts
    month_str = month_str.strip().upper()
    if month_str not in _MONTH_ABBREVIATIONS:
        return None
    try:
        return date(int(year_str), _MONTH_ABBREVIATIONS.index(month_str) + 1, int(day_str))
    except ValueError:
        return None


def _check_session_date(row_date: date, session: date) -> None:
    # Guards against NSE serving the wrong day's file under a requested URL -
    # every row in the file must carry the same session date we asked for. Only
    # reached once a row's date has actually parsed, so this is strictly about a
    # parseable-but-wrong date, not an empty/malformed one (see `_parse_iso_date`/
    # `_parse_legacy_date`).
    if row_date != session:
        raise ProviderSchemaError(
            f'NSE bhavcopy row date {row_date} does not match the requested session {session}'
        )


# Registered as the default NSE source as soon as this module is imported -
# `jesse/services/historical_data/india/__init__.py` imports this module for
# that side effect, so `IndiaExchangeProvider('NSE')` works with no explicit
# source argument. Exchange registration into jesse's own info/drivers layer
# is a separate later story (#9), not this one.
register_source(NseBhavcopySource, default=True)
