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

from ..contracts import SymbolCatalogEntry
from ..errors import ProviderCapabilityError, ProviderNotRegisteredError, ProviderRegistrationError


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


class ArchiveDailySource(IndiaDailySource):
    """Base for sources that publish one whole-market file per session (bhavcopy-style)."""

    # An import walks many tickers over the same date range; caching each day's parsed
    # file means it is downloaded once regardless of how many symbols are imported.
    # A handful of sessions is enough since imports fetch dates in order.
    _SESSION_CACHE_SIZE = 8

    def __init__(self) -> None:
        self._session_cache: 'OrderedDict[date, Mapping[str, DailyBar] | None]' = OrderedDict()

    @abstractmethod
    def fetch_session(self, session: date) -> Mapping[str, DailyBar] | None:
        """Fetch and parse one session's whole-market file, keyed by ticker.

        Returns None when the file was not published for that date (e.g. a holiday),
        never an exception - a missing file is an expected, routine outcome here.
        """

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


def create_source(exchange: str, source_id: str | None = None) -> IndiaDailySource:
    exchange_sources = _registered_sources.get(exchange)
    if not exchange_sources:
        raise ProviderNotRegisteredError(f'No India data sources are registered for exchange {exchange!r}')
    resolved_id = source_id if source_id is not None else _default_source_ids.get(exchange)
    if resolved_id is None:
        raise ProviderNotRegisteredError(f'Exchange {exchange!r} has no default India source configured')
    source_cls = exchange_sources.get(resolved_id)
    if source_cls is None:
        raise ProviderNotRegisteredError(f'India source {resolved_id!r} is not registered for exchange {exchange!r}')
    return source_cls()
