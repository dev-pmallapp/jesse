"""No-argument NSE/BSE `IndiaExchangeProvider` subclasses for Jesse's exchange
registry (story #9).

`build_historical_provider_registry`/`build_crypto_historical_provider_registry`
(jesse/modes/import_candles_mode/drivers/__init__.py) construct every registered
provider with `provider_class()` - no arguments - but `IndiaExchangeProvider` itself
requires an `exchange` name. These thin subclasses exist purely to supply that, one per
exchange, so they can be registered directly in `historical_provider_classes`.

Both wire in the on-disk archive cache (`ArchiveFileCache` over
`DEFAULT_ARCHIVE_CACHE_DIR`), the same default `bulk_import.import_sessions` uses:
without it, every per-symbol import (which fetches one whole-market session file per
symbol requested) would re-download each session's bhavcopy from scratch instead of
reusing what an earlier import - or a bulk one - already cached to disk.
"""
from .archive_cache import ArchiveFileCache, DEFAULT_ARCHIVE_CACHE_DIR
from .provider import IndiaExchangeProvider


class NseProvider(IndiaExchangeProvider):
    def __init__(self) -> None:
        super().__init__('NSE', cache=ArchiveFileCache(DEFAULT_ARCHIVE_CACHE_DIR))


class BseProvider(IndiaExchangeProvider):
    def __init__(self) -> None:
        super().__init__('BSE', cache=ArchiveFileCache(DEFAULT_ARCHIVE_CACHE_DIR))
