"""Regression fixture for the fast-mode daily-balance-sampling fix (commit e3c862fb).

Pure mechanical trading logic - no assertions here. This strategy exists only to
generate a chain of repeated round-trip trades over a long NSE daily-bars-only
session series, so `tests/test_india_daily_backtest.py::test_fast_mode_daily_balance_sampling_matches_step_mode`
can compare metrics/equity curves between `fast_mode=False` and `fast_mode=True`
runs of the *same* deterministic candles, per this repo's `test_fast_mode_equivalence`
precedent in `tests/test_real_strategy_regression.py` (a test-function-level
comparison, not the single-run strategy-hook-assertion pattern - see
`.claude/skills/jesse-strategy-tests/SKILL.md`'s "When NOT to use the
strategy-driven pattern").

On the test's strictly-rising-by-1-per-session close series, entering long whenever
flat and exiting via a fixed-offset take-profit produces one round trip every
OFFSET sessions, chained back-to-back (the exit fill and the next entry both land on
the same session) - dozens of trades over a long series, deterministically.
"""
from jesse.strategies import Strategy

# Sessions between entry and take-profit exit. On the test's close series (rising by
# 1/session), the exit always lands exactly OFFSET sessions after entry, and because
# the next entry re-opens on that same exit session, trades chain continuously.
OFFSET = 3
# Fixed buy size for every trade. Small enough that repeated entries at the test's
# rising prices (~100-260) stay well under the test's starting balance.
ENTRY_QTY = 100


class TestFastModeDailyBalanceSampling(Strategy):
    def should_long(self) -> bool:
        # Only ever invoked while flat (see Strategy._execute), so an unconditional
        # True keeps re-entering immediately after each take-profit exit.
        return True

    def go_long(self) -> None:
        self._entry_price = self.price
        self.buy = ENTRY_QTY, self.price

    def should_short(self) -> bool:
        return False

    def go_short(self) -> None:
        pass

    def should_cancel_entry(self) -> bool:
        return False

    def on_open_position(self, order) -> None:
        self.take_profit = self.position.qty, self._entry_price + OFFSET
