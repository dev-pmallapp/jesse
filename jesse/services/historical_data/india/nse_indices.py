"""NSE index-level daily-bar source (story #6 in docs/india-markets/PLAN.md).

Implements `ArchiveDailySource` against NSE's daily whole-market index-close file,
served unauthenticated from `nsearchives.nseindia.com` (see
docs/india-markets/spike-sources.md §6/§7 for the verified findings, and this repo's
own live smoke check for the confirmations noted inline below):

- `ind_close_all_<DDMMYYYY>.csv`: one row per index (108-166+ index names observed),
  plain (non-zipped) CSV, full daily OHLCV per index - unlike bhavcopy, this is not a
  "current format vs legacy format" split; NSE has published this one file shape for as
  far back as this module looks.

Two problems are specific to this file and handled only here (not in
archive_parsing.py, which stays format-level/shared):

- **Naming (D2):** an index's *name* changes over time (NSE dropped "CNX" branding
  around 2015-2016: `CNX Nifty` -> `Nifty 50`), and is inconsistently cased even within
  one file (`NIFTY100 Alpha 30` vs `Nifty200 Alpha 30`). `_INDEX_NAME_RENAMES` maps
  historical names to current ones; `_derive_ticker` then derives a stable ticker from
  the canonical name, case-insensitively, TradingView-style.
- **Sparse OHLC:** some smart-beta indices report `-` for Open/High/Low on some
  sessions (only Closing Index Value is populated) - handled by falling back to the
  close for all three, not by treating `-` as zero (see `_parse_index_row`).
"""
import re
import time
from collections.abc import Callable
from datetime import date, datetime, timedelta

import jesse.helpers as jh

from ..contracts import SymbolCatalogEntry
from ..errors import HistoricalDataRequestError, ProviderSchemaError, ProviderUnavailableError
from .archive_parsing import ROW_INVALID, build_bar, check_session_date, decode_csv_bytes, field, read_csv_rows_from_text
from .archive_cache import ArchiveFileCache
from .http import IndiaHttpClient
from .sessions import IST
from .sources import ArchiveDailySource, DailyBar, register_source
from .symbols import to_jesse_symbol

# Bisected (live smoke check, 2026-09-23) between 2010-01-04 (soft-404/404) and
# 2015-01-05 (present) at MONTH granularity: each candidate month was checked at its
# first weekday, and - only when that first check failed - also confirmed at the next
# weekday, so a single holiday landing on the 1st of a month couldn't be mistaken for
# "the whole month is unpublished." That narrowed the boundary to "unpublished through
# Feb-2012, published from Mar-2012" (13 real requests) and stopped there - so this is
# the first session of the first confirmed month, approximate to the month, not a
# verified exact day (same precision/method as BSE_FIRST_SESSION in bse_archives.py).
NSE_INDEX_FIRST_SESSION = date(2012, 3, 1)

# Historical index name -> current canonical name, matched case-insensitively (keys are
# upper-cased). Built from the live smoke check comparing the 05-Jan-2015 file against
# 03-Jan-2017 and 02-Jan-2019 files: NSE dropped "CNX" branding across the index family
# around 2015-2016, replacing "CNX <suffix>" with "Nifty <suffix>" for most sector/
# thematic indices, plus two special-named flagship renames. Only pairs with an exact
# suffix match (or well-known public renames) are included - kept small and explicit
# rather than guessing at every CNX-era name (e.g. "CNX Midcap"/"CNX Finance" have no
# single obvious current-day successor in the observed data and are deliberately left
# out).
_INDEX_NAME_RENAMES = {
    'CNX NIFTY': 'Nifty 50',
    'CNX NIFTY JUNIOR': 'Nifty Next 50',
    'CNX 100': 'Nifty 100',
    'CNX 200': 'Nifty 200',
    'CNX 500': 'Nifty 500',
    'CNX AUTO': 'Nifty Auto',
    'CNX BANK': 'Nifty Bank',
    'CNX COMMODITIES': 'Nifty Commodities',
    'CNX ENERGY': 'Nifty Energy',
    'CNX FMCG': 'Nifty FMCG',
    'CNX IT': 'Nifty IT',
    'CNX INFRASTRUCTURE': 'Nifty Infrastructure',
    'CNX MNC': 'Nifty MNC',
    'CNX MEDIA': 'Nifty Media',
    'CNX METAL': 'Nifty Metal',
    'CNX PSE': 'Nifty PSE',
    'CNX PSU BANK': 'Nifty PSU Bank',
    'CNX PHARMA': 'Nifty Pharma',
    'CNX REALTY': 'Nifty Realty',
}

# TradingView's actual tickers for the two headline indices - not what the mechanical
# "strip non-alnum" derivation below would produce ("NIFTY50", "NIFTYBANK"). Keyed by
# canonical name, upper-cased.
_TICKER_OVERRIDES = {
    'NIFTY 50': 'NIFTY',
    'NIFTY BANK': 'BANKNIFTY',
}

# Everything but A-Z/0-9 is dropped when deriving a ticker from a canonical name (after
# upper-casing) - e.g. "Nifty200 Alpha 30" -> "NIFTY200ALPHA30". This also absorbs
# NSE's inconsistent spacing/casing between otherwise-identical index names.
_TICKER_STRIP_RE = re.compile(r'[^A-Z0-9]')

_INDEX_URL_TEMPLATE = 'https://nsearchives.nseindia.com/content/indices/ind_close_all_{ddmmyyyy}.csv'

_REQUIRED_COLUMNS = (
    'Index Name', 'Index Date', 'Open Index Value', 'High Index Value', 'Low Index Value', 'Closing Index Value',
    'Volume',
)

# How many calendar days to walk back from "today" (real IST date, or an injected one in
# tests) looking for the most recently published index file, used to source the symbol
# catalog - same rationale/value as BSE's _RECENT_UDIFF_LOOKBACK_DAYS (bse_archives.py):
# comfortably spans any realistic run of consecutive holidays/weekends.
_RECENT_INDEX_LOOKBACK_DAYS = 10

# How long the "most recent index file" rows stay cached on a source instance before the
# next call re-walks the lookback - same value/rationale as BSE's
# _RECENT_UDIFF_CACHE_TTL_SECONDS: long enough to not re-walk on every catalog call, short
# enough that a long-running process eventually picks up newly-listed indices.
_RECENT_INDEX_CACHE_TTL_SECONDS = 12 * 60 * 60


class NseIndexSource(ArchiveDailySource):
    """NSE's free daily whole-market index-close CSV, no auth required."""

    source_id = 'nse_indices'
    exchange = 'NSE'
    # Index levels are NSE's own computed series, never adjusted for constituent
    # corporate actions after the fact (a constituent's split/bonus already flows
    # through the index via its float-adjusted weight, not via rewriting past index
    # levels) - so, same as bhavcopy, nothing here is retroactively adjusted. This is
    # also why #7 (split/bonus adjustment) must leave index symbols alone entirely:
    # applying a *constituent's* corporate action to an *index's* own price series would
    # be a category error, not a refinement.
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
        # Injectable so tests control which index file the lazy catalog walk-back starts
        # from, without depending on the real calendar date (mirrors BseBhavcopySource).
        self._today = today if today is not None else _default_today
        # Injectable so tests control the recent-rows cache's TTL expiry without
        # sleeping for real hours (mirrors BseBhavcopySource).
        self._monotonic = monotonic if monotonic is not None else time.monotonic
        self._recent_rows: list[dict[str, str]] | None = None
        # None means "not cached" (either never fetched, or a failed walk-back that was
        # deliberately left uncached - see `_cached_recent_rows`), not "cached at time
        # zero" - so a fresh instance always fetches on first use.
        self._recent_rows_cached_at: float | None = None

    def fetch_session(self, session: date) -> dict[str, DailyBar] | None:
        if session < NSE_INDEX_FIRST_SESSION:
            return None

        # A holiday, weekend, or a day the archive simply doesn't have - not an error.
        return self._fetch_and_parse(
            _index_url(session), kind='index', session=session, expect='csv', client=self._client,
            parse=lambda payload: self._parse_index_csv(payload, session),
        )

    def list_symbol_entries(self) -> tuple[SymbolCatalogEntry, ...]:
        rows = self._cached_recent_rows()
        if rows is None:
            raise ProviderUnavailableError(
                'NSE index file is currently unavailable to build the symbol catalog'
            )

        entries: list[SymbolCatalogEntry] = []
        seen_tickers: set[str] = set()
        skipped_ticker_count = 0
        for row in rows:
            raw_name = field(row, 'Index Name').strip()
            if not raw_name:
                continue
            canonical_name = _canonical_name(raw_name)
            ticker = _derive_ticker(canonical_name)
            if not ticker or ticker in seen_tickers:
                # Empty ticker (a name with no A-Z/0-9 characters at all) or a repeat
                # within this one file - neither is worth failing the whole catalog for.
                skipped_ticker_count += 1
                continue
            entry = _build_catalog_entry(ticker, canonical_name)
            if entry is None:
                skipped_ticker_count += 1
                continue
            seen_tickers.add(ticker)
            entries.append(entry)

        if skipped_ticker_count:
            jh.debug(
                f'NSE index symbol catalog: skipped {skipped_ticker_count} entr(y/ies) that could not be '
                'encoded as a Jesse symbol'
            )

        return tuple(entries)

    def known_index_tickers(self) -> tuple[frozenset[str], bool]:
        """Derived tickers of every index in the cached catalog, plus the static
        overrides, and whether the catalog itself actually loaded this call (vs.
        falling back to just the overrides after an exhausted walk-back).

        Used by NseCompositeSource (nse_composite.py) for two different things: the
        ticker set for routing/classification (without walking the whole catalog on
        every lookup, thanks to `list_symbol_entries`'s own TTL cache), and the `loaded`
        flag to tell "confidently not a known index ticker" apart from "the catalog
        couldn't be reached, so this is only a partial (overrides-only) answer" - the
        difference between routing a miss to bhavcopy vs. raising
        ProviderUnavailableError (see NseCompositeSource._classify).
        """
        try:
            entries = self.list_symbol_entries()
            loaded = True
        except ProviderUnavailableError:
            entries = ()
            loaded = False
        tickers = {entry.symbol.removesuffix('-INR') for entry in entries}
        tickers.update(_TICKER_OVERRIDES.values())
        return frozenset(tickers), loaded

    def is_index(self, ticker: str) -> bool:
        tickers, _loaded = self.known_index_tickers()
        return ticker.upper() in tickers

    def _parse_index_csv(self, payload: bytes, session: date) -> dict[str, DailyBar]:
        text = decode_csv_bytes(payload, label='NSE index file')
        fieldnames, rows = read_csv_rows_from_text(text)
        missing_columns = [column for column in _REQUIRED_COLUMNS if column not in fieldnames]
        if missing_columns:
            raise ProviderSchemaError(
                f'NSE index file for {session} is missing required column(s) {missing_columns}'
            )

        bars_by_ticker: dict[str, DailyBar] = {}
        # Tracks which canonical name currently owns each derived ticker, so two
        # DIFFERENT canonical names deriving the same ticker within this one file is
        # caught (a naming-table bug or an unresolved NSE naming collision), rather than
        # silently overwriting one index's bar with another's.
        name_by_ticker: dict[str, str] = {}
        invalid_row_count = 0
        close_only_count = 0
        duplicate_ticker_count = 0
        for row in rows:
            parsed = _parse_index_row(row, session)
            if parsed is ROW_INVALID:
                invalid_row_count += 1
                continue
            canonical_name, ticker, bar, close_only = parsed

            existing_name = name_by_ticker.get(ticker)
            if existing_name is not None and existing_name != canonical_name:
                raise ProviderSchemaError(
                    f'NSE index file for {session}: index names {existing_name!r} and {canonical_name!r} both '
                    f'derive ticker {ticker!r}'
                )
            if ticker in bars_by_ticker:
                # Same canonical name appearing twice in one file - an NSE data anomaly,
                # not the naming-collision case above; keep the first occurrence.
                duplicate_ticker_count += 1
                continue

            name_by_ticker[ticker] = canonical_name
            bars_by_ticker[ticker] = bar
            if close_only:
                close_only_count += 1

        if invalid_row_count:
            jh.debug(f'NSE index file {session}: skipped {invalid_row_count} row(s) failing candle validation')
        if close_only_count:
            jh.debug(
                f'NSE index file {session}: {close_only_count} row(s) had no Open/High/Low (smart-beta indices '
                'sometimes report only a close) - used the close for O/H/L on those rows'
            )
        if duplicate_ticker_count:
            jh.debug(f'NSE index file {session}: skipped {duplicate_ticker_count} duplicate-ticker row(s)')

        return bars_by_ticker

    def _cached_recent_rows(self) -> list[dict[str, str]] | None:
        now = self._monotonic()
        if (
            self._recent_rows is not None
            and self._recent_rows_cached_at is not None
            and now - self._recent_rows_cached_at < _RECENT_INDEX_CACHE_TTL_SECONDS
        ):
            return self._recent_rows

        rows = self._fetch_recent_rows()
        if rows is None:
            # Never cache a failed walk-back (e.g. a transient outage, or 10 unusually
            # quiet days) - leaving this cache unset means the very next call retries
            # from scratch instead of remembering "nothing published recently" forever.
            self._recent_rows = None
            self._recent_rows_cached_at = None
            return None

        self._recent_rows = rows
        self._recent_rows_cached_at = now
        return rows

    def _fetch_recent_rows(self) -> list[dict[str, str]] | None:
        current = self._today()
        for _ in range(_RECENT_INDEX_LOOKBACK_DAYS):
            payload = self._client.get(_index_url(current), expect='csv')
            if payload is not None:
                text = decode_csv_bytes(payload, label='NSE index file')
                _fieldnames, rows = read_csv_rows_from_text(text)
                return rows
            current -= timedelta(days=1)
        return None


def _index_url(session: date) -> str:
    return _INDEX_URL_TEMPLATE.format(ddmmyyyy=session.strftime('%d%m%Y'))


def _parse_ddmmyyyy_date(value: str) -> date | None:
    """Parse the index file's `Index Date` column (`DD-MM-YYYY`) - distinct from both
    bhavcopy's legacy `DD-MON-YYYY` and UDiFF's ISO `YYYY-MM-DD` (archive_parsing.py), so
    it is not shared there.
    """
    parts = value.strip().split('-')
    if len(parts) != 3:
        return None
    day_str, month_str, year_str = parts
    try:
        return date(int(year_str), int(month_str), int(day_str))
    except ValueError:
        return None


def _canonical_name(raw_name: str) -> str:
    return _INDEX_NAME_RENAMES.get(raw_name.strip().upper(), raw_name.strip())


def _derive_ticker(canonical_name: str) -> str:
    key = canonical_name.strip().upper()
    override = _TICKER_OVERRIDES.get(key)
    if override is not None:
        return override
    return _TICKER_STRIP_RE.sub('', key)


def _build_catalog_entry(ticker: str, canonical_name: str) -> SymbolCatalogEntry | None:
    try:
        symbol = to_jesse_symbol(ticker)
    except HistoricalDataRequestError:
        # A derived ticker is always alnum-only (no '-', '_', or whitespace), so this
        # only fires for the degenerate empty-ticker case already filtered by the caller
        # - kept as a belt-and-suspenders guard, same defensive pattern as the NSE/BSE
        # bhavcopy catalogs.
        return None
    return SymbolCatalogEntry(symbol, name=canonical_name, kind='Index', venue='NSE')


def _parse_index_row(row: dict[str, str], session: date) -> tuple[str, str, DailyBar, bool] | object:
    raw_name = field(row, 'Index Name').strip()
    raw_date = field(row, 'Index Date').strip()
    if not raw_name or not raw_date:
        return ROW_INVALID

    row_date = _parse_ddmmyyyy_date(raw_date)
    if row_date is None:
        return ROW_INVALID
    check_session_date(row_date, session, label='NSE index file')

    close_str = field(row, 'Closing Index Value').strip()
    if not close_str or close_str == '-':
        # A missing close means the row can't become a bar at all - unlike a missing
        # O/H/L (see below), there is nothing to fall back to.
        return ROW_INVALID

    open_str = field(row, 'Open Index Value').strip()
    high_str = field(row, 'High Index Value').strip()
    low_str = field(row, 'Low Index Value').strip()
    close_only = False
    if open_str in ('', '-') or high_str in ('', '-') or low_str in ('', '-'):
        # NSE's smart-beta indices (e.g. NIFTY100 Alpha 30) sometimes publish only a
        # closing level for a session - treated as a flat bar (O=H=L=C) rather than
        # skipping the row entirely, since the close is still a real, usable price.
        open_str = high_str = low_str = close_str
        close_only = True

    volume_str = field(row, 'Volume').strip()
    try:
        float(volume_str)
    except (TypeError, ValueError):
        # Unlike stocks, an index has no literal traded volume of its own (NSE's Volume
        # column here is the *underlying constituents'* combined volume, sometimes blank)
        # - default to 0 rather than invalidating an otherwise-good OHLC row.
        volume_str = '0'

    canonical_name = _canonical_name(raw_name)
    ticker = _derive_ticker(canonical_name)
    if not ticker:
        return ROW_INVALID

    result = build_bar(
        ticker, '', row_date, open_str, high_str, low_str, close_str, volume_str, require_positive_volume=False,
    )
    if result is ROW_INVALID:
        return ROW_INVALID
    _ticker, _series, bar = result
    return canonical_name, ticker, bar, close_only


def _default_today() -> date:
    return datetime.now(IST).date()


# Registered as a non-default NSE source (NseCompositeSource, nse_composite.py, is the
# default) - kept registered under its own source_id so it can still be selected
# explicitly (`create_source('NSE', 'nse_indices')`), same pattern used to demote
# NseBhavcopySource to non-default in nse_archives.py.
register_source(NseIndexSource)
