"""Story #12: end-to-end daily-INR backtest on NSE over a sparse daily series.

Exercised via `jesse.research.backtest` in
`tests/test_india_daily_backtest.py::test_india_daily_inr_backtest`, against a
one-1m-row-per-session series (`session_row_timestamp`, D3) covering real 2024
NSE trading sessions. All assertions live here, per this repo's strategy-driven
test convention (see `.claude/skills/jesse-strategy-tests/SKILL.md`).
"""
from datetime import datetime, timezone

from jesse.strategies import Strategy
import jesse.helpers as jh
from jesse.store import store
from jesse.markets.india import nse_trading_hours

# Matches the test file's config (`starting_balance`) so `before()` can assert the
# INR wallet starts unspent.
STARTING_BALANCE = 1_000_000
# Fixed buy size for the single trade this strategy places.
ENTRY_QTY = 10
# Sessions between entry and the take-profit exit. Small and independent of the
# calendar: the test file's close series rises by 1/session starting at some base
# price, so the exit always lands EXIT_OFFSET sessions after entry regardless of
# which calendar dates those sessions fall on.
EXIT_OFFSET = 7

# 2024 NSE holidays (ISO date strings), used to assert no candle exists on a
# holiday and to tell a holiday-extended gap apart from a plain weekend gap.
_HOLIDAYS_2024 = set(nse_trading_hours(2024, 2024)['closed'])


class TestIndiaDailyInrBacktest(Strategy):
    def before(self) -> None:
        if self.index == 0:
            assert self.exchange == 'NSE'
            exchange = store.exchanges.get_exchange(self.exchange)
            assert exchange.settlement_currency == 'INR'
            assert 'INR' in exchange.assets
            # self.balance (wallet_balance) is the INR settlement asset, untouched
            # before the first order is placed.
            assert self.balance == exchange.assets['INR'] == STARTING_BALANCE
            # Confirms the exchange's registered 252 default is what feeds the
            # metrics engine (jesse/services/metrics.py reads this same key), even
            # though the research config passed in never sets 'annualization'.
            assert jh.get_config('env.metrics.annualization') == 252

        ts = int(self.current_candle[0])
        # 1D buckets are plain UTC-midnight boundaries (epoch-anchored, 86_400_000 ms
        # divides evenly into a day) - see jesse/services/validators.py's
        # daily_bars_only comment. The importer's 09:59 UTC session row always falls
        # inside that same UTC calendar day, so the bucketed 1D candle's timestamp
        # lands exactly on that day's UTC midnight.
        assert ts % 86_400_000 == 0
        day = datetime.fromtimestamp(ts / 1000, tz=timezone.utc).date()
        assert day.weekday() < 5, f'{day} is a weekend but produced a candle'
        assert day.isoformat() not in _HOLIDAYS_2024, f'{day} is an NSE holiday but produced a candle'

        if not hasattr(self, '_seen_weekend_gap'):
            # Lazily initialized (instead of via __init__) to avoid overriding the
            # base class constructor the router relies on.
            self._seen_weekend_gap = False
            self._seen_holiday_gap = False
            self._prev_ts = None

        if self._prev_ts is not None:
            gap_days = (ts - self._prev_ts) // 86_400_000
            # Every consecutive pair of sessions must skip at least the same day.
            assert gap_days >= 1
            if gap_days == 3:
                # A plain Fri -> Mon weekend, no holiday involved.
                self._seen_weekend_gap = True
            elif gap_days > 3:
                # A holiday adjacent to (or bracketed by) a weekend, e.g.
                # 2024-01-19 (Fri) -> 2024-01-23 (Tue) around the 2024-01-22 holiday,
                # or 2024-01-25 (Thu) -> 2024-01-29 (Mon) around 2024-01-26.
                self._seen_holiday_gap = True
        self._prev_ts = ts

    def before_terminate(self) -> None:
        # getattr (not a plain attribute access): if before() never ran at all - e.g.
        # the engine never considered this 1D route "updated" - fail with an
        # assertion describing that, instead of an unrelated AttributeError.
        assert getattr(self, '_seen_weekend_gap', False), 'expected at least one plain weekend gap in the series'
        assert getattr(self, '_seen_holiday_gap', False), 'expected at least one holiday-extended gap in the series'
        # every observed candle is a distinct session (no duplicate/regenerated bar)
        timestamps = self.candles[:, 0]
        assert len(timestamps) == len(set(timestamps.tolist()))

    def should_long(self) -> bool:
        return self.index == 0

    def go_long(self) -> None:
        self._entry_price = self.price
        self.buy = ENTRY_QTY, self.price

    def go_short(self) -> None:
        pass

    def should_short(self) -> bool:
        return False

    def should_cancel_entry(self) -> bool:
        return False

    def on_open_position(self, order) -> None:
        self._target_price = self._entry_price + EXIT_OFFSET
        self.take_profit = self.position.qty, self._target_price

    def on_close_position(self, order, closed_trade) -> None:
        assert closed_trade.entry_price == self._entry_price
        assert closed_trade.exit_price == self._target_price
        assert closed_trade.qty == ENTRY_QTY
        assert closed_trade.type == 'long'
        assert closed_trade.fee == 0
        assert round(closed_trade.pnl, 8) == round(ENTRY_QTY * (self._target_price - self._entry_price), 8)
