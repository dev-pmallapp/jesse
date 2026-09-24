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
