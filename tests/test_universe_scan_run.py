"""End-to-end coverage for `universe_scan_mode.run()` (dev-pmallapp/jesse#80).

`tests/test_universe_scan.py` covers the pure helpers, the file-based session store,
and `/universe-scan/start` request validation in isolation. This file drives the
actual `run()` worker function against synthetic NSE daily candles, entirely offline:

- `research.get_candles` is monkeypatched to slice an in-memory per-symbol candle
  series instead of hitting the DB/importer - the same seam
  `tests/test_india_daily_backtest.py` already builds its candles for (its
  `_nse_sessions`/`session_row_timestamp` helpers are reused here).
- `research.optimize` and `ray.init`/`is_initialized`/`shutdown` are monkeypatched for
  the optimize-phase test - running a real Optuna/Ray search here would be slow and
  flaky in CI; `run()`'s own dispatch/row-building around whatever `research.optimize`
  returns is what's under test, not Optuna's search itself.
- `research.backtest` runs for real (fast_mode) against a real test strategy
  (`TestFastModeDailyBalanceSampling`, already used by
  `tests/test_india_daily_backtest.py::test_fast_mode_daily_balance_sampling_matches_step_mode`)
  so the fixed-phase test also exercises the real engine end to end.
"""
from datetime import date

import numpy as np
import pytest

from jesse.enums import exchanges
from jesse.modes.universe_scan_mode import run as run_universe_scan
from jesse.modes.universe_scan_mode import storage
from tests.test_india_daily_backtest import _nse_sessions

import jesse.helpers as jh
from jesse import research
from jesse.services.historical_data.india.sessions import session_row_timestamp

STRATEGY = 'TestFastModeDailyBalanceSampling'

# Wide enough to give every symbol's synthetic history real sessions before
# data_start (for the warm-up buffer) and through test_finish.
_HISTORY_START = date(2022, 11, 1)
_HISTORY_END = date(2024, 1, 31)


def _build_full_history(base_price: float, start: date = _HISTORY_START, end: date = _HISTORY_END) -> np.ndarray:
    """A flat-OHLC, strictly-rising-by-1-per-session daily series (same row schema
    and shape as `tests/test_india_daily_backtest.py::_build_candles`)."""
    sessions = _nse_sessions(start, end)
    rows = [
        [session_row_timestamp(d), base_price + i, base_price + i, base_price + i, base_price + i, 1]
        for i, d in enumerate(sessions)
    ]
    return np.array(rows, dtype=np.float64)


def _fake_get_candles(full_history_by_symbol: dict):
    """Stand-in for `research.get_candles`: slices each symbol's full in-memory
    history by the requested window instead of querying the DB. Matches the real
    function's `(warmup, trading)` return shape.
    """
    empty = np.empty((0, 6), dtype=np.float64)

    def _get_candles(exchange, symbol, timeframe, start_date_timestamp, finish_date_timestamp,
                      warmup_candles_num=0, caching=False, is_for_jesse=False):
        full = full_history_by_symbol.get(symbol)
        if full is None or len(full) == 0:
            return empty, empty
        trading = full[(full[:, 0] >= start_date_timestamp) & (full[:, 0] <= finish_date_timestamp)]
        before = full[full[:, 0] < start_date_timestamp]
        warmup = before[-warmup_candles_num:] if warmup_candles_num else empty
        return warmup, trading

    return _get_candles


def _base_config(**overrides) -> dict:
    config = {
        'exchange': exchanges.NSE,
        'timeframe': '1D',
        'symbols': ['AAA-INR', 'BBB-INR'],
        'strategies': [STRATEGY],
        'data_start': '2023-01-01',
        'train_start': '2023-03-01',
        'train_finish': '2023-09-30',
        'test_start': '2023-10-01',
        'test_finish': '2023-12-31',
        'warm_up_candles': 5,
        'min_train_days': 30,
        'balance': 1_000_000,
        'fee': 0,
        'run_fixed': True,
        'run_optimize': False,
        'cpu_cores': 1,
    }
    config.update(overrides)
    return config


@pytest.fixture
def scan_cwd(tmp_path, monkeypatch):
    """`storage.*` paths are relative to cwd (see test_universe_scan.py's own
    `storage_cwd` fixture)."""
    monkeypatch.chdir(tmp_path)
    return tmp_path


def test_run_fixed_and_optimize_phases_complete_for_every_symbol(scan_cwd, monkeypatch):
    """Both phases x both symbols produce a row, a summary entry each, no errors,
    and progress reports done == total - the optimize phase's `research.optimize`
    (and Ray) are mocked; `research.backtest` (fixed phase, and the optimize phase's
    post-search re-backtest with the "winning" hp) run for real.
    """
    full_history = {
        'AAA-INR': _build_full_history(base_price=100),
        'BBB-INR': _build_full_history(base_price=200),
    }
    monkeypatch.setattr(research, 'get_candles', _fake_get_candles(full_history))

    def fake_optimize(*args, **kwargs):
        return {
            'best_trials': [{'params': {'fake_hp': 1}}],
            'total_trials': 1, 'completed_trials': 1, 'objective_function': 'sharpe',
        }
    monkeypatch.setattr(research, 'optimize', fake_optimize)

    import ray
    monkeypatch.setattr(ray, 'init', lambda *a, **k: None)
    monkeypatch.setattr(ray, 'is_initialized', lambda: True)
    monkeypatch.setattr(ray, 'shutdown', lambda: None)

    config = _base_config(run_optimize=True, trials_per_hp=2, optimal_total=5)
    storage.create_session('sess-both-phases', config)

    run_universe_scan('sess-both-phases', config)

    session = storage.read_session('sess-both-phases')
    assert session['status'] == 'done'
    assert session['error'] is None
    assert session['skipped'] == []

    rows = session['rows']
    assert len(rows) == 4  # 2 phases x 1 strategy x 2 symbols
    assert {(r['phase'], r['symbol']) for r in rows} == {
        ('fixed', 'AAA-INR'), ('fixed', 'BBB-INR'), ('optimize', 'AAA-INR'), ('optimize', 'BBB-INR'),
    }
    assert all('error' not in r for r in rows)
    optimize_rows = [r for r in rows if r['phase'] == 'optimize']
    assert all(r['params'] == {'fake_hp': 1} for r in optimize_rows)

    summary = session['summary']
    assert {s['phase'] for s in summary} == {'fixed', 'optimize'}
    assert all(s['errors'] == 0 for s in summary)

    progress = session['progress']
    assert progress['done'] == progress['total'] == 4


def test_run_skips_symbol_with_too_little_train_history(scan_cwd, monkeypatch):
    """A symbol listed too close to TEST is recorded in `skipped` with a reason
    (`clip_train_window` returning None - see helpers.py); the scan still completes
    and produces rows for the other symbol.
    """
    full_history = {
        # Normal history well before TRAIN.
        'AAA-INR': _build_full_history(base_price=100),
        # Starts only days before TEST - after the warm-up buffer clips TRAIN's start
        # forward, the resulting TRAIN window is far under min_train_days.
        'BBB-INR': _build_full_history(base_price=200, start=date(2023, 9, 25), end=_HISTORY_END),
    }
    monkeypatch.setattr(research, 'get_candles', _fake_get_candles(full_history))

    config = _base_config()
    storage.create_session('sess-skip', config)

    run_universe_scan('sess-skip', config)

    session = storage.read_session('sess-skip')
    assert session['status'] == 'done'
    assert session['error'] is None

    skipped = session['skipped']
    assert len(skipped) == 1
    assert skipped[0]['symbol'] == 'BBB-INR'
    assert 'min_train_days' not in skipped[0]['reason']  # sanity: message is human text, not the raw key
    assert 'TRAIN history' in skipped[0]['reason']

    rows = session['rows']
    assert len(rows) == 1
    assert rows[0]['symbol'] == 'AAA-INR'
    assert 'error' not in rows[0]


def test_run_records_error_on_one_failing_unit_and_continues(scan_cwd, monkeypatch):
    """A strategy that errors at runtime (here: doesn't exist at all, so
    `research.backtest` raises `InvalidRoutes`) records `error` on just that row;
    the other (strategy, symbol) unit still completes normally.
    """
    full_history = {'AAA-INR': _build_full_history(base_price=100)}
    monkeypatch.setattr(research, 'get_candles', _fake_get_candles(full_history))

    config = _base_config(symbols=['AAA-INR'], strategies=[STRATEGY, 'NoSuchStrategyXyz123'])
    storage.create_session('sess-error', config)

    run_universe_scan('sess-error', config)

    session = storage.read_session('sess-error')
    # One bad unit must not fail the whole scan.
    assert session['status'] == 'done'
    assert session['error'] is None

    rows = {r['strategy']: r for r in session['rows']}
    assert len(rows) == 2
    assert 'error' not in rows[STRATEGY]
    assert 'error' in rows['NoSuchStrategyXyz123']
    assert 'NoSuchStrategyXyz123' in rows['NoSuchStrategyXyz123']['error']

    progress = session['progress']
    assert progress['done'] == progress['total'] == 2


def test_run_cancellation_stops_after_current_unit_and_keeps_partial_rows(scan_cwd, monkeypatch):
    """Cooperative cancellation: the cancel marker appears (via the real
    `storage.request_cancel`) right after the first unit's row is written, so the
    worker's very next `is_cancelled()` poll stops it - status becomes 'cancelled'
    and the first unit's row is kept.
    """
    full_history = {
        'AAA-INR': _build_full_history(base_price=100),
        'BBB-INR': _build_full_history(base_price=200),
    }
    monkeypatch.setattr(research, 'get_candles', _fake_get_candles(full_history))

    session_id = 'sess-cancel'
    real_update_session = storage.update_session

    def fake_update_session(sid, **updates):
        result = real_update_session(sid, **updates)
        # Drop the cancel marker the instant the first unit's row has been persisted.
        if updates.get('rows') and len(updates['rows']) == 1:
            storage.request_cancel(sid)
        return result

    monkeypatch.setattr(storage, 'update_session', fake_update_session)

    config = _base_config()
    storage.create_session(session_id, config)

    run_universe_scan(session_id, config)

    session = storage.read_session(session_id)
    assert session['status'] == 'cancelled'
    assert len(session['rows']) == 1
    assert session['progress']['done'] == 1
    assert session['progress']['total'] == 2
