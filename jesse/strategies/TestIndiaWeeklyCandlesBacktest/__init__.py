"""Story #67 (dev-pmallapp/jesse#67): end-to-end 1W backtest on NSE over real 2024
trading sessions, including the Holi/Good-Friday holiday week (2024-03-25..03-29).

Exercised via `jesse.research.backtest` in
`tests/test_india_weekly_candles.py::test_1w_route_backtest_sees_monday_aligned_correctly_aggregated_weekly_candles`,
against a one-1m-row-per-session series (`session_row_timestamp`) covering real 2024
NSE sessions. All assertions live here, per this repo's strategy-driven test
convention (see `.claude/skills/jesse-strategy-tests/SKILL.md`). This is an observer
strategy only - it never trades - so it can assert about every released weekly
candle without a position's lifecycle getting in the way.
"""
from datetime import date, datetime, timedelta, timezone

from jesse.strategies import Strategy
from jesse.markets.india import nse_trading_hours

# Must mirror the test file's `_build_candles()` construction exactly (session dates
# and per-session OHLCV formula) - see that function's docstring.
_START = date(2024, 1, 1)
_END = date(2024, 4, 30)
_HOLIDAYS_2024 = set(nse_trading_hours(2024, 2024)['closed'])


def _sessions() -> list:
    sessions = []
    d = _START
    while d <= _END:
        if d.weekday() < 5 and d.isoformat() not in _HOLIDAYS_2024:
            sessions.append(d)
        d += timedelta(days=1)
    return sessions


def _session_bar(i: int) -> tuple:
    """Deterministic, distinct-per-field OHLCV for session index `i` - open/close/
    high/low/volume are all different and all monotonically increasing with `i`, so
    a weekly aggregate can be checked against the week's first/last session index
    alone (see the strategy's `before()`).
    """
    base = 100 + i * 10
    return base, base + 5, base + 8, base + 1, 50 + i  # open, close, high, low, volume


_SESSIONS = _sessions()
_WEEKS: dict = {}
for _i, _d in enumerate(_SESSIONS):
    _week_start = _d - timedelta(days=_d.weekday())
    _WEEKS.setdefault(_week_start, []).append(_i)

# Holi (Mon 2024-03-25) / Good Friday (Fri 2024-03-29): only Tue 26 - Thu 28 traded.
_HOLIDAY_WEEK_START = date(2024, 3, 25)
# The last Monday-aligned week in the built range (2024-04-29..04-30, 2 sessions) -
# still-forming per the real NSE calendar (May 2/3 are ordinary trading days beyond
# `_END`), so it must never be released as a complete weekly candle (see
# `backtest_mode._timestamp_bucket_generation_schedule`'s 1W release rule).
_FINAL_WEEK_START = max(_WEEKS)


class TestIndiaWeeklyCandlesBacktest(Strategy):
    def before(self) -> None:
        ts = int(self.current_candle[0])
        candle_date = datetime.fromtimestamp(ts / 1000, tz=timezone.utc).date()
        assert ts % 86_400_000 == 0, f'{ts} is not UTC-midnight aligned'
        assert candle_date.weekday() == 0, f'{candle_date} is not a Monday'

        if not hasattr(self, '_seen_weeks'):
            self._seen_weeks = set()
        self._seen_weeks.add(candle_date)

        indices = _WEEKS.get(candle_date)
        assert indices is not None, f'unexpected weekly candle at {candle_date}'
        assert candle_date != _FINAL_WEEK_START, (
            'the final still-forming week must never be released as a complete candle'
        )

        open_i, _close_i, _high_i, _low_i, _volume_i = _session_bar(indices[0])
        _open_j, close_j, _high_j, _low_j, _volume_j = _session_bar(indices[-1])
        highs = [_session_bar(i)[2] for i in indices]
        lows = [_session_bar(i)[3] for i in indices]
        volumes = [_session_bar(i)[4] for i in indices]

        candle = self.current_candle
        assert candle[1] == open_i, 'weekly open must equal the first session of the week'
        assert candle[2] == close_j, 'weekly close must equal the last session of the week'
        assert candle[3] == max(highs), 'weekly high must be the max of the week'
        assert candle[4] == min(lows), 'weekly low must be the min of the week'
        assert candle[5] == sum(volumes), 'weekly volume must be the sum of the week'

        if candle_date == _HOLIDAY_WEEK_START:
            assert [_SESSIONS[i] for i in indices] == [date(2024, 3, 26), date(2024, 3, 27), date(2024, 3, 28)]
            self._checked_holiday_week = True

    def before_terminate(self) -> None:
        assert getattr(self, '_checked_holiday_week', False), 'holiday week candle was never observed'
        # Every completed week (every week except the still-forming final one) must
        # have produced exactly one weekly candle.
        expected_weeks = set(_WEEKS) - {_FINAL_WEEK_START}
        assert expected_weeks <= self._seen_weeks
        assert _FINAL_WEEK_START not in self._seen_weeks

    def should_long(self) -> bool:
        return False

    def go_long(self) -> None:
        pass

    def should_short(self) -> bool:
        return False

    def go_short(self) -> None:
        pass

    def should_cancel_entry(self) -> bool:
        return False
