"""Process-local, TTL'd caches for the India equity catalog and the index-universe
"which stock is in which basket" index - shared by `jesse.controllers.equities_controller`
(search-as-you-type is the reason this exists: a live NSE/BSE catalog fetch, or a full
re-scan of every cached universe snapshot on disk, on every keystroke is far too slow)
and available to any other India-touching controller that needs the same data.

Not the same thing as `jesse.services.symbol_catalog` (Redis-backed, shared across
worker processes, keyed by `build_historical_provider_registry`) - that module already
exists for the plain candle-import symbol pickers. This one is deliberately simpler and
process-local: no Redis dependency, and it also caches the universe-membership index
(`get_cached_universe_members`), which `symbol_catalog.py` has no notion of. Consider
consolidating the two if a Redis-backed, cross-process version of this cache is ever
needed too.

India import boundary: like every other India-touching module in this package, nothing
here imports `jesse.services.historical_data.india.*` at module scope - only inside each
cache's own fetch closure, run lazily on a cache miss.
"""
import threading
import time
from typing import Callable, Optional

# NSE/BSE republish their equity/index-constituent master files at most once a day (see
# historical_data/india/nse_archives.py's own `_ISIN_MAP_CACHE_TTL_SECONDS` for the same
# 12h convention on a sibling cache) - long enough that a search-as-you-type session
# never re-fetches mid-session, short enough that a same-day listing/delisting or index
# rebalance shows up without a process restart.
CATALOG_CACHE_TTL_SECONDS = 12 * 60 * 60
MEMBERS_CACHE_TTL_SECONDS = 12 * 60 * 60

# The universe-membership index has no natural partition key (it spans every registered
# universe in one call), so it's cached under this single constant key.
_MEMBERS_CACHE_KEY = 'all'


class _TTLCache:
    """A tiny process-local, thread-safe, TTL'd cache of one value per key.

    Thread-safety matters here specifically because FastAPI runs sync `def` routes in a
    threadpool (`starlette.concurrency.run_in_threadpool`), so two concurrent requests
    can race to populate the same key from different threads. Locking is per-key (not
    one global lock) so a slow NSE fetch never blocks an already-cached BSE read.

    A failed `fetch()` is deliberately never stored - the next call (even one
    millisecond later) retries rather than being stuck reporting "catalog unavailable"
    for the rest of the TTL window just because one request hit a transient failure.
    """

    def __init__(self, ttl_seconds: float):
        self._ttl_seconds = ttl_seconds
        self._entries: dict = {}
        self._key_locks: dict = {}
        self._key_locks_guard = threading.Lock()  # protects `_key_locks` itself, not the cached values

    def _lock_for(self, key) -> threading.Lock:
        with self._key_locks_guard:
            lock = self._key_locks.get(key)
            if lock is None:
                lock = self._key_locks[key] = threading.Lock()
            return lock

    def get(self, key, fetch: Callable[[], object], *, monotonic: Callable[[], float] = time.monotonic):
        now = monotonic()
        with self._lock_for(key):
            cached = self._entries.get(key)
            if cached is not None and now - cached[1] < self._ttl_seconds:
                return cached[0]
            value = fetch()  # may raise - see class docstring: never cached on failure
            self._entries[key] = (value, now)
            return value

    def clear(self) -> None:
        """Test-only: drop every cached value (and per-key lock) so one test's cached
        state never leaks into the next."""
        with self._key_locks_guard:
            self._key_locks.clear()
        self._entries.clear()


_catalog_cache = _TTLCache(CATALOG_CACHE_TTL_SECONDS)
_members_cache = _TTLCache(MEMBERS_CACHE_TTL_SECONDS)


def get_catalog_entries(exchange: str, *, monotonic: Optional[Callable[[], float]] = None) -> tuple:
    """`SymbolCatalogEntry` tuple for `exchange`'s equity catalog (`NseProvider`/
    `BseProvider().list_symbol_entries()`), cached for `CATALOG_CACHE_TTL_SECONDS`.
    Raises whatever the underlying fetch raises (e.g. `HistoricalDataProviderError`) on
    a cache miss - the caller decides how to degrade (see `equities_controller._load_catalog`).
    """
    def fetch() -> tuple:
        from jesse.services.historical_data.india.exchange_providers import BseProvider, NseProvider
        provider_classes = {'NSE': NseProvider, 'BSE': BseProvider}
        return provider_classes[exchange]().list_symbol_entries()

    return _catalog_cache.get(exchange, fetch, monotonic=monotonic or time.monotonic)


def get_cached_universe_members(*, monotonic: Optional[Callable[[], float]] = None) -> dict:
    """`symbol -> (Member, [universe name, ...])` from every index universe's latest
    CACHED snapshot on disk, cached for `MEMBERS_CACHE_TTL_SECONDS`. Never touches the
    network itself (only the on-disk snapshot store - see
    `historical_data/india/universes.py`'s snapshot-store docstring), but scanning every
    universe's snapshot directory + parsing its CSV on every request is still real I/O
    worth avoiding on a search-as-you-type path.
    """
    def fetch() -> dict:
        from pathlib import Path

        from jesse.services.historical_data.india.universes import (
            DEFAULT_SNAPSHOT_DIR,
            _UNIVERSE_REGISTRY,
            _list_snapshot_dates,
            _read_snapshot,
            _slug,
        )

        by_symbol: dict = {}
        for name in sorted(_UNIVERSE_REGISTRY):
            universe_dir = Path(DEFAULT_SNAPSHOT_DIR) / _slug(name)
            dates = _list_snapshot_dates(universe_dir)
            if not dates:
                continue
            for member in _read_snapshot(universe_dir, max(dates), name):
                entry = by_symbol.setdefault(member.symbol, (member, []))
                entry[1].append(name)
        return by_symbol

    return _members_cache.get(_MEMBERS_CACHE_KEY, fetch, monotonic=monotonic or time.monotonic)


def clear_caches() -> None:
    """Test-only: reset both caches - call this (e.g. from an autouse fixture) before
    any test that exercises `get_catalog_entries`/`get_cached_universe_members`."""
    _catalog_cache.clear()
    _members_cache.clear()
