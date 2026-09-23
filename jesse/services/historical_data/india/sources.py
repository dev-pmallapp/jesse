"""Pluggable daily-bar sources for NSE/BSE (D1 in docs/india-markets/PLAN.md).

No concrete sources are registered here yet - `nse_archives.py`/`bse_archives.py`/
broker adapters and persisting the user's chosen source are later stories. This
module only provides the shared `DailyBar`/`IndiaDailySource` contracts, the
whole-market-file caching base class, and the registry those later sources plug into.
"""
from abc import ABC, abstractmethod
from collections import OrderedDict
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date

import jesse.helpers as jh

from ..contracts import SymbolCatalogEntry
from ..errors import ProviderCapabilityError, ProviderNotRegisteredError, ProviderRegistrationError
from .archive_cache import MISSING, ArchiveFileCache


@dataclass(frozen=True, slots=True)
class DailyBar:
    """One traded session's OHLCV for one ticker, in the source's native (unadjusted) prices."""

    session: date
    open: float
    high: float
    low: float
    close: float
    volume: float


class IndiaDailySource(ABC):
    """One free-archive or broker-API source of NSE/BSE daily bars."""

    source_id: str
    exchange: str
    # D7: canonical stored prices are split/bonus-adjusted by Jesse; a source that
    # already returns adjusted prices declares it here so that step is skipped for it.
    prices_adjusted: bool

    @abstractmethod
    def fetch_daily_bars(self, ticker: str, sessions: list[date]) -> list[DailyBar]:
        """Return ascending DailyBars for `ticker`, covering only sessions that actually traded."""

    def list_symbol_entries(self) -> tuple[SymbolCatalogEntry, ...]:
        """Return this source's symbol catalog; a source without one raises (opt-in per source)."""
        raise ProviderCapabilityError(f'India source {self.source_id!r} does not provide a symbol catalog')

    def is_index(self, ticker: str) -> bool:
        """Whether `ticker` (an exchange ticker - e.g. from `to_exchange_ticker`, not a
        Jesse symbol) names an index rather than a tradable security.

        This is the single authority story #7 (split/bonus price adjustment) uses to
        decide whether a symbol's prices are ever adjusted: an index's own level is
        never retroactively adjusted for a constituent's corporate action (a
        constituent's split/bonus already flows through the index via its float-
        adjusted weight - see NseIndexSource's `prices_adjusted` docstring), so #7 must
        skip adjustment entirely for anything this returns True for. Defaults to False:
        only a source that actually publishes indices (NseIndexSource,
        NseCompositeSource) needs to override it.
        """
        return False

    def isin_for(self, ticker: str) -> str | None:
        """ISIN for `ticker`, when this source can determine one; else None.

        Story #7 (split/bonus adjustment) uses this to look up a security's ISIN so it
        can index into `CorporateActionsStore` (NSE's corporate-actions API is keyed by
        ISIN, not ticker - see corporate_actions.py). Defaults to None: a source without
        its own security master (or one that hasn't implemented this) simply can't
        answer, and #7 treats that the same as "no known corporate actions" (unadjusted,
        with a warning) rather than guessing.
        """
        return None

    def fetch_session_bars(self, session: date) -> Mapping[str, DailyBar] | None:
        """Bulk (story #8) counterpart to `fetch_daily_bars`: every ticker's bar for
        one whole-market session in a single call, used by `import_sessions`
        (bulk_import.py) which needs a whole session at once rather than one ticker at
        a time. `ArchiveDailySource` (below) implements this directly as its own
        `fetch_session`; `NseCompositeSource` (nse_composite.py) overrides it to merge
        its two constituent sources' sessions. No other `IndiaDailySource` subclass
        exists yet, so there is no default implementation here.
        """
        raise ProviderCapabilityError(
            f'India source {self.source_id!r} does not support bulk session import'
        )


class ArchiveDailySource(IndiaDailySource):
    """Base for sources that publish one whole-market file per session (bhavcopy-style)."""

    # An import walks many tickers over the same date range; caching each day's parsed
    # file means it is downloaded once regardless of how many symbols are imported.
    # A handful of sessions is enough since imports fetch dates in order.
    _SESSION_CACHE_SIZE = 8

    def __init__(self, *, cache: ArchiveFileCache | None = None) -> None:
        self._session_cache: 'OrderedDict[date, Mapping[str, DailyBar] | None]' = OrderedDict()
        # Optional on-disk raw-payload cache (story #8, archive_cache.py). None (the
        # default) means every fetch goes straight to the network exactly as it did
        # before this cache existed - every pre-existing caller/test that constructs a
        # source without a `cache=` argument is unaffected.
        self._cache = cache

    @abstractmethod
    def fetch_session(self, session: date) -> Mapping[str, DailyBar] | None:
        """Fetch and parse one session's whole-market file, keyed by ticker.

        Returns None when the file was not published for that date (e.g. a holiday),
        never an exception - a missing file is an expected, routine outcome here.
        """

    def fetch_session_bars(self, session: date) -> Mapping[str, DailyBar] | None:
        # A plain archive source already fetches one whole-market file per session -
        # `fetch_session` itself IS the bulk path, nothing further to merge.
        return self.fetch_session(session)

    def _fetch_and_parse(
        self,
        url: str,
        *,
        kind: str,
        session: date,
        expect: str,
        client,
        parse,
    ) -> Mapping[str, DailyBar] | None:
        """Fetch `url`'s raw payload (transparently serving/populating the on-disk
        cache keyed by `(self.source_id, kind, session)` when one is configured - see
        archive_cache.py) and hand it to `parse`.

        A payload read FROM the cache that fails to parse is treated as a corrupt disk
        entry: it is dropped and re-fetched from the network exactly once (a payload
        that was fetched fresh in this same call and still fails to parse is a genuine
        schema error and is left to propagate normally, never silently retried).
        """
        from_cache = False
        if self._cache is None:
            payload = client.get(url, expect=expect)
        else:
            cached = self._cache.get(self.source_id, kind, session)
            if cached is not MISSING:
                payload = cached
                from_cache = True
            else:
                payload = client.get(url, expect=expect)
                self._cache.put(self.source_id, kind, session, payload)

        if payload is None:
            return None
        try:
            return parse(payload)
        except Exception as exc:
            if not from_cache:
                raise
            jh.debug(
                f'{self.source_id}: cached {kind!r} payload for {session} failed to parse ({exc!r}); '
                'discarding it and refetching from network once'
            )
            self._cache.invalidate(self.source_id, kind, session)
            payload = client.get(url, expect=expect)
            self._cache.put(self.source_id, kind, session, payload)
            if payload is None:
                return None
            return parse(payload)

    def fetch_daily_bars(self, ticker: str, sessions: list[date]) -> list[DailyBar]:
        bars = []
        for session in sessions:
            day_bars = self._cached_session(session)
            if day_bars is None:
                continue
            bar = day_bars.get(ticker)
            if bar is not None:
                bars.append(bar)
        return bars

    def _cached_session(self, session: date) -> Mapping[str, DailyBar] | None:
        if session in self._session_cache:
            self._session_cache.move_to_end(session)
            return self._session_cache[session]
        day_bars = self.fetch_session(session)
        self._session_cache[session] = day_bars
        self._session_cache.move_to_end(session)
        if len(self._session_cache) > self._SESSION_CACHE_SIZE:
            self._session_cache.popitem(last=False)
        return day_bars


# Registered source classes, keyed by exchange then source_id; and the default
# source_id per exchange used when a caller does not name one explicitly.
_registered_sources: dict[str, dict[str, type[IndiaDailySource]]] = {}
_default_source_ids: dict[str, str] = {}


def register_source(source_cls: type[IndiaDailySource], *, default: bool = False) -> None:
    exchange = source_cls.exchange
    source_id = source_cls.source_id
    exchange_sources = _registered_sources.setdefault(exchange, {})
    if source_id in exchange_sources:
        raise ProviderRegistrationError(
            f'India source {source_id!r} is already registered for exchange {exchange!r}'
        )
    exchange_sources[source_id] = source_cls
    if default:
        if exchange in _default_source_ids:
            raise ProviderRegistrationError(f'Exchange {exchange!r} already has a default India source')
        _default_source_ids[exchange] = source_id


def available_sources(exchange: str) -> tuple[str, ...]:
    return tuple(_registered_sources.get(exchange, {}))


def create_source(
    exchange: str, source_id: str | None = None, *, cache: ArchiveFileCache | None = None,
) -> IndiaDailySource:
    """Instantiate a registered source. `cache` (story #8's on-disk archive cache) is
    forwarded as a `cache=` keyword only when given - every registered source class
    accepts it (defaulting to None, i.e. no caching), so this stays a plain no-arg
    construction for every existing caller that doesn't pass one.
    """
    exchange_sources = _registered_sources.get(exchange)
    if not exchange_sources:
        raise ProviderNotRegisteredError(f'No India data sources are registered for exchange {exchange!r}')
    resolved_id = source_id if source_id is not None else _default_source_ids.get(exchange)
    if resolved_id is None:
        raise ProviderNotRegisteredError(f'Exchange {exchange!r} has no default India source configured')
    source_cls = exchange_sources.get(resolved_id)
    if source_cls is None:
        raise ProviderNotRegisteredError(f'India source {resolved_id!r} is not registered for exchange {exchange!r}')
    if cache is not None:
        return source_cls(cache=cache)
    return source_cls()
