"""Tests for story #9 (dev-pmallapp/jesse#9): registering NSE/BSE as backtest-only
INR exchanges in Jesse's own exchange registry (`jesse.enums`, `jesse.info`,
`jesse.config`, `jesse.services.validators`, and the import-candles driver registry).
No network access anywhere: `NseProvider`/`BseProvider` are only ever constructed, never
made to fetch a session - their underlying `IndiaDailySource`s only touch the network
inside `fetch_session`/`fetch_daily_bars`, which nothing here calls.
"""
import subprocess
import sys
from pathlib import Path

import pytest

from jesse import exceptions
from jesse.config import config
from jesse.enums import exchanges
from jesse.info import backtesting_exchanges, exchange_info, live_trading_exchanges
from jesse.models.Route import Route
from jesse.modes.import_candles_mode.drivers import (
    build_historical_provider_registry,
    historical_provider_classes,
)
from jesse.services import validators
# `jesse.services.historical_data` no longer re-exports these (commit 54dcfea3, "keep
# India package off the boot import path") - import straight from the India package,
# same as the driver registry (jesse/modes/import_candles_mode/drivers/__init__.py) does.
from jesse.services.historical_data.india import BseProvider, NseProvider, archive_cache, bulk_import
from jesse.services.historical_data.india.archive_cache import ArchiveFileCache, DEFAULT_ARCHIVE_CACHE_DIR

# --------------------------------------------------------------------------------------
# jesse.enums.exchanges
# --------------------------------------------------------------------------------------


def test_nse_bse_enum_values():
    assert exchanges.NSE == 'NSE'
    assert exchanges.BSE == 'BSE'


def test_plain_import_jesse_does_not_load_the_india_package():
    """`jesse.services.historical_data` (loaded by every `import jesse`, via
    `jesse.info`/`jesse.config` walking `exchange_info`) must not itself import the
    India package (commit 54dcfea3, "keep India package off the boot import path") -
    only `jesse.modes.import_candles_mode.drivers` (loaded on demand for candle
    import/live trading, not on every boot) imports it. Verified in a fresh
    subprocess: this test file's own module-level `from
    jesse.services.historical_data.india import ...` above would otherwise make the
    assertion trivially true within this same process.
    """
    result = subprocess.run(
        [sys.executable, '-c', "import jesse, sys; assert 'jesse.services.historical_data.india' not in sys.modules"],
        cwd=str(Path(__file__).resolve().parents[1]),
        capture_output=True,
        text=True,
        timeout=60,
    )

    assert result.returncode == 0, f'stdout={result.stdout!r} stderr={result.stderr!r}'


# --------------------------------------------------------------------------------------
# jesse.info.exchange_info
# --------------------------------------------------------------------------------------


@pytest.mark.parametrize('exchange', ['NSE', 'BSE'])
def test_exchange_info_entries_for_india_exchanges(exchange):
    entry = exchange_info[exchange]
    assert entry['settlement_currency'] == 'INR'
    assert entry['annualization'] == 252
    assert entry['asset_class'] == 'equity'
    assert entry['daily_bars_only'] is True
    assert entry['modes']['backtesting'] is True
    assert entry['modes']['live_trading'] is False


@pytest.mark.parametrize('exchange', ['NSE', 'BSE'])
def test_india_exchanges_are_backtesting_only(exchange):
    assert exchange in backtesting_exchanges
    assert exchange not in live_trading_exchanges


# --------------------------------------------------------------------------------------
# jesse.config
# --------------------------------------------------------------------------------------


def test_config_env_exchanges_nse_annualization():
    assert config['env']['exchanges']['NSE']['annualization'] == 252


# --------------------------------------------------------------------------------------
# jesse.services.validators
# --------------------------------------------------------------------------------------


@pytest.mark.parametrize('exchange', ['NSE', 'BSE'])
def test_is_daily_bars_only_true_for_india_exchanges(exchange):
    assert validators.is_daily_bars_only(exchange) is True


def test_is_daily_bars_only_false_for_sandbox():
    # Sandbox has no `jesse.info.exchange_info` entry at all (it exists only to drive the
    # engine test suite - see AGENTS.md), so it takes the `daily_bars_only` default of False.
    assert validators.is_daily_bars_only(exchanges.SANDBOX) is False


class _FakeRouter:
    """Minimal router double for `validate_routes` - it only reads `.routes` and
    `.data_routes` (see the same pattern in tests/test_india_daily_storage.py).
    """

    def __init__(self, routes, data_routes=None):
        self.routes = routes
        self.data_routes = data_routes or []


@pytest.mark.parametrize('timeframe', ['1h', '3D'])
def test_validate_routes_rejects_non_daily_timeframe_on_nse_route(timeframe):
    router = _FakeRouter([Route('NSE', 'RELIANCE-INR', timeframe, 'Test19')])

    with pytest.raises(exceptions.InvalidRoutes, match='NSE'):
        validators.validate_routes(router)


def test_validate_routes_accepts_1d_on_nse_route():
    router = _FakeRouter([Route('NSE', 'RELIANCE-INR', '1D', 'Test19')])

    validators.validate_routes(router)  # must not raise


def test_validate_routes_accepts_1w_on_nse_route():
    # Story #67: 1W is now Monday-aligned and accepted, same as 1D.
    router = _FakeRouter([Route('NSE', 'RELIANCE-INR', '1W', 'Test19')])

    validators.validate_routes(router)  # must not raise


# --------------------------------------------------------------------------------------
# Driver / historical-provider registry
# --------------------------------------------------------------------------------------


def test_historical_provider_classes_map_nse_bse_to_india_providers():
    assert historical_provider_classes['NSE'] is NseProvider
    assert historical_provider_classes['BSE'] is BseProvider


def test_build_historical_provider_registry_constructs_nse_provider_with_no_network_or_files(
    monkeypatch, tmp_path,
):
    monkeypatch.chdir(tmp_path)

    registry = build_historical_provider_registry(('NSE',))
    provider = registry.get('NSE')

    assert isinstance(provider, NseProvider)
    assert provider.provider_id == 'NSE'
    # Constructing the provider (and its source/cache) must not touch the filesystem -
    # ArchiveFileCache only creates directories/files lazily, on an actual cache write.
    assert list(tmp_path.iterdir()) == []


def _archive_cache_base_dirs(source) -> list[Path]:
    """Collect every `ArchiveFileCache._base_dir` reachable from an India source.

    `BseBhavcopySource` (BSE's default) is a direct `ArchiveDailySource` subclass and
    carries its own `_cache`. `NseCompositeSource` (NSE's default, nse_composite.py)
    has no cache of its own - it fans out to a `_bhavcopy_source`/`_index_source` pair,
    each an `ArchiveDailySource` subclass with its own `_cache`.
    """
    base_dirs = []
    cache = getattr(source, '_cache', None)
    if isinstance(cache, ArchiveFileCache):
        base_dirs.append(cache._base_dir)
    for attr in ('_bhavcopy_source', '_index_source'):
        nested = getattr(source, attr, None)
        if nested is not None:
            base_dirs.extend(_archive_cache_base_dirs(nested))
    return base_dirs


@pytest.mark.parametrize('provider_cls', [NseProvider, BseProvider])
def test_provider_source_is_wired_with_the_default_archive_cache(provider_cls):
    provider = provider_cls()

    base_dirs = _archive_cache_base_dirs(provider._source)

    assert base_dirs  # at least one ArchiveFileCache was found on the source
    for base_dir in base_dirs:
        assert base_dir == Path(DEFAULT_ARCHIVE_CACHE_DIR)


def test_bulk_import_default_archive_cache_dir_still_importable_and_matches():
    assert bulk_import.DEFAULT_ARCHIVE_CACHE_DIR == archive_cache.DEFAULT_ARCHIVE_CACHE_DIR


# --------------------------------------------------------------------------------------
# INR settlement currency on a real Exchange model (story #12 covers the full
# end-to-end backtest; this only checks the Exchange model picks up 'INR')
# --------------------------------------------------------------------------------------


def test_exchange_model_uses_inr_settlement_currency_for_nse():
    from jesse.config import reset_config
    from jesse.models import SpotExchange
    from jesse.routes import router
    from jesse.services import exchange_service
    from jesse.store import store

    reset_config()
    config['app']['trading_mode'] = 'backtest'
    router.initiate([
        {'exchange': 'NSE', 'symbol': 'RELIANCE-INR', 'timeframe': '1D', 'strategy': 'Test19'},
    ], [])
    store.reset()
    try:
        exchange_service.initialize_exchanges_state()
        exchange = store.exchanges.get_exchange('NSE')

        assert isinstance(exchange, SpotExchange)
        assert exchange.settlement_currency == 'INR'
        assert exchange.assets['INR'] == config['env']['exchanges']['NSE']['balance']
    finally:
        # Leave shared global state clean for subsequent tests in the suite.
        store.reset()
        reset_config()
