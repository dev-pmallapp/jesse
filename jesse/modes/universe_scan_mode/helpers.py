"""Pure, offline-testable helpers for `universe_scan_mode` (dev-pmallapp/jesse#80).

Nothing in this module touches `research.*`, the filesystem, Ray, or any network/DB
call - `run()` in `__init__.py` owns all of that side-effecting work. Keeping symbol
resolution, window clipping, metric extraction, row building and summarising as plain
functions of their inputs makes them cheap to unit test without mocking Jesse's candle
store, an NSE universe fetch, or a real backtest.
"""
import math
import statistics
from typing import Dict, List, Optional, Tuple

from jesse.services.symbol_input import normalize_symbol

DAY_MS = 86_400_000

# The reference `universe_scan.py` script used a fixed 320-calendar-day buffer for a
# 210-session warm-up (~52 weeks of trading days, plus slack for NSE holidays beyond
# plain weekends - see that script's `windows_for()`). Keeping the same ratio scales
# the buffer proportionally when a user picks a different warm_up_candles instead of
# hardcoding 320 regardless of warm-up length.
_WARMUP_SESSIONS_TO_CALENDAR_DAYS_RATIO = 320 / 210


def resolve_symbols(
        universe_symbols: Dict[str, Tuple[str, ...]],
        universe_used_current_members: Dict[str, bool],
        explicit_symbols: List[str],
        exchange: str,
) -> Tuple[List[str], bool]:
    """Union of every universe's symbols with the user's own explicit symbols,
    de-duplicated and sorted.

    Returns `(symbols, survivorship_warning)`. `survivorship_warning` is True whenever
    any universe's membership was resolved via `used_current_members=True` - i.e.
    TODAY's index membership is being backtested over past windows, which is biased
    toward stocks that already outperformed (see `universe_scan.py`'s original BIAS
    WARNING docstring).
    """
    normalized_explicit = {normalize_symbol(exchange, s) for s in explicit_symbols}
    all_symbols = set(normalized_explicit)
    for symbols in universe_symbols.values():
        all_symbols.update(symbols)
    survivorship_warning = any(universe_used_current_members.values())
    return sorted(all_symbols), survivorship_warning


def clip_train_window(
        first_candle_timestamp: int,
        train_start_ts: int,
        train_finish_ts: int,
        warm_up_candles: int,
        min_train_days: int,
) -> Optional[int]:
    """Clip the TRAIN start to the symbol's own history and return the clipped
    timestamp, or None when the resulting TRAIN window would be under
    `min_train_days` (a recent listing/rename with too little runway before TEST).

    A stock that started trading (or was renamed into its current symbol) after the
    requested TRAIN start needs its warm-up candles to come from real data, not from
    before the series began - so TRAIN start is pushed forward to
    `first_candle_timestamp + warm-up buffer`, never earlier than requested.
    """
    buffer_days = math.ceil(warm_up_candles * _WARMUP_SESSIONS_TO_CALENDAR_DAYS_RATIO)
    earliest = first_candle_timestamp + buffer_days * DAY_MS
    clipped_start = max(train_start_ts, earliest)
    if train_finish_ts - clipped_start < min_train_days * DAY_MS:
        return None
    return clipped_start


def extract_metrics(metrics: dict) -> dict:
    """Flatten a `research.backtest()` metrics dict to the handful of fields the scan
    reports (matches `universe_scan.py`'s original `backtest()` helper). Every ratio
    is left at 0 rather than whatever research.backtest() defaults to when there were
    no trades, so an empty run reads as "no trades", not a stray non-zero metric.
    """
    total = metrics.get('total', 0)
    return {
        'trades': total,
        'win_rate': round(100 * metrics.get('win_rate', 0), 1) if total else 0,
        'pnl_pct': round(metrics.get('net_profit_percentage', 0), 2) if total else 0,
        'max_dd': round(metrics.get('max_drawdown', 0), 2) if total else 0,
        'sharpe': round(metrics.get('sharpe_ratio', 0), 2) if total else 0,
    }


def buy_hold_pct(candles) -> float:
    """Percent return of holding from the first to the last close in `candles`
    (Jesse's [timestamp, open, close, high, low, volume] row schema)."""
    close = candles[:, 2]
    return round(100 * (close[-1] / close[0] - 1), 2)


def build_row(
        phase: str,
        strategy: str,
        symbol: str,
        *,
        train_start: Optional[str] = None,
        params: Optional[dict] = None,
        train_metrics: Optional[dict] = None,
        train_bh_pct: Optional[float] = None,
        test_metrics: Optional[dict] = None,
        test_bh_pct: Optional[float] = None,
        error: Optional[str] = None,
) -> dict:
    """Assemble one result row.

    An `error` row only ever carries the identifying fields plus the error message -
    never partial/zeroed metrics - so `summarize()` can count it as a failure instead
    of accidentally treating missing metrics as real zeros.
    """
    row = {'phase': phase, 'strategy': strategy, 'symbol': symbol}
    if train_start is not None:
        row['train_start'] = train_start
    if params is not None:
        row['params'] = params
    if error is not None:
        row['error'] = error
        return row
    for key, value in (train_metrics or {}).items():
        row[f'train_{key}'] = value
    if train_bh_pct is not None:
        row['train_bh_pct'] = train_bh_pct
    for key, value in (test_metrics or {}).items():
        row[f'test_{key}'] = value
    if test_bh_pct is not None:
        row['test_bh_pct'] = test_bh_pct
    return row


def summarize(rows: List[dict]) -> List[dict]:
    """Per (phase, strategy) roll-up over the TEST window: stocks, pooled
    trade-weighted win rate, median pnl/B&H/sharpe, how many stocks beat their own
    buy & hold, and the error count - plus TRAIN medians for context.
    """
    groups: Dict[Tuple[str, str], List[dict]] = {}
    for row in rows:
        groups.setdefault((row['phase'], row['strategy']), []).append(row)

    summary = []
    for (phase, strategy), group in sorted(groups.items()):
        ok = [r for r in group if 'error' not in r and 'test_trades' in r]
        errors = len(group) - len(ok)

        if ok:
            trades = sum(r['test_trades'] for r in ok)
            # Trade-weighted win rate pools every trade across stocks, rather than
            # averaging each stock's win rate equally regardless of how many trades
            # it actually took.
            wins = sum(r['test_trades'] * r['test_win_rate'] / 100 for r in ok)
            win_rate_pct = round(100 * wins / trades, 1) if trades else 0.0
            beat_bh = sum(1 for r in ok if r['test_pnl_pct'] > r['test_bh_pct'])
            median_pnl_pct = round(statistics.median(r['test_pnl_pct'] for r in ok), 2)
            median_bh_pct = round(statistics.median(r['test_bh_pct'] for r in ok), 2)
            median_sharpe = round(statistics.median(r['test_sharpe'] for r in ok), 2)
            train_ok = [r for r in ok if 'train_pnl_pct' in r]
            median_train_pnl_pct = round(statistics.median(r['train_pnl_pct'] for r in train_ok), 2) if train_ok else None
            median_train_bh_pct = round(statistics.median(r['train_bh_pct'] for r in train_ok), 2) if train_ok else None
        else:
            trades = 0
            win_rate_pct = 0.0
            beat_bh = 0
            median_pnl_pct = median_bh_pct = median_sharpe = None
            median_train_pnl_pct = median_train_bh_pct = None

        summary.append({
            'phase': phase,
            'strategy': strategy,
            'stocks': len(ok),
            'trades': trades,
            'win_rate_pct': win_rate_pct,
            'median_pnl_pct': median_pnl_pct,
            'median_bh_pct': median_bh_pct,
            'beat_bh': beat_bh,
            'median_sharpe': median_sharpe,
            'median_train_pnl_pct': median_train_pnl_pct,
            'median_train_bh_pct': median_train_bh_pct,
            'errors': errors,
        })
    return summary
