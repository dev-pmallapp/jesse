"""BSE bhavcopy daily-bar source (story #5 in docs/india-markets/PLAN.md).

Implements `ArchiveDailySource` against BSE's two published whole-market
"bhavcopy" formats, both served unauthenticated from `www.bseindia.com` (see
docs/india-markets/spike-sources.md §4 for the verified findings this module
encodes, and this repo's own live smoke check for the confirmations noted
inline below):

- UDiFF (`BhavCopy_BSE_CM_0_0_0_<YYYYMMDD>_F_0000.CSV`): the current format,
  served as plain (non-zipped) CSV. Unlike NSE, a 200 response here can still
  be BSE's Angular SPA shell for an unpublished date rather than real data -
  `IndiaHttpClient`'s soft-404 sniffing (Content-Type/body check) already
  turns that into None for this module, so it is trusted the same way a 404
  would be.
- legacy (`EQ<DDMMYY>_CSV.ZIP`): the older format, a zip holding one CSV.
  Confirmed (smoke check, 2026-09-23) to still soft-404 on/after the UDiFF
  switch date, so - same as NSE's legacy format - only ever tried as a
  fallback strictly before it.

Format-level parsing shared with NSE's UDiFF file (zip unwrapping, None-safe
field access, CSV parsing, CSV-byte decoding, date parsing/validation, the
positive-price rule) lives in `archive_parsing.py`; this module keeps only what
is BSE-specific: URLs, the group allowlist, the legacy zip's expected member
name, the legacy scrip-code-to-ticker map, and the catalog.
"""
import time
from collections.abc import Callable
from datetime import date, datetime, timedelta

import jesse.helpers as jh

from ..contracts import SymbolCatalogEntry
from ..errors import HistoricalDataRequestError, ProviderSchemaError, ProviderUnavailableError
from .archive_parsing import (
    ROW_INVALID,
    ROW_SKIPPED,
    build_bar,
    check_archive_member_name,
    check_session_date,
    decode_csv_bytes,
    field,
    parse_iso_date,
    read_csv_rows_from_text,
    unzip_single_csv,
)
from .archive_cache import ArchiveFileCache
from .http import IndiaHttpClient
from .sessions import IST
from .sources import ArchiveDailySource, DailyBar, register_source
from .symbols import to_jesse_symbol

# Found by bisecting BSE's legacy archive (EQ<DDMMYY>_CSV.ZIP) between 04-Jan-2000
# (soft-404) and 04-Jan-2010 (present), at month granularity: each candidate month was
# checked at its first weekday, and - only when that first check failed - also at the
# next weekday, so a single holiday landing on the 1st of a month couldn't be mistaken
# for "the whole month is unpublished." The bisection (11 real requests) narrowed the
# boundary to "unpublished through Feb-2006, published from Mar-2006" and stopped there
# (a live smoke-check request budget, not exhaustive) - so this date is the first
# session of the first confirmed month, approximate to the month, not a verified exact
# day. BSE's cash-market segment itself is far older than this; this only reflects how
# far back the *digitized legacy archive* goes.
BSE_FIRST_SESSION = date(2006, 3, 1)

# BSE switched its canonical bhavcopy format to UDiFF on this date - verified in the
# live smoke check: legacy EQ010724_CSV.ZIP (01-Jul-2024) still returns real data,
# EQ080724_CSV.ZIP (08-Jul-2024) already soft-404s, and BhavCopy_BSE_CM_0_0_0_
# 20240708_F_0000.CSV returns real UDiFF data - same switch date as NSE's (both
# exchanges moved to the SEBI-mandated UDiFF schema together).
BSE_UDIFF_SWITCH_DATE = date(2024, 7, 8)

# Main-board equity/ETF groups, including trade-for-trade (T, XT) and non-compliant
# (Z) scrips that still trade. SME (M, MT), debt (F), government securities (G) and
# everything else are excluded - out of scope for now, same spirit as NSE's
# SERIES_PRIORITY allowlist in nse_archives.py.
BSE_GROUP_ALLOWLIST = frozenset({'A', 'B', 'T', 'X', 'XT', 'Z'})

# How many calendar days to walk back from "today" (real IST date, or an injected one
# in tests) looking for the most recently published UDiFF file, used both to build the
# legacy scrip-code map and to source the symbol catalog. 10 comfortably spans any
# realistic run of consecutive holidays/weekends without an unbounded retry loop.
_RECENT_UDIFF_LOOKBACK_DAYS = 10

# How long the "most recent UDiFF file" rows (and the scrip-code map derived from them)
# stay cached on a source instance before the next call re-walks the lookback. Both the
# symbol catalog and the code map must eventually pick up new listings/delistings in a
# long-running process (e.g. a live-trading process that never restarts for days) rather
# than being frozen forever at first use - 12h balances that against not re-walking the
# last-10-days lookback on every single legacy-row parse.
_RECENT_UDIFF_CACHE_TTL_SECONDS = 12 * 60 * 60

_UDIFF_URL_TEMPLATE = 'https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_{yyyymmdd}_F_0000.CSV'
_LEGACY_URL_TEMPLATE = 'https://www.bseindia.com/download/BhavCopy/Equity/EQ{ddmmyy}_CSV.ZIP'

# Same UDiFF schema NSE's file uses (see archive_parsing.py's module docstring) -
# duplicated here rather than imported from nse_archives.py so the two exchange
# modules stay independent of each other, only sharing the genuinely format-level
# code in archive_parsing.py.
_UDIFF_REQUIRED_COLUMNS = (
    'TckrSymb', 'SctySrs', 'OpnPric', 'HghPric', 'LwPric', 'ClsPric', 'TtlTradgVol', 'TradDt', 'Sgmt', 'FinInstrmTp',
)
# The legacy file has no ticker/date column at all - only these are actually read.
_LEGACY_REQUIRED_COLUMNS = ('SC_CODE', 'SC_GROUP', 'SC_TYPE', 'OPEN', 'HIGH', 'LOW', 'CLOSE', 'NO_OF_SHRS')

# Distinct from ROW_INVALID/ROW_SKIPPED (archive_parsing.py) so a legacy row dropped
# only because its scrip code isn't in the current-ticker map gets its own jh.debug
# count, separate from rows that fail basic price/volume validation.
_ROW_UNMAPPED_CODE = object()


class BseBhavcopySource(ArchiveDailySource):
    """BSE's free daily whole-market CSV archive (legacy + UDiFF), no auth required."""

    source_id = 'bse_bhavcopy'
    exchange = 'BSE'
    # Same conclusion as NSE (raw/as-traded, not retroactively split/bonus-adjusted) -
    # both exchanges publish the same SEBI-mandated UDiFF schema and neither rewrites
    # historical bhavcopy files after the fact.
    prices_adjusted = False

    def __init__(
        self,
        client: IndiaHttpClient | None = None,
        *,
        today: Callable[[], date] | None = None,
        monotonic: Callable[[], float] | None = None,
        cache: ArchiveFileCache | None = None,
    ) -> None:
        super().__init__(cache=cache)
        self._client = client if client is not None else IndiaHttpClient()
        # Injectable so tests control which UDiFF file the lazy code-map/catalog walk-
        # back starts from, without depending on the real calendar date.
        self._today = today if today is not None else _default_today
        # Injectable so tests control the recent-UDiFF-rows cache's TTL expiry without
        # sleeping for real hours.
        self._monotonic = monotonic if monotonic is not None else time.monotonic
        self._recent_udiff_rows: list[dict[str, str]] | None = None
        # None means "not cached" (either never fetched, or a failed walk-back that was
        # deliberately left uncached - see `_cached_recent_udiff_rows`), not "cached at
        # time zero" - so a fresh instance always fetches on first use.
        self._recent_udiff_cached_at: float | None = None
        self._scrip_code_map_cache: dict[str, str] | None = None

    def fetch_session(self, session: date) -> dict[str, DailyBar] | None:
        if session < BSE_FIRST_SESSION:
            return None

        bars = self._fetch_and_parse(
            _udiff_url(session), kind='udiff', session=session, expect='csv', client=self._client,
            parse=lambda payload: self._parse_udiff_payload(payload, session),
        )
        if bars is not None:
            return bars

        if session < BSE_UDIFF_SWITCH_DATE:
            bars = self._fetch_and_parse(
                _legacy_url(session), kind='legacy', session=session, expect='zip', client=self._client,
                parse=lambda payload: self._parse_legacy_payload(payload, session),
            )
            if bars is not None:
                return bars

        # Neither format published for this date: a holiday, weekend, or a day
        # the archive simply doesn't have - not an error.
        return None

    def list_symbol_entries(self) -> tuple[SymbolCatalogEntry, ...]:
        rows = self._cached_recent_udiff_rows()
        if rows is None:
            # BSE has no separate ETF/equity master reachable without the blocked API
            # (see spike-sources.md §4/§7 for the analogous BSE/niftyindices soft-404
            # pattern) - the catalog has nothing else to fall back to.
            raise ProviderUnavailableError(
                'BSE UDiFF bhavcopy is currently unavailable to build the symbol catalog'
            )

        entries: list[SymbolCatalogEntry] = []
        skipped_ticker_count = 0
        for row in rows:
            # Values read via `field()` are already stripped by `read_csv_rows_from_text`
            # - only `.upper()` (a real normalization, not whitespace cleanup) is needed here.
            if field(row, 'Sgmt') != 'CM' or field(row, 'FinInstrmTp') != 'STK':
                continue
            group = field(row, 'SctySrs').upper()
            if group not in BSE_GROUP_ALLOWLIST:
                continue
            kind = _kind_from_isin(field(row, 'ISIN').upper())
            if kind is None:
                continue
            ticker = field(row, 'TckrSymb').upper()
            entry = _build_catalog_entry(ticker, field(row, 'FinInstrmNm') or None, kind=kind)
            if entry is None:
                skipped_ticker_count += 1
                continue
            entries.append(entry)

        if skipped_ticker_count:
            jh.debug(
                f'BSE symbol catalog: skipped {skipped_ticker_count} ticker(s) that could not be '
                'encoded as a Jesse symbol'
            )

        return tuple(entries)

    def isin_for(self, ticker: str) -> str | None:
        """ISIN for `ticker` from the same "most recent UDiFF file" rows the symbol
        catalog and legacy scrip-code map already cache (`_cached_recent_udiff_rows`) -
        no separate fetch/cache needed. Story #7 uses this for split/bonus adjustment
        (see IndiaDailySource.isin_for). Returns None when that file couldn't be found,
        or `ticker` isn't in it (e.g. long delisted) - never raises.
        """
        rows = self._cached_recent_udiff_rows()
        if rows is None:
            return None
        normalized = ticker.strip().upper()
        for row in rows:
            if field(row, 'Sgmt') != 'CM' or field(row, 'FinInstrmTp') != 'STK':
                continue
            if field(row, 'TckrSymb').upper() == normalized:
                isin = field(row, 'ISIN').strip().upper()
                return isin or None
        return None

    def _parse_udiff_payload(self, payload: bytes, session: date) -> dict[str, DailyBar]:
        text = decode_csv_bytes(payload, label='BSE bhavcopy')
        fieldnames, rows = read_csv_rows_from_text(text)
        missing_columns = [column for column in _UDIFF_REQUIRED_COLUMNS if column not in fieldnames]
        if missing_columns:
            raise ProviderSchemaError(
                f'BSE bhavcopy for {session} is missing required column(s) {missing_columns}'
            )

        bars_by_ticker: dict[str, DailyBar] = {}
        invalid_row_count = 0
        duplicate_ticker_count = 0
        for row in rows:
            parsed = _parse_udiff_row(row, session)
            if parsed is ROW_SKIPPED:
                continue
            if parsed is ROW_INVALID:
                invalid_row_count += 1
                continue
            ticker, _group, bar = parsed
            if ticker in bars_by_ticker:
                # BSE has one group per scrip, so a repeat ticker on the same day is an
                # anomaly (bad data), not a routine cross-series duplicate like NSE's
                # EQ/BE/BZ case - keep the first occurrence, count the rest separately
                # from genuinely invalid (unparseable/non-positive) rows.
                duplicate_ticker_count += 1
                continue
            bars_by_ticker[ticker] = bar

        if invalid_row_count:
            jh.debug(f'BSE bhavcopy {session}: skipped {invalid_row_count} row(s) failing candle validation')
        if duplicate_ticker_count:
            jh.debug(f'BSE bhavcopy {session}: skipped {duplicate_ticker_count} duplicate-ticker row(s)')

        return bars_by_ticker

    def _parse_legacy_payload(self, payload: bytes, session: date) -> dict[str, DailyBar]:
        text, member_name = unzip_single_csv(payload, label='BSE bhavcopy legacy')
        # The legacy file has no date column at all (see `_parse_legacy_row`), so this
        # member-name check is the *only* guard against a wrong-day file having been
        # served under this session's URL.
        check_archive_member_name(member_name, _expected_legacy_member_name(session), label='BSE bhavcopy legacy')
        fieldnames, rows = read_csv_rows_from_text(text)
        missing_columns = [column for column in _LEGACY_REQUIRED_COLUMNS if column not in fieldnames]
        if missing_columns:
            raise ProviderSchemaError(
                f'BSE bhavcopy legacy for {session} is missing required column(s) {missing_columns}'
            )

        code_map = self._scrip_code_map()
        bars_by_ticker: dict[str, DailyBar] = {}
        invalid_row_count = 0
        unmapped_code_count = 0
        duplicate_ticker_count = 0
        for row in rows:
            parsed = _parse_legacy_row(row, session, code_map)
            if parsed is ROW_SKIPPED:
                continue
            if parsed is _ROW_UNMAPPED_CODE:
                unmapped_code_count += 1
                continue
            if parsed is ROW_INVALID:
                invalid_row_count += 1
                continue
            ticker, _code, bar = parsed
            if ticker in bars_by_ticker:
                # Two different (old) scrip codes can map to the same current ticker -
                # e.g. a merger, or two renames that converged - counted separately from
                # invalid/unmapped rows so each failure mode is visible on its own.
                duplicate_ticker_count += 1
                continue
            bars_by_ticker[ticker] = bar

        if invalid_row_count:
            jh.debug(f'BSE bhavcopy legacy {session}: skipped {invalid_row_count} row(s) failing candle validation')
        if unmapped_code_count:
            jh.debug(
                f'BSE bhavcopy legacy {session}: skipped {unmapped_code_count} row(s) whose scrip code is not in '
                'the current UDiFF ticker map (delisted or renamed long ago)'
            )
        if duplicate_ticker_count:
            jh.debug(f'BSE bhavcopy legacy {session}: skipped {duplicate_ticker_count} duplicate-ticker row(s)')

        return bars_by_ticker

    def _scrip_code_map(self) -> dict[str, str]:
        """Lazily build {SC_CODE: current ticker} from the most recent UDiFF file.

        Cached alongside the underlying rows for `_RECENT_UDIFF_CACHE_TTL_SECONDS`, then
        rebuilt from a freshly re-walked file - not built exactly once per instance.

        This maps an old numeric scrip code to whatever ticker currently trades under it -
        so a company that was renamed keeps one continuous history under its current
        symbol, while a scrip that delisted long ago (and so has no recent UDiFF row)
        simply has no map entry and its legacy rows are dropped (see `_ROW_UNMAPPED_CODE`).
        This is a survivorship caveat inherent to keying off "most recent", not a bug:
        Jesse does not attempt point-in-time old-code resolution here.
        """
        rows = self._cached_recent_udiff_rows()
        if rows is None:
            # No recent UDiFF file was found within the lookback - return an uncached
            # empty map rather than `self._scrip_code_map_cache = {}`, so the next call
            # retries the walk-back instead of permanently assuming there is no map.
            return {}
        if self._scrip_code_map_cache is None:
            mapping: dict[str, str] = {}
            for row in rows:
                if field(row, 'Sgmt') != 'CM' or field(row, 'FinInstrmTp') != 'STK':
                    continue
                # In BSE's UDiFF file FinInstrmId is the same numeric scrip code the
                # legacy format's SC_CODE column uses (verified against the fixtures:
                # RELIANCE is 500325 in both). Values are already stripped by
                # `read_csv_rows_from_text`.
                code = field(row, 'FinInstrmId')
                ticker = field(row, 'TckrSymb').upper()
                if code and ticker:
                    mapping.setdefault(code, ticker)
            self._scrip_code_map_cache = mapping
        return self._scrip_code_map_cache

    def _cached_recent_udiff_rows(self) -> list[dict[str, str]] | None:
        now = self._monotonic()
        if (
            self._recent_udiff_rows is not None
            and self._recent_udiff_cached_at is not None
            and now - self._recent_udiff_cached_at < _RECENT_UDIFF_CACHE_TTL_SECONDS
        ):
            return self._recent_udiff_rows

        rows = self._fetch_recent_udiff_rows()
        if rows is None:
            # Never cache a failed walk-back (e.g. a transient outage, or 10 unusually
            # quiet days) - leaving both this cache and the derived code-map cache unset
            # means the very next call retries from scratch instead of remembering
            # "nothing published recently" forever.
            self._recent_udiff_rows = None
            self._recent_udiff_cached_at = None
            self._scrip_code_map_cache = None
            return None

        self._recent_udiff_rows = rows
        self._recent_udiff_cached_at = now
        # Invalidate the derived code map so it is rebuilt from these fresh rows on next
        # use - it is rebuilt lazily in `_scrip_code_map`, not eagerly here.
        self._scrip_code_map_cache = None
        return rows

    def _fetch_recent_udiff_rows(self) -> list[dict[str, str]] | None:
        current = self._today()
        for _ in range(_RECENT_UDIFF_LOOKBACK_DAYS):
            payload = self._client.get(_udiff_url(current), expect='csv')
            if payload is not None:
                text = decode_csv_bytes(payload, label='BSE bhavcopy')
                _fieldnames, rows = read_csv_rows_from_text(text)
                return rows
            current -= timedelta(days=1)
        return None


def _udiff_url(session: date) -> str:
    return _UDIFF_URL_TEMPLATE.format(yyyymmdd=session.strftime('%Y%m%d'))


def _legacy_url(session: date) -> str:
    return _LEGACY_URL_TEMPLATE.format(ddmmyy=session.strftime('%d%m%y'))


def _expected_legacy_member_name(session: date) -> str:
    # The legacy zip's one CSV member is named the same as the URL's path component,
    # minus the trailing `_CSV.ZIP`, plus `.CSV` (verified against a real download:
    # EQ010124.CSV inside EQ010124_CSV.ZIP for session 2024-01-01).
    return f'EQ{session.strftime("%d%m%y")}.CSV'


def _kind_from_isin(isin: str) -> str | None:
    # ISIN prefix identifies the issuing entity type (SEBI/ISIN-agency convention):
    # 'INF' is used for mutual-fund/ETF units, 'INE' for ordinary equity. BSE's UDiFF
    # file has no separate instrument-type field for cash-market rows, so this prefix
    # is the only signal available to distinguish an ETF from a stock. Any other
    # prefix (rare in the CM/STK rows already filtered above) is skipped rather than
    # guessed at.
    if isin.startswith('INF'):
        return 'ETF'
    if isin.startswith('INE'):
        return 'Stock'
    return None


def _build_catalog_entry(ticker: str, name: str | None, *, kind: str) -> SymbolCatalogEntry | None:
    try:
        symbol = to_jesse_symbol(ticker)
    except HistoricalDataRequestError:
        # e.g. a ticker with two hyphens, or one already containing '_' - `to_jesse_symbol`
        # rejects it as ambiguous. One bad row must not sink the whole catalog.
        return None
    return SymbolCatalogEntry(symbol, name=name, kind=kind, venue='BSE')


def _parse_udiff_row(row: dict[str, str], session: date) -> tuple[str, str, DailyBar] | object:
    values = {column: field(row, column) for column in _UDIFF_REQUIRED_COLUMNS}
    if any(not value for value in values.values()):
        # A truncated/short row is missing data this module needs - a row-scoped
        # problem, not a reason to abort the whole session's file.
        return ROW_INVALID

    row_date = parse_iso_date(values['TradDt'])
    if row_date is None:
        return ROW_INVALID
    check_session_date(row_date, session, label='BSE bhavcopy')

    if values['Sgmt'] != 'CM' or values['FinInstrmTp'] != 'STK':
        return ROW_SKIPPED
    # Values are already stripped by `read_csv_rows_from_text` - only `.upper()` is a
    # real normalization here.
    group = values['SctySrs'].upper()
    if group not in BSE_GROUP_ALLOWLIST:
        return ROW_SKIPPED
    ticker = values['TckrSymb'].upper()
    return build_bar(
        ticker, group, row_date, values['OpnPric'], values['HghPric'], values['LwPric'], values['ClsPric'],
        values['TtlTradgVol'],
    )


def _parse_legacy_row(row: dict[str, str], session: date, code_map: dict[str, str]) -> tuple[str, str, DailyBar] | object:
    values = {column: field(row, column) for column in _LEGACY_REQUIRED_COLUMNS}
    if any(not value for value in values.values()):
        return ROW_INVALID

    # No per-row date check here (unlike UDiFF): the legacy file has no date column at
    # all, so `session` - the date the caller requested this file for - is the only
    # date available and is trusted directly (the archive member-name check above already
    # guards against the file itself being for the wrong day).
    # Values are already stripped by `read_csv_rows_from_text` - only `.upper()` is a
    # real normalization here.
    sc_type = values['SC_TYPE'].upper()
    if sc_type != 'Q':
        return ROW_SKIPPED
    group = values['SC_GROUP'].upper()
    if group not in BSE_GROUP_ALLOWLIST:
        return ROW_SKIPPED

    code = values['SC_CODE']
    ticker = code_map.get(code)
    if ticker is None:
        return _ROW_UNMAPPED_CODE
    return build_bar(ticker, group, session, values['OPEN'], values['HIGH'], values['LOW'], values['CLOSE'], values['NO_OF_SHRS'])


def _default_today() -> date:
    return datetime.now(IST).date()


# Registered as the default BSE source as soon as this module is imported -
# `jesse/services/historical_data/india/__init__.py` imports this module for that side
# effect, so `IndiaExchangeProvider('BSE')` works with no explicit source argument.
# Exchange registration into jesse's own info/drivers layer is a separate later story
# (#9), not this one.
register_source(BseBhavcopySource, default=True)
