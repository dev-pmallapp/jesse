from typing import List, Dict
import os
import sys
import uuid
import numpy as np
from jesse.services import candle_service, exchange_service, order_service, position_service
from jesse.services import charts
from jesse.services.validators import validate_routes
from jesse.services.simulation_assumptions import resolve_annualization_for_exchange
from jesse.modes.backtest_mode import simulator
from jesse.config import config as jesse_config, reset_config, set_config
from jesse.routes import router
from jesse.store import store
from jesse.services.symbol_input import normalize_symbol
import jesse.helpers as jh


def _normalize_route_symbols(routes: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Accept a bare/TradingView symbol (`RELIANCE`, `NSE:RELIANCE`) in a route dict the
    same way the router does for strategies' routes.py - `router.initiate` (via
    `Route.__init__`) normalizes again downstream, so this is only needed here because
    the `candles` dict below must be re-keyed to match what the router ends up using.
    """
    return [{**r, 'symbol': normalize_symbol(r['exchange'], r['symbol'])} for r in routes]


def _normalize_candles_dict(candles: dict) -> dict:
    """Normalise each entry's `symbol` and re-key the dict on it.

    `candles`/`warmup_candles` are keyed by `jh.key(exchange, symbol)` (see this
    module's docstring example), and the engine looks entries up by that same key
    built from the (already-normalized) router routes - so a bare-ticker `candles`
    dict must be re-keyed here, not just have its `symbol` field rewritten in place.
    """
    normalized = {}
    for entry in candles.values():
        symbol = normalize_symbol(entry['exchange'], entry['symbol'])
        normalized[jh.key(entry['exchange'], symbol)] = {**entry, 'symbol': symbol}
    return normalized


def _validate_observed_one_minute_candles(candles: dict) -> None:
    """Validate provider-observed source rows before mutating research runtime state."""
    if not candles:
        raise ValueError('At least one observed candle series is required.')
    for candle_data in candles.values():
        candle_service.validate_observed_one_minute_candles(
            candle_data['candles'],
            candle_data['exchange'],
            candle_data['symbol'],
        )


def _validate_contiguous_one_minute_candles(candles: dict) -> None:
    """Retain dense-only validation for research engines not yet migrated to timestamp replay."""
    _validate_observed_one_minute_candles(candles)
    for candle_data in candles.values():
        differences = np.diff(candle_data['candles'][:, 0])
        invalid_indices = np.flatnonzero(differences != 60_000)
        if len(invalid_indices) == 0:
            continue
        index = int(invalid_indices[0])
        previous_timestamp = int(candle_data['candles'][index, 0])
        actual_timestamp = int(candle_data['candles'][index + 1, 0])
        difference = actual_timestamp - previous_timestamp
        if difference > 60_000 and difference % 60_000 == 0:
            missing_count = difference // 60_000 - 1
            candle_word = 'candle' if missing_count == 1 else 'candles'
            raise ValueError(
                f'Missing {missing_count} one-minute {candle_word} for '
                f"{candle_data['symbol']} on {candle_data['exchange']}."
            )
        raise ValueError(
            f"Candles for {candle_data['symbol']} on {candle_data['exchange']} must be continuous 1m rows."
        )


def backtest(
        config: dict,
        routes: List[Dict[str, str]],
        data_routes: List[Dict[str, str]],
        candles: dict,
        warmup_candles: dict = None,
        generate_hyperparameters: bool = False,
        generate_equity_curve: bool = False,
        benchmark: bool = False,
        generate_csv: bool = False,
        generate_json: bool = False,
        generate_logs: bool = False,
        hyperparameters: dict = None,
        fast_mode: bool = False,
        candles_pipeline_class = None,
        candles_pipeline_kwargs: dict = None,
        generate_charts: bool = False,
) -> dict:
    """
    An isolated backtest() function which is perfect for using in research, and AI training
    such as our own optimization mode. Because of it being a pure function, it can be used
    in Python's multiprocessing without worrying about pickling issues.

    Example `config`:
    {
        'starting_balance': 5_000,
        'fee': 0.005,
        'type': 'spot',
        'simulation_model': 'spot',
        # Optional. When omitted, it defaults to the `exchange`'s registered
        # annualization (252 for NSE/BSE).
        'annualization': 252,
        'exchange': 'NSE',
        'warm_up_candles': 0
    }

    Example `route`:
    [{'exchange': 'NSE', 'strategy': 'A1', 'symbol': 'RELIANCE-INR', 'timeframe': '1D'}]

    Example `data_route`:
    [{'exchange': 'NSE', 'symbol': 'RELIANCE-INR', 'timeframe': '1D'}]

    Example `candles`:
    {
        'NSE-RELIANCE-INR': {
            'exchange': 'NSE',
            'symbol': 'RELIANCE-INR',
            'candles': np.array([]),
        },
    }

    `routes`/`data_routes`/`candles` symbols also accept a bare NSE/BSE ticker
    (`RELIANCE`) or a TradingView-style symbol (`NSE:RELIANCE`) - both are normalized
    to the internal `RELIANCE-INR` form before the backtest runs.
    """
    routes = _normalize_route_symbols(routes)
    data_routes = _normalize_route_symbols(data_routes)
    candles = _normalize_candles_dict(candles)
    warmup_candles = _normalize_candles_dict(warmup_candles) if warmup_candles else warmup_candles

    return _isolated_backtest(
        config,
        routes,
        data_routes,
        candles,
        warmup_candles,
        run_silently=True,
        hyperparameters=hyperparameters,
        generate_csv=generate_csv,
        generate_json=generate_json,
        generate_equity_curve=generate_equity_curve,
        benchmark=benchmark,
        generate_hyperparameters=generate_hyperparameters,
        generate_logs=generate_logs,
        fast_mode=fast_mode,
        candles_pipeline_class=candles_pipeline_class,
        candles_pipeline_kwargs=candles_pipeline_kwargs,
        generate_charts=generate_charts,
    )


def _reset_research_runtime_state() -> None:
    """Restore every process-wide service owned by a research run."""
    reset_config()
    router._reset()
    store.reset()

    # Avoid constructing the API singleton while no routes are configured. If
    # it already exists, its sandbox drivers belong to the completed session.
    api_module = sys.modules.get('jesse.services.api')
    if api_module is not None:
        api_module.api.reset_drivers()


def _isolated_backtest(
        config: dict,
        routes: List[Dict[str, str]],
        data_routes: List[Dict[str, str]],
        candles: dict,
        warmup_candles: dict = None,
        run_silently: bool = True,
        hyperparameters: dict = None,
        generate_csv: bool = False,
        generate_json: bool = False,
        generate_equity_curve: bool = False,
        benchmark: bool = False,
        generate_hyperparameters: bool = False,
        generate_logs: bool = False,
        fast_mode: bool = False,
        candles_pipeline_class = None,
        candles_pipeline_kwargs: dict = None,
        generate_charts: bool = False,
) -> dict:
    # Validate before configuration, routes, or stores are mutated so both execution modes fail identically.
    _validate_observed_one_minute_candles(candles)

    _reset_research_runtime_state()
    try:
        return _execute_isolated_backtest(
            config,
            routes,
            data_routes,
            candles,
            warmup_candles,
            run_silently=run_silently,
            hyperparameters=hyperparameters,
            generate_csv=generate_csv,
            generate_json=generate_json,
            generate_equity_curve=generate_equity_curve,
            benchmark=benchmark,
            generate_hyperparameters=generate_hyperparameters,
            generate_logs=generate_logs,
            fast_mode=fast_mode,
            candles_pipeline_class=candles_pipeline_class,
            candles_pipeline_kwargs=candles_pipeline_kwargs,
            generate_charts=generate_charts,
        )
    finally:
        _reset_research_runtime_state()


def _execute_isolated_backtest(
        config: dict,
        routes: List[Dict[str, str]],
        data_routes: List[Dict[str, str]],
        candles: dict,
        warmup_candles: dict = None,
        run_silently: bool = True,
        hyperparameters: dict = None,
        generate_csv: bool = False,
        generate_json: bool = False,
        generate_equity_curve: bool = False,
        benchmark: bool = False,
        generate_hyperparameters: bool = False,
        generate_logs: bool = False,
        fast_mode: bool = False,
        candles_pipeline_class = None,
        candles_pipeline_kwargs: dict = None,
        generate_charts: bool = False,
) -> dict:

    jesse_config['app']['trading_mode'] = 'backtest'

    # inject (formatted) configuration values
    set_config(_format_config(config))

    # set routes
    router.initiate(routes, data_routes)
    # reset store
    store.reset()
    # validate routes
    validate_routes(router)
    # initiate candle store
    store.candles.init_storage(5000)
    store.candles.enforce_warmup = jesse_config['env']['data']['warmup_candles_num'] > 0
    # initialize exchanges state
    exchange_service.initialize_exchanges_state()
    # initialize orders state
    order_service.initialize_orders_state()
    # initialize positions state
    position_service.initialize_positions_state()

    trading_candles_dict = {
        k: {**v, 'candles': np.copy(v['candles'])} for k, v in candles.items()
    }
    warmup_candles_dict = {
        k: {**v, 'candles': np.copy(v['candles'])} for k, v in warmup_candles.items()
    } if warmup_candles else {}

    # if warmup_candles is passed, use it
    if warmup_candles:
        # The latest instrument start is the first boundary shared by every stream.
        initial_common_start = max(
            int(candle_data['candles'][0, 0])
            for candle_data in trading_candles_dict.values()
        )
        for c in jesse_config['app']['considering_candles']:
            key = jh.key(c[0], c[1])
            # inject warm-up candles
            candle_service.inject_warmup_candles_to_store(
                warmup_candles_dict[key]['candles'],
                c[0],
                c[1],
                available_at=initial_common_start,
            )

    # run backtest simulation
    backtest_result = simulator(
        trading_candles_dict,
        run_silently,
        hyperparameters=hyperparameters,
        generate_csv=generate_csv,
        generate_json=generate_json,
        generate_equity_curve=generate_equity_curve,
        benchmark=benchmark,
        generate_hyperparameters=generate_hyperparameters,
        generate_logs=generate_logs,
        fast_mode=fast_mode,
        candles_pipeline_class=candles_pipeline_class,
        candles_pipeline_kwargs=candles_pipeline_kwargs
    )

    # Generate extended chart images while store is still populated (before store.reset())
    if generate_charts and backtest_result.get('metrics') and backtest_result['metrics'].get('total', 0) > 0:
        _session_id = str(uuid.uuid4())
        _charts_folder = os.path.abspath('storage/backtest-charts')
        charts._plot_backtest_charts(
            session_id=_session_id,
            charts_folder=_charts_folder,
            theme='light',
            benchmark=benchmark,
        )
        backtest_result['charts_session_id'] = _session_id
        backtest_result['charts_folder'] = _charts_folder

    empty_metrics = {
        'total': 0,
        'win_rate': 0,
        'net_profit_percentage': 0,
        # Fall back to the exchange's registered annualization (e.g. 252 for NSE/BSE)
        # rather than always assuming crypto's 365-day calendar.
        'annualization': int(resolve_annualization_for_exchange(config, config['exchange'])),
    }
    result = {
        'metrics': empty_metrics,
        'logs': None,
    }

    if backtest_result['metrics'] is None:
        result['metrics'] = empty_metrics
    else:
        result['metrics'] = backtest_result['metrics']

    if generate_csv:
        result['csv'] = backtest_result['csv']
    if generate_json:
        result['json'] = backtest_result['json']
    if generate_equity_curve:
        result['equity_curve'] = backtest_result['equity_curve']
    if generate_hyperparameters:
        result['hyperparameters'] = backtest_result['hyperparameters']
    if generate_logs:
        result['logs'] = backtest_result['logs']
    if generate_charts and 'charts_session_id' in backtest_result:
        result['charts_session_id'] = backtest_result['charts_session_id']
        result['charts_folder'] = backtest_result['charts_folder']
    
    # Always include trades if available (needed for trade-shuffling Monte Carlo)
    if 'trades' in backtest_result:
        result['trades'] = backtest_result['trades']

    return result


def _format_config(config):
    """
    Jesse's required format for user_config is different from what this function accepts (so it
    would be easier to write for the researcher). Hence, we need to reformat the config_dict:
    """
    from jesse.services.simulation_assumptions import (
        legacy_type_from_simulation_model,
        resolve_simulation_model,
    )

    simulation_model = resolve_simulation_model(config, config.get('type', 'futures'))
    exchange_type = legacy_type_from_simulation_model(simulation_model)
    exchange_config = {
        'balance': config['starting_balance'],
        'fee': config['fee'],
        'type': exchange_type,
        'simulation_model': simulation_model.value,
        # Fall back to the exchange's registered annualization (e.g. 252 for NSE/BSE)
        # rather than always assuming crypto's 365-day calendar.
        'annualization': int(resolve_annualization_for_exchange(config, config['exchange'])),
        'name': config['exchange'],
    }
    # futures exchange has different config, so:
    if exchange_config['type'] == 'futures':
        exchange_config['futures_leverage'] = config['futures_leverage']
        exchange_config['futures_leverage_mode'] = config['futures_leverage_mode']

    return {
        'exchanges': {
            config['exchange']: exchange_config
        },
        'logging': {
            'balance_update': True,
            'order_cancellation': True,
            'order_execution': True,
            'order_submission': True,
            'position_closed': True,
            'position_increased': True,
            'position_opened': True,
            'position_reduced': True,
            'shorter_period_candles': False,
            'trading_candles': True
        },
        'warm_up_candles': config['warm_up_candles']
    }
