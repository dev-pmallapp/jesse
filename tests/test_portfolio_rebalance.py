"""Tests for jesse.research.portfolio_rebalance - the pure `simulate()` core, fed hand-built
price maps so every trade can be checked by hand (no database needed)."""
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

import pytest

from jesse.research import portfolio_rebalance
from jesse.research.portfolio_rebalance import simulate

D = date.fromisoformat


def sessions(start: str, finish: str, skip=()):
    """Weekdays between start and finish (inclusive), minus `skip` dates."""
    d, out = D(start), []
    while d <= D(finish):
        if d.weekday() < 5 and d.isoformat() not in skip:
            out.append(d)
        d += timedelta(days=1)
    return out


def series(days, price_fn):
    return [(d, price_fn(d)) for d in days]


def trades_by_date(result):
    return {r['date']: [(t['symbol'], t['side'], t['qty']) for t in r['trades']] for r in result['rebalances']}


def test_equal_weight_rebalance_hand_computed():
    # 2025-01-01 is a Wednesday. A doubles-ish and C halves on 01-16, the first scheduled
    # rebalance (start + 15 calendar days).
    days = sessions('2025-01-01', '2025-02-20')
    moved = D('2025-01-16')
    prices = {
        'A-INR': series(days, lambda d: 150.0 if d >= moved else 100.0),
        'B-INR': series(days, lambda d: 50.0),
        'C-INR': series(days, lambda d: 100.0 if d >= moved else 200.0),
    }
    r = simulate(prices, D('2025-01-01'), capital=3000, rebalance_days=15, fee=0.0)

    t = trades_by_date(r)
    # Day 0: 1000 each -> 10 A @100, 20 B @50, 5 C @200, no cash left.
    assert sorted(t['2025-01-01']) == [('A-INR', 'buy', 10), ('B-INR', 'buy', 20), ('C-INR', 'buy', 5)]
    # 01-16: value 1500+1000+500 = 3000, target 1000 -> A wants 6 (sell 4, +600 cash),
    # C wants 10 (buy 5 for 500). Sell happens before buy.
    assert t['2025-01-16'] == [('A-INR', 'sell', 4), ('C-INR', 'buy', 5)]
    # Later rebalances: 01-31 (Fri) and 02-15 (Sat -> Mon 02-17); prices flat, so no trades.
    assert list(t) == ['2025-01-01', '2025-01-16', '2025-01-31', '2025-02-17']
    assert t['2025-01-31'] == [] and t['2025-02-17'] == []

    assert r['final_holdings'] == {'A-INR': 6, 'B-INR': 20, 'C-INR': 10}
    assert r['equity_curve'][-1] == {'date': '2025-02-20', 'value': 3000.0, 'cash': 100.0}
    assert r['metrics']['n_rebalances'] == 3
    assert r['metrics']['total_fees'] == 0
    assert r['unaffordable'] == {}


def test_buy_and_hold_is_the_day0_basket_marked_to_market():
    days = sessions('2025-01-01', '2025-02-20')
    moved = D('2025-01-16')
    prices = {
        'A-INR': series(days, lambda d: 150.0 if d >= moved else 100.0),
        'C-INR': series(days, lambda d: 100.0 if d >= moved else 200.0),
    }
    r = simulate(prices, D('2025-01-01'), capital=2000, rebalance_days=15, fee=0.0)
    bh = r['buy_and_hold_equal_weight']
    assert bh['holdings'] == {'A-INR': 10, 'C-INR': 5}
    # Never rebalanced: 10*150 + 5*100 at the end.
    assert bh['equity_curve'][-1]['value'] == 2000.0
    assert bh['metrics']['total_return_pct'] == 0.0
    # Rebalanced portfolio differs: sold 3 A (-> 1000/150 = 6.67 -> 6), bought C.
    assert r['final_holdings'] != bh['holdings']


def test_unaffordable_stock_is_skipped_and_money_stays_cash():
    days = sessions('2025-01-01', '2025-01-10')
    prices = {'A-INR': series(days, lambda d: 100.0), 'B-INR': series(days, lambda d: 500.0)}
    r = simulate(prices, D('2025-01-01'), capital=300, rebalance_days=15, fee=0.0)
    # Target 150 each: 1 A, 0 B (one share costs 500).
    assert r['final_holdings'] == {'A-INR': 1}
    assert r['unaffordable'] == {'B-INR': 500.0}
    assert r['equity_curve'][0]['cash'] == 200.0


def test_fees_never_push_cash_negative():
    days = sessions('2025-01-01', '2025-01-10')
    r = simulate({'A-INR': series(days, lambda d: 100.0)}, D('2025-01-01'), capital=1000, fee=0.01)
    # Target wants 10 shares, but 10 * 101 > 1000 with the fee -> 9 shares, 1000 - 909 = 91.
    assert r['final_holdings'] == {'A-INR': 9}
    assert r['equity_curve'][0]['cash'] == pytest.approx(91.0)
    assert r['metrics']['total_fees'] == pytest.approx(9.0)
    assert all(p['cash'] >= 0 for p in r['equity_curve'])


def test_short_cash_buys_largest_shortfall_first():
    # Fee makes cash short on day 0: both want 5 shares @100 (500 each of 1000); with a 1%
    # fee only 9 shares fit. Equal shortfall -> tie broken by symbol, so A gets 5, B 4.
    days = sessions('2025-01-01', '2025-01-03')
    prices = {'B-INR': series(days, lambda d: 100.0), 'A-INR': series(days, lambda d: 100.0)}
    r = simulate(prices, D('2025-01-01'), capital=1000, fee=0.01)
    assert r['final_holdings'] == {'A-INR': 5, 'B-INR': 4}


def test_weekend_schedule_rolls_forward_and_collapses():
    # Start Fri 2025-01-03, rebalance daily: Sat/Sun/Mon schedules all land on Mon 01-06,
    # which must rebalance exactly once.
    days = sessions('2025-01-03', '2025-01-08')
    r = simulate({'A-INR': series(days, lambda d: 100.0)}, D('2025-01-03'), capital=1000, rebalance_days=1, fee=0.0)
    dates = [x['date'] for x in r['rebalances']]
    assert dates == ['2025-01-03', '2025-01-06', '2025-01-07', '2025-01-08']


def test_holiday_on_schedule_rolls_to_next_session():
    days = sessions('2025-01-01', '2025-01-24', skip={'2025-01-16', '2025-01-17'})
    r = simulate({'A-INR': series(days, lambda d: 100.0)}, D('2025-01-01'), capital=1000, rebalance_days=15, fee=0.0)
    assert [x['date'] for x in r['rebalances']] == ['2025-01-01', '2025-01-20']


def test_symbol_without_price_on_rebalance_day_is_left_untouched():
    days = sessions('2025-01-01', '2025-01-20')
    moved = D('2025-01-16')
    prices = {
        'A-INR': series(days, lambda d: 200.0 if d >= moved else 100.0),
        'B-INR': series(days, lambda d: 100.0),
        # C is suspended on the rebalance day.
        'C-INR': [(d, 100.0) for d in days if d != moved],
    }
    r = simulate(prices, D('2025-01-01'), capital=3000, rebalance_days=15, fee=0.0)
    t = trades_by_date(r)
    # Day 0: 10 each. 01-16: pool = A 2000 + B 1000 (C excluded) -> 1500 each:
    # A sells 3 (desired 7), B buys 5 (desired 15); C untouched at 10.
    assert t['2025-01-16'] == [('A-INR', 'sell', 3), ('B-INR', 'buy', 5)]
    assert r['final_holdings']['C-INR'] == 10


def test_validation_errors():
    days = sessions('2025-01-01', '2025-01-03')
    with pytest.raises(ValueError):
        simulate({'A-INR': series(days, lambda d: 1.0)}, D('2025-01-01'), capital=0)
    with pytest.raises(ValueError):
        simulate({'A-INR': series(days, lambda d: 1.0)}, D('2025-01-01'), capital=10, rebalance_days=0)
    with pytest.raises(ValueError):
        portfolio_rebalance('2025-01-01', '2025-02-01')  # neither symbols nor universe


def test_import_jesse_research_still_does_not_load_india_modules():
    """portfolio_rebalance is exported from jesse.research, which must stay India-free at
    import time (see jesse/research/universes.py); check in a fresh interpreter."""
    result = subprocess.run(
        [
            sys.executable, '-c',
            "import jesse.research, sys; "
            "assert 'jesse.services.historical_data.india' not in sys.modules; "
            "assert 'jesse.markets.india' not in sys.modules",
        ],
        cwd=str(Path(__file__).resolve().parents[1]),
        capture_output=True, text=True, timeout=60,
    )
    assert result.returncode == 0, result.stderr
