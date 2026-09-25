"""Universe scan mode (dev-pmallapp/jesse#80).

Runs a set of strategies over every symbol in one or more NSE index universes (plus
any explicit symbols), over a TRAIN and a TEST window, and compares each result to
that stock's own buy & hold. Generalises the reference `.jesse-project/universe_scan.py`
script into a `process_manager` task the dashboard-adjacent `/universe-scan` page can
drive over HTTP.

Persistence is file-based (see `storage.py`'s docstring for why this is deliberately
NOT a database model).

India import boundary: this package's own module-level code must never import
`jesse.services.historical_data.india.*` (the bulk candle importer, index universe
membership) - see `jesse/research/universes.py`'s docstring and the boot-path test in
tests/test_india_universes.py (`test_plain_import_jesse_research_does_not_load_india_modules`).
Because `jesse/__init__.py` imports the new controller - which imports this package -
at module scope for every `import jesse`, every India-only import below happens
inside `run()`'s body (or deeper), never at this file's top level. `jesse.research`
itself is safe to import here: `research.universe`/`research.list_universes` already
lazy-import India only when actually called (see jesse/research/universes.py).
"""
import os
import traceback
from datetime import datetime
from multiprocessing import cpu_count

import ray

import jesse.helpers as jh
from jesse import research

from . import storage
from .helpers import build_row, buy_hold_pct, clip_train_window, extract_metrics, resolve_symbols, summarize


def _load_candles(exchange: str, symbol: str, timeframe: str, start: str, finish: str, warm_up_candles: int):
    """Trading + warm-up candle dicts for one symbol/window, shaped for research.backtest()/optimize()."""
    warmup, trade = research.get_candles(
        exchange, symbol, timeframe, jh.date_to_timestamp(start), jh.date_to_timestamp(finish),
        warmup_candles_num=warm_up_candles, is_for_jesse=True,
    )
    key = jh.key(exchange, symbol)
    trade_dict = {key: {'exchange': exchange, 'symbol': symbol, 'candles': trade}}
    warmup_dict = {key: {'exchange': exchange, 'symbol': symbol, 'candles': warmup}}
    return trade_dict, warmup_dict


def _backtest_unit(
        exchange: str, strategy: str, symbol: str, timeframe: str, balance: float, fee: float,
        warm_up_candles: int, candles: dict, warmup: dict, hp: dict = None,
) -> dict:
    result = research.backtest(
        config={
            'starting_balance': balance, 'fee': fee, 'type': 'spot',
            'exchange': exchange, 'warm_up_candles': warm_up_candles,
        },
        routes=[{'exchange': exchange, 'strategy': strategy, 'symbol': symbol, 'timeframe': timeframe}],
        data_routes=[], candles=candles, warmup_candles=warmup, hyperparameters=hp, fast_mode=True,
    )
    return extract_metrics(result['metrics'])


def run(session_id: str, config: dict) -> None:
    """`process_manager.add_task` target. `config` is the dict built by
    `universe_scan_controller.start_universe_scan` (already validated/defaulted
    there); `.get(...)` fallbacks below only guard direct/test callers.
    """
    exchange = config['exchange']
    timeframe = config.get('timeframe', '1D')
    universes = config.get('universes', [])
    explicit_symbols = config.get('symbols', [])
    strategies = config['strategies']
    data_start = config.get('data_start', '2021-01-01')
    train_start, train_finish = config['train_start'], config['train_finish']
    test_start, test_finish = config['test_start'], config['test_finish']
    warm_up_candles = config.get('warm_up_candles', 210)
    balance = config.get('balance', 1_000_000)
    fee = config.get('fee', 0.001)
    run_fixed = config.get('run_fixed', True)
    run_optimize = config.get('run_optimize', False)
    trials_per_hp = config.get('trials_per_hp', 20)
    optimal_total = config.get('optimal_total', 30)
    objective_function = config.get('objective_function', 'sharpe')
    # `/start` already resolves/validates this against cpu_count(); this fallback only
    # covers a direct (e.g. test) call to run() that skips the controller.
    cpu_cores = config.get('cpu_cores') or max(1, round(cpu_count() * 0.75))
    import_candles = config.get('import_candles', False)
    min_train_days = config.get('min_train_days', 365)

    rows: list = []
    ray_started_here = False
    try:
        # As close to this function's first line as possible: lets storage.is_running()/
        # any_running() tell a genuinely running scan apart from a stale 'running' left by
        # a worker that died without updating its own session (see storage.py's docstring).
        storage.mark_worker_started(session_id, os.getpid())

        jh.debug(f'universe-scan {session_id}: resolving {len(universes)} universe(s) + {len(explicit_symbols)} symbol(s)')
        universe_symbol_lists, universe_used_current = {}, {}
        for name in universes:
            u = research.universe(name)
            universe_symbol_lists[name] = u.symbols
            universe_used_current[name] = u.used_current_members
        symbols, survivorship_warning = resolve_symbols(universe_symbol_lists, universe_used_current, explicit_symbols, exchange)

        storage.update_session(
            session_id, survivorship_warning=survivorship_warning,
            progress={'phase': 'resolve', 'done': 0, 'total': len(symbols), 'current': None},
        )

        if storage.is_cancelled(session_id):
            storage.update_session(session_id, status='cancelled')
            return

        if import_candles:
            # India-only bulk importer - imported here, not at module scope, per the
            # India import boundary explained in this module's docstring.
            from jesse.services.historical_data.india.bulk_import import import_sessions
            data_start_date = datetime.strptime(data_start, '%Y-%m-%d').date()
            test_finish_date = datetime.strptime(test_finish, '%Y-%m-%d').date()
            jh.debug(f'universe-scan {session_id}: importing candles for {len(symbols)} symbol(s)')
            storage.update_session(session_id, progress={'phase': 'import', 'done': 0, 'total': len(symbols), 'current': None})
            import_sessions(exchange, data_start_date, test_finish_date, symbols)
            if storage.is_cancelled(session_id):
                storage.update_session(session_id, status='cancelled')
                return

        # Per-symbol window clipping + candle loading. A single symbol's missing/short
        # history must not stop the whole scan - it is recorded as a skip instead.
        data = {}
        skipped = []
        for i, symbol in enumerate(symbols):
            if storage.is_cancelled(session_id):
                storage.update_session(session_id, status='cancelled', skipped=skipped)
                return
            storage.update_session(session_id, progress={'phase': 'load', 'done': i, 'total': len(symbols), 'current': symbol})
            try:
                _, full_rows = research.get_candles(
                    exchange, symbol, timeframe, jh.date_to_timestamp(data_start), jh.date_to_timestamp(test_finish),
                    is_for_jesse=True,
                )
                if len(full_rows) == 0:
                    skipped.append({'symbol': symbol, 'reason': 'no candle history'})
                    continue
                clipped_train_start_ts = clip_train_window(
                    int(full_rows[0, 0]), jh.date_to_timestamp(train_start), jh.date_to_timestamp(train_finish),
                    warm_up_candles, min_train_days,
                )
                if clipped_train_start_ts is None:
                    skipped.append({
                        'symbol': symbol,
                        'reason': f'under {min_train_days} days of TRAIN history (recent listing/rename?)',
                    })
                    continue
                clipped_train_start = jh.timestamp_to_date(clipped_train_start_ts)
                train_candles, train_warmup = _load_candles(exchange, symbol, timeframe, clipped_train_start, train_finish, warm_up_candles)
                test_candles, test_warmup = _load_candles(exchange, symbol, timeframe, test_start, test_finish, warm_up_candles)
                data[symbol] = (clipped_train_start, train_candles, train_warmup, test_candles, test_warmup)
            except Exception as e:  # noqa: BLE001 - one bad symbol must not abort the scan
                skipped.append({'symbol': symbol, 'reason': f'{type(e).__name__}: {e}'})

        storage.update_session(
            session_id, skipped=skipped,
            progress={'phase': 'load', 'done': len(symbols), 'total': len(symbols), 'current': None},
        )

        phases = []
        if run_fixed:
            phases.append('fixed')
        if run_optimize:
            phases.append('optimize')

        total_units = len(phases) * len(strategies) * len(data)
        done_units = 0
        cancelled = False

        if run_optimize and data:
            # One Ray cluster for the whole optimize phase: research.optimize() reuses
            # an already-initialized cluster instead of starting/stopping Ray for each
            # (strategy, symbol) unit - mirrors the reference universe_scan.py script.
            ray.init(num_cpus=cpu_cores, ignore_reinit_error=True, log_to_driver=False)
            ray_started_here = True

        for phase in phases:
            if cancelled:
                break
            for strategy in strategies:
                if cancelled:
                    break
                for symbol, (clipped_train_start, train_candles, train_warmup, test_candles, test_warmup) in data.items():
                    if storage.is_cancelled(session_id):
                        cancelled = True
                        break

                    storage.update_session(
                        session_id,
                        progress={'phase': phase, 'done': done_units, 'total': total_units, 'current': f'{strategy}/{symbol}'},
                    )

                    try:
                        train_bh = buy_hold_pct(train_candles[jh.key(exchange, symbol)]['candles'])
                        test_bh = buy_hold_pct(test_candles[jh.key(exchange, symbol)]['candles'])

                        if phase == 'fixed':
                            train_metrics = _backtest_unit(exchange, strategy, symbol, timeframe, balance, fee, warm_up_candles, train_candles, train_warmup)
                            test_metrics = _backtest_unit(exchange, strategy, symbol, timeframe, balance, fee, warm_up_candles, test_candles, test_warmup)
                            row = build_row(
                                phase, strategy, symbol, train_start=clipped_train_start,
                                train_metrics=train_metrics, train_bh_pct=train_bh,
                                test_metrics=test_metrics, test_bh_pct=test_bh,
                            )
                        else:  # phase == 'optimize'
                            opt = research.optimize(
                                config={
                                    'exchange': {'name': exchange, 'balance': balance, 'fee': fee, 'type': 'spot'},
                                    'warm_up_candles': warm_up_candles,
                                },
                                routes=[{'strategy': strategy, 'symbol': symbol, 'timeframe': timeframe}], data_routes=[],
                                training_candles=train_candles, training_warmup_candles=train_warmup,
                                testing_candles=test_candles, testing_warmup_candles=test_warmup,
                                trials=trials_per_hp, objective_function=objective_function,
                                optimal_total=optimal_total, best_candidates_count=1, cpu_cores=cpu_cores, progress_bar=False,
                            )
                            if opt['best_trials']:
                                hp = opt['best_trials'][0]['params']
                                train_metrics = _backtest_unit(exchange, strategy, symbol, timeframe, balance, fee, warm_up_candles, train_candles, train_warmup, hp)
                                test_metrics = _backtest_unit(exchange, strategy, symbol, timeframe, balance, fee, warm_up_candles, test_candles, test_warmup, hp)
                                row = build_row(
                                    phase, strategy, symbol, train_start=clipped_train_start, params=hp,
                                    train_metrics=train_metrics, train_bh_pct=train_bh,
                                    test_metrics=test_metrics, test_bh_pct=test_bh,
                                )
                            else:
                                row = build_row(
                                    phase, strategy, symbol, train_start=clipped_train_start,
                                    error='no valid candidate (<=5 trades or negative Sharpe on TRAIN)',
                                )
                    except Exception as e:  # noqa: BLE001 - one failing unit must not stop the scan
                        jh.debug(f'universe-scan {session_id}: {phase}/{strategy}/{symbol} failed: {type(e).__name__}: {e}')
                        row = build_row(phase, strategy, symbol, error=f'{type(e).__name__}: {e}')

                    rows.append(row)
                    done_units += 1
                    storage.update_session(
                        session_id, rows=rows,
                        progress={'phase': phase, 'done': done_units, 'total': total_units, 'current': f'{strategy}/{symbol}'},
                    )

        status = 'cancelled' if cancelled else 'done'
        storage.update_session(
            session_id, status=status, rows=rows, summary=summarize(rows),
            progress={'phase': phases[-1] if phases else None, 'done': done_units, 'total': total_units, 'current': None},
        )
        jh.debug(f'universe-scan {session_id}: {status} ({done_units}/{total_units} units)')
    except storage.SessionNotFoundError:
        # The session directory was deleted (e.g. via /delete) while this worker was
        # still writing to it - stop quietly instead of resurrecting a bare
        # session.json for an id the user explicitly removed (see update_session()'s
        # docstring). Treated as a clean stop, not an error.
        jh.debug(f'universe-scan {session_id}: session was deleted; stopping')
    except Exception as e:
        jh.debug(f'universe-scan {session_id} failed: {traceback.format_exc()}')
        try:
            storage.update_session(session_id, status='error', error=f'{type(e).__name__}: {e}', rows=rows, summary=summarize(rows))
        except storage.SessionNotFoundError:
            pass
    finally:
        # Shut down the shared Ray cluster on every exit path (success, error, or
        # cancellation) - never leave a lingering cluster from a killed/failed scan.
        if ray_started_here and ray.is_initialized():
            ray.shutdown()
