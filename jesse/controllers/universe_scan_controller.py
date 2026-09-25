"""API for the universe-scan research tool (dev-pmallapp/jesse#80) - see
`jesse/modes/universe_scan_mode/__init__.py`'s docstring for the mode itself and
`storage.py`'s for why sessions are plain JSON files rather than a DB model.

India import boundary: this module's top level must never import
`jesse.services.historical_data.india.*` directly - `jesse/__init__.py` imports this
controller at module scope for every `import jesse` (see that package's boot-path
test). `research.universe`/`research.list_universes` are safe to import/call here -
they already lazy-import India only inside their own function bodies.
"""
import os
from multiprocessing import cpu_count

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

import jesse.helpers as jh
from jesse import exceptions
from jesse.info import exchange_info
from jesse.modes.universe_scan_mode import run as run_universe_scan
from jesse.modes.universe_scan_mode import storage
from jesse.services.auth import require_auth
from jesse.services.multiprocessing import process_manager
from jesse.services.symbol_input import normalize_symbol
from jesse.services.web import (
    UniverseScanCancelRequestJson,
    UniverseScanDeleteRequestJson,
    UniverseScanOptionsRequestJson,
    UniverseScanSessionRequestJson,
    UniverseScanStartRequestJson,
)

router = APIRouter(prefix="/universe-scan", tags=["Universe Scan"], dependencies=[Depends(require_auth)])

# How much of the machine a scan's optimize phase (Ray) may use by default when the
# user doesn't pick a specific core count - deliberately lower than optimize's own
# 80% default (research/monte_carlo/common.py's DEFAULT_CPU_USAGE_RATIO) because a
# scan is meant to run unattended for a long time alongside normal dashboard use.
DEFAULT_CPU_USAGE_RATIO = 0.75

# Universes worth pre-ticking in the page's defaults when they're available - the
# shortlists the reference universe_scan.py script was built around.
_DEFAULT_UNIVERSES = ('NIFTY100 ALPHA 30', 'NIFTY200 ALPHA 30')


def _list_project_strategies() -> list:
    """Directory names under strategies/ - mirrors strategy_controller.get_strategies()."""
    path = 'strategies'
    if not os.path.isdir(path):
        return []
    return sorted(
        name for name in os.listdir(path)
        if os.path.isdir(os.path.join(path, name)) and not name.startswith('__')
    )


def _default_cpu_cores() -> int:
    return max(1, round(cpu_count() * DEFAULT_CPU_USAGE_RATIO))


def _session_summary(session: dict) -> dict:
    """Compact view for the sessions list - the full session (including all rows) is
    only fetched one at a time via /session.
    """
    config = session.get('config') or {}
    return {
        'id': session.get('id'),
        'created_at': session.get('created_at'),
        'updated_at': session.get('updated_at'),
        'status': session.get('status'),
        'progress': session.get('progress'),
        'row_count': len(session.get('rows') or []),
        'config_summary': {
            'exchange': config.get('exchange'),
            'universes': config.get('universes'),
            'symbols': config.get('symbols'),
            'strategies': config.get('strategies'),
            'run_fixed': config.get('run_fixed'),
            'run_optimize': config.get('run_optimize'),
        },
    }


@router.post("/options")
def get_universe_scan_options(request_json: UniverseScanOptionsRequestJson = UniverseScanOptionsRequestJson()):
    """Form options + sensible defaults for the /universe-scan page."""
    from jesse import research  # lazy: research.list_universes() only touches India lazily itself

    universes = list(research.list_universes())
    default_universes = [u for u in _DEFAULT_UNIVERSES if u in universes]
    max_cpu_cores = cpu_count()

    exchange_entry = exchange_info.get(request_json.exchange, {})
    # `supported_timeframes` is already ['1D', '1W'] for NSE/BSE (daily_bars_only) -
    # see jesse/info.py and services/validators.py's DAILY_BARS_ONLY_ALLOWED_TIMEFRAMES.
    timeframes = list(exchange_entry.get('supported_timeframes', ['1D', '1W']))

    today = jh.timestamp_to_date(jh.today_to_timestamp())

    return JSONResponse({
        'universes': universes,
        'strategies': _list_project_strategies(),
        'timeframes': timeframes,
        'max_cpu_cores': max_cpu_cores,
        'defaults': {
            'exchange': 'NSE',
            'universes': default_universes,
            'timeframe': '1D',
            'data_start': '2021-01-01',
            # data_start + ~210 sessions of warm-up (~305 calendar days, plus slack for
            # NSE holidays beyond plain weekends) - see the reference
            # .jesse-project/universe_scan.py script's TRAIN_START comment.
            'train_start': '2021-11-15',
            'train_finish': '2024-12-31',
            'test_start': '2025-01-01',
            'test_finish': today,
            # Every reference strategy's largest lookback (SMA 200 / Ichimoku 52+26)
            # fits inside 210 sessions of warm-up.
            'warm_up_candles': 210,
            'balance': 1_000_000,
            'fee': 0.001,
            'run_fixed': True,
            'run_optimize': False,
            # Keeps ~450 strategy x stock optimizations (per the reference script's
            # universe/strategy list) tractable - raising it multiplies total runtime.
            'trials_per_hp': 20,
            # Daily swing systems trade tens of times over a ~3 year TRAIN window, not
            # hundreds - fitness.py scales its trade-count term by
            # log10(trades)/log10(optimal_total), capped at 1, so this is the trade
            # count considered "enough", not a hard minimum.
            'optimal_total': 30,
            'objective_function': 'sharpe',
            'cpu_cores': _default_cpu_cores(),
            'import_candles': False,
            'min_train_days': 365,
        },
    })


@router.post("/start")
def start_universe_scan(request_json: UniverseScanStartRequestJson):
    """Validate and kick off a universe scan as a background process."""
    jh.validate_cwd()

    if not request_json.universes and not request_json.symbols:
        return JSONResponse({
            'error': 'no_symbols',
            'message': 'Select at least one universe or add a symbol.',
        }, status_code=400)

    if not request_json.strategies:
        return JSONResponse({
            'error': 'no_strategies',
            'message': 'Select at least one strategy.',
        }, status_code=400)

    if not request_json.run_fixed and not request_json.run_optimize:
        return JSONResponse({
            'error': 'no_phase',
            'message': 'Select fixed, optimize, or both.',
        }, status_code=400)

    from jesse import research  # lazy: list_universes() only touches India lazily itself
    known_universes = set(research.list_universes())
    unknown_universes = [u for u in request_json.universes if u not in known_universes]
    if unknown_universes:
        return JSONResponse({
            'error': 'unknown_universe',
            'message': f'Unknown universe(s): {", ".join(unknown_universes)}',
        }, status_code=400)

    unknown_strategies = [s for s in request_json.strategies if not os.path.isdir(f'strategies/{s}')]
    if unknown_strategies:
        return JSONResponse({
            'error': 'unknown_strategy',
            'message': f'Unknown strategy(ies): {", ".join(unknown_strategies)}',
        }, status_code=400)

    try:
        data_start_ts = jh.date_to_timestamp(request_json.data_start)
        train_start_ts = jh.date_to_timestamp(request_json.train_start)
        train_finish_ts = jh.date_to_timestamp(request_json.train_finish)
        test_start_ts = jh.date_to_timestamp(request_json.test_start)
        test_finish_ts = jh.date_to_timestamp(request_json.test_finish)
    except Exception:
        return JSONResponse({
            'error': 'bad_date',
            'message': 'Dates must be in YYYY-MM-DD format.',
        }, status_code=400)

    if not (data_start_ts < train_start_ts < train_finish_ts < test_start_ts <= test_finish_ts):
        return JSONResponse({
            'error': 'bad_date_order',
            'message': 'Dates must satisfy data_start < train_start < train_finish < test_start <= test_finish.',
        }, status_code=400)

    max_cpu_cores = cpu_count()
    cpu_cores = request_json.cpu_cores or _default_cpu_cores()
    if not (1 <= cpu_cores <= max_cpu_cores):
        return JSONResponse({
            'error': 'bad_cpu_cores',
            'message': f'cpu_cores must be between 1 and {max_cpu_cores} (this machine\'s core count).',
        }, status_code=400)

    # Normalize/validate explicit symbols up front so a typo is a 400 here, not a
    # silent mid-run skip discovered only after the scan has already started.
    try:
        normalized_symbols = [normalize_symbol(request_json.exchange, s) for s in request_json.symbols]
    except exceptions.InvalidSymbol as e:
        return JSONResponse({'error': 'bad_symbol', 'message': str(e)}, status_code=400)

    # Validate the id itself (a caller-controlled value - see storage.is_safe_session_id's
    # docstring) before touching any shared state, so a malformed id is always a 400
    # regardless of whether a scan happens to be running right now.
    session_id = request_json.id or jh.generate_unique_id()
    if not storage.is_safe_session_id(session_id):
        return JSONResponse({'error': 'bad_id', 'message': 'id must match ^[A-Za-z0-9_-]{1,64}$.'}, status_code=400)

    config = {
        'exchange': request_json.exchange,
        'universes': request_json.universes,
        'symbols': normalized_symbols,
        'strategies': request_json.strategies,
        'timeframe': request_json.timeframe,
        'data_start': request_json.data_start,
        'train_start': request_json.train_start,
        'train_finish': request_json.train_finish,
        'test_start': request_json.test_start,
        'test_finish': request_json.test_finish,
        'warm_up_candles': request_json.warm_up_candles,
        'balance': request_json.balance,
        'fee': request_json.fee,
        'run_fixed': request_json.run_fixed,
        'run_optimize': request_json.run_optimize,
        'trials_per_hp': request_json.trials_per_hp,
        'optimal_total': request_json.optimal_total,
        'objective_function': request_json.objective_function,
        'cpu_cores': cpu_cores,
        'import_candles': request_json.import_candles,
        'min_train_days': request_json.min_train_days,
    }

    # Everything from here on (the "is one already running?" check, creating the
    # session, and queuing the worker) must be atomic - otherwise two concurrent
    # /start requests could both see "nothing running" and both launch a worker
    # (TOCTOU). start_lock() serializes this across the whole process (and, via
    # flock, across any number of server processes) - see its docstring.
    with storage.start_lock():
        running_id = storage.any_running()
        if running_id:
            return JSONResponse({
                'error': 'scan_running',
                'message': f'Universe scan {running_id} is already running.',
            }, status_code=409)

        if storage.read_session(session_id) is not None:
            return JSONResponse({
                'error': 'session_exists',
                'message': f'Session {session_id} already exists.',
            }, status_code=409)

        storage.create_session(session_id, config)
        process_manager.add_task(run_universe_scan, session_id, config)

    return JSONResponse({'id': session_id}, status_code=202)


@router.post("/sessions")
def get_universe_scan_sessions():
    """List every session, newest first."""
    sessions = storage.list_sessions()
    return JSONResponse({'sessions': [_session_summary(s) for s in sessions]})


@router.post("/session")
def get_universe_scan_session(request_json: UniverseScanSessionRequestJson):
    """Full session.json, including every row - used by the page's results view."""
    if not storage.is_safe_session_id(request_json.id):
        return JSONResponse({'error': 'bad_id', 'message': 'Invalid session id.'}, status_code=400)

    session = storage.read_session(request_json.id)
    if session is None:
        return JSONResponse({'error': 'not_found', 'message': f'Session {request_json.id} not found.'}, status_code=404)

    return JSONResponse(session)


@router.post("/cancel")
def cancel_universe_scan(request_json: UniverseScanCancelRequestJson):
    """Cooperative cancel: drops a marker file the running worker polls between units."""
    if not storage.is_safe_session_id(request_json.id):
        return JSONResponse({'error': 'bad_id', 'message': 'Invalid session id.'}, status_code=400)

    if storage.read_session(request_json.id) is None:
        return JSONResponse({'error': 'not_found', 'message': f'Session {request_json.id} not found.'}, status_code=404)

    storage.request_cancel(request_json.id)
    return JSONResponse({'message': f'Universe scan {request_json.id} was requested to cancel.'})


@router.post("/delete")
def delete_universe_scan(request_json: UniverseScanDeleteRequestJson):
    if not storage.is_safe_session_id(request_json.id):
        return JSONResponse({'error': 'bad_id', 'message': 'Invalid session id.'}, status_code=400)

    session = storage.read_session(request_json.id)
    if session is None:
        return JSONResponse({'error': 'not_found', 'message': f'Session {request_json.id} not found.'}, status_code=404)

    if storage.is_running(request_json.id):
        return JSONResponse({
            'error': 'scan_running',
            'message': 'Cannot delete a running scan; cancel it first.',
        }, status_code=409)

    storage.delete_session(request_json.id)
    return JSONResponse({'message': f'Universe scan {request_json.id} was deleted.'})
