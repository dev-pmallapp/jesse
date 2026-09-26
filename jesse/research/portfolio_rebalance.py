"""Equal-weight, periodically rebalanced basket backtest (research mode).

Jesse's engine runs one strategy per route/symbol, each with its own balance, so a basket
that shares ONE cash pool across many stocks (e.g. the NIFTY200 Alpha 30 members) doesn't
fit a `Strategy` class. This module simulates that portfolio directly on daily closes:

- Day 0 (first session in the window): split `capital` equally across the symbols that
  have a price that day and buy whole shares only - `floor(target / close)`. A stock whose
  single share costs more than its target is simply not held; its money stays as cash.
- Every `rebalance_days` CALENDAR days from `start_date` (rolled forward to the first
  session on/after the scheduled date), bring the basket back to equal weight: sell the
  excess of stocks that rose above target first (raising cash), then top up the stocks
  below target, largest rupee shortfall first, as far as whole shares and cash allow.
- Fills are at that session's close, with a proportional `fee` on traded notional per
  side and no slippage - an illustrative cost model until real CNC costs land (#17).

`simulate()` is pure (price map in, result out) so it is unit-testable without a
database; `portfolio_rebalance()` only loads daily closes and calls it.

Import note: `jesse.research` must stay importable without loading the India package
(see `jesse/research/universes.py`); the universe lookup below goes through
`jesse.research.universes.universe`, which imports India lazily.
"""
import math
from datetime import date, timedelta
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np

import jesse.helpers as jh
from jesse.exceptions import CandleNotFoundInDatabase
from jesse.research.candles import get_candles
from jesse.services.symbol_input import normalize_symbol

# Trading sessions per year used to annualise the daily Sharpe ratio - matches the
# `annualization` Jesse's NSE/BSE exchange_info declares (jesse/info.py).
SESSIONS_PER_YEAR = 252

PriceSeries = Sequence[Tuple[date, float]]


def portfolio_rebalance(
        start_date: str,
        finish_date: str,
        symbols: Optional[List[str]] = None,
        universe: Optional[str] = None,
        exchange: str = 'NSE',
        capital: float = 15_000,
        rebalance_days: int = 15,
        fee: float = 0.001,
        benchmark: Optional[str] = None,
) -> dict:
    """Backtest an equal-weight basket rebalanced every `rebalance_days` calendar days.

    Pass exactly one of `symbols` (bare tickers like `RELIANCE` are accepted) or
    `universe` (an NSE index name such as `'NIFTY200 ALPHA 30'`, resolved to its CURRENT
    membership - hence `survivorship_warning` in the result). Daily candles must already
    be imported for every symbol over the window. See the module docstring for the rules
    and `simulate()` for the result shape.
    """
    if (symbols is None) == (universe is None):
        raise ValueError('Pass exactly one of `symbols` or `universe`.')
    if universe is not None:
        from jesse.research.universes import universe as resolve_universe
        symbols = list(resolve_universe(universe).symbols)
    symbols = sorted({normalize_symbol(exchange, s) for s in symbols})

    start, finish = _parse_date(start_date), _parse_date(finish_date)
    prices = {s: _load_closes(exchange, s, start, finish) for s in symbols}
    missing = [s for s, series in prices.items() if not series]
    if missing:
        raise ValueError(
            f'No daily candles for {", ".join(missing)} between {start_date} and {finish_date} '
            f'on {exchange} - import them first.'
        )

    result = simulate(prices, start, capital=capital, rebalance_days=rebalance_days, fee=fee)
    result['survivorship_warning'] = universe is not None
    result['config'] = {
        'exchange': exchange, 'universe': universe, 'symbols': symbols,
        'start_date': start_date, 'finish_date': finish_date, 'capital': capital,
        'rebalance_days': rebalance_days, 'fee': fee, 'benchmark': benchmark,
    }
    if benchmark is not None:
        bench_symbol = normalize_symbol(exchange, benchmark)
        result['benchmark'] = _benchmark_curve(
            _load_closes(exchange, bench_symbol, start, finish), result['equity_curve'], capital, bench_symbol,
        )
    return result


def simulate(
        prices: Dict[str, PriceSeries],
        start_date: date,
        capital: float,
        rebalance_days: int = 15,
        fee: float = 0.001,
) -> dict:
    """Run the equal-weight rebalance on a `{symbol: [(session_date, close), ...]}` map.

    Returns `equity_curve` [{date, value, cash}], `rebalances` [{date, value_before,
    trades, cash_after}] (day 0's initial purchase is the first entry), `final_holdings`,
    `unaffordable` (never held because one share cost more than the target), `metrics`
    and `buy_and_hold_equal_weight` (the day-0 purchase held without rebalancing).
    """
    if capital <= 0:
        raise ValueError('capital must be positive')
    if rebalance_days < 1:
        raise ValueError('rebalance_days must be at least 1')

    closes = {s: {d: float(c) for d, c in series if d >= start_date} for s, series in prices.items()}
    calendar = sorted({d for by_date in closes.values() for d in by_date})
    if not calendar:
        raise ValueError('No prices on or after start_date.')
    day0 = calendar[0]
    rebalance_sessions = _rebalance_sessions(calendar, start_date, rebalance_days)

    qty = {s: 0 for s in closes}
    last_close: Dict[str, float] = {}
    cash = float(capital)
    rebalances, equity_curve = [], []
    ever_held = set()
    first_price: Dict[str, float] = {}
    bh_qty: Dict[str, int] = {}
    bh_cash = 0.0
    bh_curve = []

    for session in calendar:
        today = {s: by_date[session] for s, by_date in closes.items() if session in by_date}
        last_close.update(today)
        for s, p in today.items():
            first_price.setdefault(s, p)

        if session == day0 or session in rebalance_sessions:
            value_before = cash + sum(qty[s] * last_close[s] for s in qty if s in last_close)
            cash, trades = _rebalance(qty, today, cash, fee)
            rebalances.append({
                'date': session.isoformat(), 'value_before': value_before,
                'trades': trades, 'cash_after': cash,
            })
            if session == day0:
                # Buy & hold benchmark = exactly the day-0 basket, never traded again.
                bh_qty, bh_cash = dict(qty), cash

        ever_held.update(s for s, q in qty.items() if q > 0)
        value = cash + sum(q * last_close[s] for s, q in qty.items() if q)
        equity_curve.append({'date': session.isoformat(), 'value': value, 'cash': cash})
        bh_value = bh_cash + sum(q * last_close[s] for s, q in bh_qty.items() if q)
        bh_curve.append({'date': session.isoformat(), 'value': bh_value, 'cash': bh_cash})

    traded_notional = sum(t['notional'] for r in rebalances for t in r['trades'])
    total_fees = sum(t['fee'] for r in rebalances for t in r['trades'])
    return {
        'equity_curve': equity_curve,
        'rebalances': rebalances,
        'final_holdings': {s: q for s, q in qty.items() if q},
        'unaffordable': {s: first_price[s] for s in sorted(closes) if s not in ever_held and s in first_price},
        'metrics': {
            **_curve_metrics(equity_curve, capital),
            # Day 0's initial purchase is not a rebalance.
            'n_rebalances': len(rebalances) - 1,
            'total_fees': total_fees,
            'turnover': traded_notional / float(np.mean([p['value'] for p in equity_curve])),
            'avg_cash_pct': 100 * float(np.mean([p['cash'] / p['value'] for p in equity_curve])),
        },
        'buy_and_hold_equal_weight': {
            'equity_curve': bh_curve,
            'holdings': {s: q for s, q in bh_qty.items() if q},
            'metrics': _curve_metrics(bh_curve, capital),
        },
    }


def _rebalance(qty: Dict[str, int], today: Dict[str, float], cash: float, fee: float) -> Tuple[float, list]:
    """Bring the symbols priced `today` back to equal weight; mutates `qty`, returns (cash, trades).

    A symbol without a close today (suspended / not yet listed) keeps its position
    untouched and is left out of both the pool value and N - its last close is stale,
    so trading or sizing against it would be guesswork.
    """
    active = sorted(today)
    if not active:
        return cash, []
    pool = cash + sum(qty[s] * today[s] for s in active)
    target = pool / len(active)
    desired = {s: math.floor(target / today[s]) for s in active}

    trades = []
    # Sells first so the cash they raise is available for the buys below.
    for s in active:
        if qty[s] > desired[s]:
            n = qty[s] - desired[s]
            notional = n * today[s]
            cash += notional - notional * fee
            qty[s] -= n
            trades.append(_trade(s, 'sell', n, today[s], fee))

    # Buys: largest rupee shortfall first, whole shares only, never letting cash go
    # negative once the fee is included (a short buy just leaves the rest as cash).
    shortfalls = sorted(
        (s for s in active if desired[s] > qty[s]),
        key=lambda s: (-(desired[s] - qty[s]) * today[s], s),
    )
    for s in shortfalls:
        affordable = math.floor(cash / (today[s] * (1 + fee)))
        n = min(desired[s] - qty[s], affordable)
        if n <= 0:
            continue
        cash -= n * today[s] * (1 + fee)
        qty[s] += n
        trades.append(_trade(s, 'buy', n, today[s], fee))
    # Guard against float dust from repeated fee arithmetic.
    return max(cash, 0.0), trades


def _trade(symbol: str, side: str, n: int, price: float, fee: float) -> dict:
    notional = n * price
    return {'symbol': symbol, 'side': side, 'qty': n, 'price': price, 'notional': notional, 'fee': notional * fee}


def _rebalance_sessions(calendar: List[date], start_date: date, rebalance_days: int) -> set:
    """Map each scheduled date `start + k*rebalance_days` (k >= 1) to the first session
    on/after it. Several scheduled dates landing on one session rebalance only once, and
    none may coincide with day 0 (the initial purchase)."""
    sessions = set()
    scheduled = start_date + timedelta(days=rebalance_days)
    i = 0
    while scheduled <= calendar[-1]:
        while calendar[i] < scheduled:
            i += 1
        if calendar[i] != calendar[0]:
            sessions.add(calendar[i])
        scheduled += timedelta(days=rebalance_days)
    return sessions


def _curve_metrics(curve: List[dict], capital: float) -> dict:
    values = np.array([p['value'] for p in curve], dtype=float)
    first, last = date.fromisoformat(curve[0]['date']), date.fromisoformat(curve[-1]['date'])
    years = max((last - first).days, 1) / 365.25
    returns = np.diff(values) / values[:-1] if len(values) > 1 else np.array([])
    std = float(np.std(returns, ddof=1)) if len(returns) > 1 else 0.0
    peak = np.maximum.accumulate(values)
    return {
        'final_value': float(values[-1]),
        'total_return_pct': 100 * (values[-1] / capital - 1),
        'cagr_pct': 100 * ((values[-1] / capital) ** (1 / years) - 1),
        'max_drawdown_pct': 100 * float(np.min(values / peak - 1)),
        'sharpe': float(np.mean(returns)) / std * math.sqrt(SESSIONS_PER_YEAR) if std > 0 else 0.0,
    }


def _benchmark_curve(series: PriceSeries, equity_curve: List[dict], capital: float, symbol: str) -> dict:
    """The benchmark's close, rescaled to `capital` at the portfolio's day 0 and sampled on
    the portfolio's own session calendar (carrying the last close over any gap)."""
    by_date = dict(series)
    curve, last = [], None
    base = None
    for point in equity_curve:
        d = date.fromisoformat(point['date'])
        last = by_date.get(d, last)
        if last is None:
            continue
        base = base or last
        curve.append({'date': point['date'], 'value': capital * last / base, 'cash': 0.0})
    if not curve:
        return {'symbol': symbol, 'equity_curve': [], 'metrics': {}}
    return {'symbol': symbol, 'equity_curve': curve, 'metrics': _curve_metrics(curve, capital)}


def _load_closes(exchange: str, symbol: str, start: date, finish: date) -> List[Tuple[date, float]]:
    """Daily `(session_date, close)` pairs; empty when nothing is imported, so the caller
    can report every missing symbol at once instead of failing on the first."""
    try:
        _, candles = get_candles(
            exchange, symbol, '1D',
            jh.date_to_timestamp(start.isoformat()), jh.date_to_timestamp(finish.isoformat()),
            is_for_jesse=True,
        )
    except CandleNotFoundInDatabase:
        return []
    return [(date.fromisoformat(jh.timestamp_to_date(int(c[0]))), float(c[2])) for c in candles]


def _parse_date(value: str) -> date:
    return date.fromisoformat(value)
