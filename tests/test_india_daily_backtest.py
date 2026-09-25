"""Story #12: end-to-end daily-INR backtest on NSE over a sparse daily series.

Assertions about strategy/engine behavior (exchange currency, annualization,
candle-calendar correctness, trade PnL) live in the strategy's lifecycle hooks -
see `jesse/strategies/TestIndiaDailyInrBacktest/__init__.py` and
`.claude/skills/jesse-strategy-tests/SKILL.md`. This file only builds the sparse
1m-per-session candle series, runs it through `jesse.research.backtest`, and
checks the handful of things only observable from the returned result dict
(the store is reset before `research.backtest` returns).
"""
from datetime import date, timedelta

import numpy as np
import pytest

import jesse.helpers as jh
from jesse import research
from jesse.enums import exchanges
from jesse.exceptions import InvalidRoutes
from jesse.markets.india import nse_trading_hours
from jesse.services.historical_data.india.sessions import session_row_timestamp

SYMBOL = 'RELIANCE-INR'
# Deterministic rising close series: session i gets close price BASE_PRICE + i.
# All of OHLC are set equal to that price - a flat daily "point" bar - so a
# take-profit fires exactly on the session whose price matches the target,
# with no ambiguity from intra-day range.
BASE_PRICE = 100


def _nse_sessions(start: date, end: date) -> list:
    """Real 2024 NSE trading sessions (weekdays minus holidays) in [start, end]."""
    holidays = set(nse_trading_hours(start.year, end.year)['closed'])
    sessions = []
    d = start
    while d <= end:
        if d.weekday() < 5 and d.isoformat() not in holidays:
            sessions.append(d)
        d += timedelta(days=1)
    return sessions


def _build_candles() -> np.ndarray:
    sessions = _nse_sessions(date(2024, 1, 1), date(2024, 3, 31))
    rows = [
        [session_row_timestamp(d), BASE_PRICE + i, BASE_PRICE + i, BASE_PRICE + i, BASE_PRICE + i, 1]
        for i, d in enumerate(sessions)
    ]
    return np.array(rows, dtype=np.float64)


def _base_config() -> dict:
    # Deliberately no 'annualization' key: this proves the exchange's registered
    # default (252 for NSE) is what the engine ends up using.
    return {
        'starting_balance': 1_000_000,
        'fee': 0,
        'type': 'spot',
        'exchange': exchanges.NSE,
        'warm_up_candles': 0,
    }


def _candles_dict(candles_array: np.ndarray) -> dict:
    return {
        jh.key(exchanges.NSE, SYMBOL): {
            'exchange': exchanges.NSE,
            'symbol': SYMBOL,
            'candles': candles_array,
        }
    }


def test_india_daily_inr_backtest():
    candles_array = _build_candles()
    routes = [
        {'exchange': exchanges.NSE, 'symbol': SYMBOL, 'timeframe': '1D', 'strategy': 'TestIndiaDailyInrBacktest'},
    ]

    result = research.backtest(_base_config(), routes, [], _candles_dict(candles_array))

    # The strategy places exactly one trade (entry on the first session, take-profit
    # exit a fixed number of sessions later - see TestIndiaDailyInrBacktest).
    assert result['metrics']['total'] == 1
    if 'annualization' in result['metrics']:
        assert result['metrics']['annualization'] == 252


def test_india_daily_exchange_rejects_non_daily_timeframe():
    """NSE is daily_bars_only (story #8/#9): any non-1D route/timeframe is rejected."""
    candles_array = _build_candles()
    routes = [
        {'exchange': exchanges.NSE, 'symbol': SYMBOL, 'timeframe': '1h', 'strategy': 'TestIndiaDailyInrBacktest'},
    ]

    with pytest.raises(InvalidRoutes):
        research.backtest(_base_config(), routes, [], _candles_dict(candles_array))


def test_fast_mode_daily_balance_sampling_matches_step_mode():
    """Regression for commit e3c862fb (fix(backtest): sample daily equity on the same
    schedule in fast timestamp replay).

    Before that fix, `_timestamp_simulator`'s fast-mode balance-sample gate compared
    `(app.time - common_start) % cadence`, but on NSE/BSE session rows `app.time` is
    the row timestamp + 60s while `common_start` is a raw row timestamp, so the
    remainder was always 60s and only the initial and final balances were ever
    sampled - two points, from which Sharpe/Sortino/max_drawdown are NaN. This test
    fails on the parent commit (df2696c6) and passes on e3c862fb: it runs the same
    long NSE daily-bars-only series through `research.backtest` once per mode and
    asserts fast mode samples on the same per-session schedule as step mode, so both
    report identical, finite metrics.

    `TestFastModeDailyBalanceSampling` (see its module docstring) chains round-trip
    trades continuously across a strictly-rising 158-session close series, so both
    modes have real trades/returns to compute Sharpe & friends from - not vacuously
    equal NaNs.
    """
    sessions = _nse_sessions(date(2024, 1, 1), date(2024, 8, 31))
    warmup_sessions, trading_sessions = sessions[:5], sessions[5:]
    assert len(trading_sessions) > 100  # sanity: long enough series to chain >5 round trips

    warmup_array = np.array([
        [session_row_timestamp(d), BASE_PRICE + i, BASE_PRICE + i, BASE_PRICE + i, BASE_PRICE + i, 1]
        for i, d in enumerate(warmup_sessions)
    ], dtype=np.float64)
    # Trading prices continue the same rising-by-1 series right where warmup left off,
    # so the take-profit-chain logic in TestFastModeDailyBalanceSampling keeps holding.
    offset = len(warmup_sessions)
    trading_array = np.array([
        [session_row_timestamp(d), BASE_PRICE + offset + i, BASE_PRICE + offset + i,
         BASE_PRICE + offset + i, BASE_PRICE + offset + i, 1]
        for i, d in enumerate(trading_sessions)
    ], dtype=np.float64)

    routes = [
        {'exchange': exchanges.NSE, 'symbol': SYMBOL, 'timeframe': '1D',
         'strategy': 'TestFastModeDailyBalanceSampling'},
    ]
    config = {**_base_config(), 'warm_up_candles': 5}
    warmup_candles = {
        jh.key(exchanges.NSE, SYMBOL): {
            'exchange': exchanges.NSE,
            'symbol': SYMBOL,
            'candles': warmup_array,
        }
    }

    result_step = research.backtest(
        config, routes, [], _candles_dict(trading_array),
        warmup_candles=warmup_candles, fast_mode=False, generate_equity_curve=True,
    )
    result_fast = research.backtest(
        config, routes, [], _candles_dict(trading_array),
        warmup_candles=warmup_candles, fast_mode=True, generate_equity_curve=True,
    )

    # Real trading happened (chained round trips), not a vacuous zero-trade comparison.
    assert result_step['metrics']['total'] > 5
    assert result_fast['metrics']['total'] > 5

    # The bug: fast mode's Sharpe (and friends) came out NaN because only 2 daily
    # balances were ever sampled.
    assert np.isfinite(result_fast['metrics']['sharpe_ratio'])

    for key in (
        'total', 'net_profit', 'sharpe_ratio', 'sortino_ratio',
        'max_drawdown', 'annual_return',
    ):
        assert result_fast['metrics'][key] == pytest.approx(result_step['metrics'][key], nan_ok=False)

    # Same daily-balance-sample schedule in both modes: same count and same
    # timestamps, not just coincidentally-equal derived metrics.
    step_points = result_step['equity_curve'][0]['data']
    fast_points = result_fast['equity_curve'][0]['data']
    assert len(fast_points) == len(step_points)
    assert len(fast_points) > 2  # the bug's symptom was exactly 2 (initial + final)
    # Sampling is roughly once per session (not, e.g., only at start/end).
    assert len(fast_points) >= len(trading_sessions) * 0.5
    assert [p['time'] for p in fast_points] == [p['time'] for p in step_points]
