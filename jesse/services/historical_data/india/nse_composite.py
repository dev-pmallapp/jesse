"""NSE composite daily-bar source (story #6 in docs/india-markets/PLAN.md).

NSE indices and NSE stocks/ETFs are two separate free-archive files
(`nse_indices.py`/`nse_archives.py`), but they share one exchange in Jesse's routing
(`NSE:NIFTY`, `NSE:RELIANCE`) - a user picking "NSE" as their data source should not
need to know which underlying file a given ticker happens to live in.
`NseCompositeSource` is that single entry point: it holds one `NseBhavcopySource` and
one `NseIndexSource` and routes each call to whichever (or both) is appropriate.

`_classify` (below) is the ONE place that decides "security or index" for a ticker -
`fetch_daily_bars`, `list_symbol_entries` and `is_index` all go through it, so a
ticker's catalog `kind` and its actual routing can never disagree.

Registered as NSE's *default* source (below) - `NseBhavcopySource`/`NseIndexSource`
stay registered under their own source_ids too, so either can still be selected
explicitly when a caller wants only stocks or only indices.
"""
import time
from collections.abc import Callable
from datetime import date
from typing import Literal

import jesse.helpers as jh

from ..contracts import SymbolCatalogEntry
from ..errors import ProviderUnavailableError
from .archive_cache import ArchiveFileCache
from .http import IndiaHttpClient
from .nse_archives import NseBhavcopySource
from .nse_indices import NseIndexSource
from .sources import DailyBar, IndiaDailySource, register_source
from .symbols import to_exchange_ticker

# How long the composite's own security-ticker set (derived from the bhavcopy stock/ETF
# catalog) stays cached before the next classification re-fetches it - same value/
# rationale as NseIndexSource's own catalog TTL (nse_indices.py): long enough that
# routing a batch of tickers doesn't re-fetch NSE's master files per ticker, short
# enough that a long-running process eventually notices a new listing/delisting.
_SECURITY_CATALOG_CACHE_TTL_SECONDS = 12 * 60 * 60

_Classification = Literal['security', 'index']


class NseCompositeSource(IndiaDailySource):
    """Routes NSE tickers between the index-close file and the stock/ETF bhavcopy."""

    source_id = 'nse'
    exchange = 'NSE'
    # Neither constituent source adjusts prices (see NseBhavcopySource/NseIndexSource) -
    # nothing for this composite to adjust either.
    prices_adjusted = False

    def __init__(
        self,
        bhavcopy_source: NseBhavcopySource | None = None,
        index_source: NseIndexSource | None = None,
        *,
        monotonic: Callable[[], float] | None = None,
        cache: ArchiveFileCache | None = None,
    ) -> None:
        # Both constituents get their own IndiaHttpClient by default rather than sharing
        # one - each already paces itself against the shared process-global per-host
        # schedule (see http.py), so nothing is lost, and each stays independently
        # injectable for tests. `cache` (story #8's on-disk archive cache) is forwarded
        # to both only when this composite builds its own default constituents - an
        # explicitly injected bhavcopy_source/index_source is trusted to already be
        # wired however its caller wanted.
        self._bhavcopy_source = (
            bhavcopy_source if bhavcopy_source is not None else NseBhavcopySource(IndiaHttpClient(), cache=cache)
        )
        self._index_source = (
            index_source if index_source is not None else NseIndexSource(IndiaHttpClient(), cache=cache)
        )
        # Injectable so tests control the security-ticker cache's TTL expiry without
        # sleeping for real hours (mirrors NseIndexSource/BseBhavcopySource).
        self._monotonic = monotonic if monotonic is not None else time.monotonic
        self._security_tickers: frozenset[str] | None = None
        # None means "not cached" (never fetched, or a failed fetch deliberately left
        # uncached - see `_cached_security_tickers`), not "cached at time zero".
        self._security_tickers_cached_at: float | None = None

    def fetch_daily_bars(self, ticker: str, sessions: list[date]) -> list[DailyBar]:
        if self._classify(ticker) == 'index':
            return self._index_source.fetch_daily_bars(ticker, sessions)
        return self._bhavcopy_source.fetch_daily_bars(ticker, sessions)

    def fetch_session_bars(self, session: date) -> dict[str, DailyBar] | None:
        """Bulk (story #8) counterpart to `fetch_daily_bars`: merges one session's two
        whole-market files (stock/ETF bhavcopy + index-close) instead of routing per
        ticker - `import_sessions` (bulk_import.py) needs every ticker's bar for a
        session in one call. Same classification rule as `_classify` (a stock/ETF
        always wins a ticker collision with an index - rule (a)), applied directly
        here since both whole files are already in hand rather than re-consulting the
        (TTL-cached) security/index catalogs per ticker.
        """
        security_bars = self._bhavcopy_source.fetch_session(session)
        index_bars = self._index_source.fetch_session(session)
        if security_bars is None and index_bars is None:
            return None
        merged: dict[str, DailyBar] = dict(index_bars) if index_bars else {}
        if security_bars:
            merged.update(security_bars)
        return merged

    def list_symbol_entries(self) -> tuple[SymbolCatalogEntry, ...]:
        security_entries = self._bhavcopy_source.list_symbol_entries()
        entries_by_ticker: dict[str, SymbolCatalogEntry] = {
            to_exchange_ticker(entry.symbol): entry for entry in security_entries
        }

        try:
            index_entries = self._index_source.list_symbol_entries()
        except ProviderUnavailableError:
            # The stock/ETF catalog is still useful on its own when the index file
            # can't be reached right now - a catalog listing must not fail outright just
            # because one of its two sources is temporarily down.
            index_entries = ()

        collision_count = 0
        for entry in index_entries:
            ticker = to_exchange_ticker(entry.symbol)
            if ticker in entries_by_ticker:
                # Same rule (a) `_classify` applies: an index ticker landing on an
                # existing stock/ETF ticker is an ambiguous route (fetch_daily_bars can
                # only pick one) - the stock/ETF wins, since it is the older,
                # unambiguous instrument, and the index entry is dropped rather than
                # silently shadowing a real, tradable symbol. Not expected in practice
                # (see the guard test in tests/test_india_nse_indices.py), so this is a
                # safety net, not a routine path - kept in lock-step with `_classify` so
                # a listed entry's `kind` always matches how it actually routes.
                collision_count += 1
                continue
            entries_by_ticker[ticker] = entry

        if collision_count:
            jh.debug(
                f'NSE symbol catalog: skipped {collision_count} index ticker(s) colliding with an existing '
                'stock/ETF ticker'
            )

        return tuple(entries_by_ticker.values())

    def is_index(self, ticker: str) -> bool:
        return self._classify(ticker) == 'index'

    def isin_for(self, ticker: str) -> str | None:
        # An index has no ISIN of its own to adjust by (story #7 never adjusts index
        # prices anyway - see IndiaDailySource.is_index) - only the security path has
        # one to look up.
        if self._classify(ticker) == 'index':
            return None
        return self._bhavcopy_source.isin_for(ticker)

    def _classify(self, ticker: str) -> _Classification:
        """The single security-vs-index decision every routing/catalog/is_index call
        goes through, in order:

        a. `ticker` is a known stock/ETF ticker -> security (a stock/ETF always wins a
           collision with an index ticker - see `list_symbol_entries`).
        b. else, `ticker` is a known index ticker (catalog or static override) -> index.
           This still applies when the security catalog itself failed to load (logged
           via jh.debug, since a real collision could not be ruled out in that case).
        c. else, if the index catalog is unavailable (only the static overrides are
           known, so "not a known index ticker" is not a confident answer) -> raise
           ProviderUnavailableError rather than silently guessing.
        d. else (both catalogs loaded, `ticker` is in neither) -> security. A delisted
           stock is absent from NSE's *current* equity/ETF master files (bhavcopy's own
           list_symbol_entries only reflects what's listed today - see
           nse_archives.py) while its old bhavcopy rows are still fetchable by ticker,
           so bhavcopy is always the safe fallback route for an unrecognized ticker.
        """
        normalized = ticker.upper()
        security_tickers, security_loaded = self._cached_security_tickers()
        if normalized in security_tickers:
            return 'security'

        index_tickers, index_loaded = self._index_source.known_index_tickers()
        if normalized in index_tickers:
            if not security_loaded:
                jh.debug(
                    f'NSE: classified {normalized!r} as an index while the security catalog was unavailable - '
                    'a stock/ETF collision could not be ruled out'
                )
            return 'index'

        if not index_loaded:
            raise ProviderUnavailableError(
                f'cannot classify {normalized!r}: NSE index catalog unavailable; retry later'
            )
        return 'security'

    def _cached_security_tickers(self) -> tuple[frozenset[str], bool]:
        """Returns (tickers, loaded) - `loaded` is False when the underlying bhavcopy
        catalog fetch failed, in which case `tickers` is an empty set, never a stale one.
        """
        now = self._monotonic()
        if (
            self._security_tickers is not None
            and self._security_tickers_cached_at is not None
            and now - self._security_tickers_cached_at < _SECURITY_CATALOG_CACHE_TTL_SECONDS
        ):
            return self._security_tickers, True

        try:
            entries = self._bhavcopy_source.list_symbol_entries()
        except ProviderUnavailableError:
            # Never cache a failure - the very next call retries instead of permanently
            # assuming the security catalog is gone (same pattern as BSE's recent-UDiFF
            # cache and NseIndexSource's own catalog cache).
            self._security_tickers = None
            self._security_tickers_cached_at = None
            return frozenset(), False

        tickers = frozenset(to_exchange_ticker(entry.symbol) for entry in entries)
        self._security_tickers = tickers
        self._security_tickers_cached_at = now
        return tickers, True


# Registered as the default NSE source: nse_archives.py registers NseBhavcopySource
# non-default (`register_source(NseBhavcopySource)`, no `default=True`) precisely so
# this composite can take the default slot instead - the registry allows only one
# default per exchange (sources.py). `jesse/services/historical_data/india/__init__.py`
# imports this module for that side effect, so `IndiaExchangeProvider('NSE')` now
# resolves to this composite with no explicit source argument.
register_source(NseCompositeSource, default=True)
