"""Story #67 (dev-pmallapp/jesse#67): Monday-aligned 1W candles on daily-bars-only
(NSE/BSE-style) exchanges.

Covers, in order:
- `jh.timeframe_bucket_start` / `MONDAY_WEEK_OFFSET_MS` - the Monday-alignment math.
- `jesse.markets.india.is_trading_day` - the NSE/BSE session calendar.
- `backtest_mode._timestamp_bucket_generation_schedule`'s 1W release rule against
  synthetic NSE-shaped one-row-per-session series (holiday week, BCP Saturday week,
  final still-forming week, and a final week whose remaining days are all holidays).
- Crypto (non-daily-bars-only) 1W bucketing/release stays unchanged by default.
- An end-to-end NSE backtest with a 1W route - see
  `jesse/strategies/TestIndiaWeeklyCandlesBacktest/__init__.py` for the assertions
  (`.claude/skills/jesse-strategy-tests/SKILL.md`).
"""
from datetime import date, timedelta

import numpy as np
import pytest

import jesse.helpers as jh
from jesse import research
from jesse.constants import TIMEFRAME_TO_ONE_MINUTES
from jesse.enums import exchanges
from jesse.markets.india import COVERED_YEARS, is_trading_day, nse_trading_hours
from jesse.modes import backtest_mode
from jesse.services.historical_data.india.sessions import session_row_timestamp

# --------------------------------------------------------------------------------------
# jh.timeframe_bucket_start / MONDAY_WEEK_OFFSET_MS
# --------------------------------------------------------------------------------------


def test_timeframe_bucket_start_monday_aligns_1w_when_requested():
    # 2024-01-03 (Wed) 09:59 UTC session row falls in the Mon 1-Jan..Fri 5-Jan
    # trading week.
    ts = session_row_timestamp(date(2024, 1, 3))
    aligned = jh.timeframe_bucket_start(ts, '1W', monday_weeks=True)
    bucket = jh.timestamp_to_arrow(aligned)
    assert bucket.format('YYYY-MM-DD') == '2024-01-01'
    assert bucket.format('dddd') == 'Monday'


def test_timeframe_bucket_start_defaults_to_thursday_anchored_1w():
    # Unchanged crypto-default behavior: epoch-anchored, not Monday-aligned.
    ts = session_row_timestamp(date(2024, 1, 3))
    default = jh.timeframe_bucket_start(ts, '1W')
    explicit_false = jh.timeframe_bucket_start(ts, '1W', monday_weeks=False)
    assert default == explicit_false
    bucket = jh.timestamp_to_arrow(default)
    assert bucket.format('YYYY-MM-DD') == '2023-12-28'
    assert bucket.format('dddd') == 'Thursday'


def test_timeframe_bucket_start_accepts_scalar_and_array_int64():
    ts = session_row_timestamp(date(2024, 1, 3))
    scalar = jh.timeframe_bucket_start(ts, '1W', monday_weeks=True)
    arr = jh.timeframe_bucket_start(np.array([ts, ts + 86_400_000], dtype=np.int64), '1W', monday_weeks=True)
    assert isinstance(scalar, int)
    assert isinstance(arr, np.ndarray)
    assert (arr == scalar).all()


@pytest.mark.parametrize('timeframe', ['1m', '1h', '4h', '1D', '3D'])
def test_timeframe_bucket_start_is_identical_with_and_without_monday_weeks_for_non_1w(timeframe):
    ts = session_row_timestamp(date(2024, 1, 3))
    assert jh.timeframe_bucket_start(ts, timeframe, monday_weeks=True) == \
        jh.timeframe_bucket_start(ts, timeframe, monday_weeks=False)


# --------------------------------------------------------------------------------------
# jesse.markets.india.is_trading_day
# --------------------------------------------------------------------------------------


def test_is_trading_day_normal_weekday():
    assert is_trading_day(date(2024, 3, 26)) is True  # Tue, regular session


def test_is_trading_day_weekend():
    assert is_trading_day(date(2024, 3, 24)) is False  # Sun


def test_is_trading_day_holiday_holi():
    assert is_trading_day(date(2024, 3, 25)) is False  # Holi - NSE_HOLIDAYS[2024]


def test_is_trading_day_holiday_good_friday():
    assert is_trading_day(date(2024, 3, 29)) is False  # Good Friday - NSE_HOLIDAYS[2024]


def test_is_trading_day_bcp_saturday_counts_as_a_trading_day():
    assert is_trading_day(date(2024, 1, 20)) is True  # SEBI BCP live-trading Saturday


def test_is_trading_day_falls_back_to_plain_mon_fri_outside_covered_years():
    year = min(COVERED_YEARS) - 1
    assert is_trading_day(date(year, 1, 1)) is True  # a Friday, no holiday data for this year
    assert is_trading_day(date(year, 1, 3)) is False  # a Sunday


# --------------------------------------------------------------------------------------
# backtest_mode._timestamp_bucket_generation_schedule: 1W release rule
# --------------------------------------------------------------------------------------

_GENERATING_1W = [('1W', TIMEFRAME_TO_ONE_MINUTES['1W'])]


def _session_candles(sessions: list) -> np.ndarray:
    """A minimal valid observed-1m-row-per-session array; OHLCV values are irrelevant
    to the schedule/release logic under test, only the timestamps matter.
    """
    return np.array([
        [session_row_timestamp(d), 1.0, 1.0, 1.0, 1.0, 1.0]
        for d in sessions
    ])


def test_1w_schedule_release_over_a_multi_week_nse_series_with_a_final_partial_week():
    # Week 1 (Mon 2024-01-15..Sat 2024-01-20): a plain week plus the SEBI BCP Saturday
    # session. Week 2 (Mon 2024-03-25, Holi/Good-Friday holiday week): only Tue 26 -
    # Thu 28 traded. Week 3 (Mon 2024-04-01): only Mon 1/Tue 2 built here, deliberately
    # stopping mid-week - Wed 3/Thu 4/Fri 5 are ordinary (non-holiday) NSE sessions per
    # the real calendar, so this final bucket is genuinely still forming.
    sessions = [
        date(2024, 1, 15), date(2024, 1, 16), date(2024, 1, 17),
        date(2024, 1, 18), date(2024, 1, 19), date(2024, 1, 20),
        date(2024, 3, 26), date(2024, 3, 27), date(2024, 3, 28),
        date(2024, 4, 1), date(2024, 4, 2),
    ]
    candles = _session_candles(sessions)
    schedule = backtest_mode._timestamp_bucket_generation_schedule(
        candles, _GENERATING_1W, daily_bars_only=True, exchange=exchanges.NSE,
    )

    releases = {index: updates[0][1] for index, updates in schedule.items()}
    bucket_starts = {
        start: jh.timeframe_bucket_start(int(candles[start, 0]), '1W', monday_weeks=True)
        for start in releases.values()
    }
    # Every bucket start is Monday 00:00 UTC.
    for start_index, bucket_start in bucket_starts.items():
        bucket = jh.timestamp_to_arrow(bucket_start)
        assert bucket.format('dddd') == 'Monday'
        assert bucket.format('HH:mm:ss') == '00:00:00'

    # release_index -> bucket start index. The Jan-15 week releases at Saturday's row
    # (index 5); the holiday week releases at Thursday 28 Mar's row (index 8); the
    # final partial week (start index 9) is not released at all.
    assert 5 in schedule and schedule[5] == [('1W', 0)]
    assert 8 in schedule and schedule[8] == [('1W', 6)]
    assert not any(start == 9 for start in releases.values())
    assert len(schedule) == 2  # only the two completed weeks were released


def test_1w_schedule_release_of_a_final_week_whose_remaining_days_are_all_holidays():
    # Same holiday week as above, but now it IS the literal final bucket in the
    # series. Its remaining calendar days (Fri 29 Good Friday, Sat 30, Sun 31) have no
    # session left, so `has_session_later_in_week` confirms the week is over and it
    # is released off its own last row despite being the final bucket.
    sessions = [
        date(2024, 1, 15), date(2024, 1, 16),
        date(2024, 3, 26), date(2024, 3, 27), date(2024, 3, 28),
    ]
    candles = _session_candles(sessions)
    schedule = backtest_mode._timestamp_bucket_generation_schedule(
        candles, _GENERATING_1W, daily_bars_only=True, exchange=exchanges.NSE,
    )

    # index 4 (Mar 28) is the last row overall, and its week's own release.
    assert 4 in schedule and schedule[4] == [('1W', 2)]
    assert len(schedule) == 2  # the Jan week (release at its own last row, index 1) too
    assert 1 in schedule and schedule[1] == [('1W', 0)]


# --------------------------------------------------------------------------------------
# Crypto (non-daily-bars-only) 1W bucketing/release stays unchanged
# --------------------------------------------------------------------------------------


def test_crypto_1w_schedule_release_rule_is_unchanged_by_default():
    # Eight consecutive UTC days spanning two Thursday-anchored (epoch-default) 1W
    # buckets: 2023-12-28..2024-01-03 (rows 0-2, Jan1-3) and 2024-01-04..01-10
    # (rows 3-7). `daily_bars_only` defaults False (the crypto/every-other-source
    # path), so release uses the original first-observed-availability rule, not the
    # daily-only own-row shortcut: bucket 0 releases at the first row whose event
    # time (candle_time + 60_000) reaches the next Thursday boundary, i.e. row 3
    # (Jan 4), not at its own last row (row 2).
    days = [date(2024, 1, 1) + timedelta(days=i) for i in range(8)]
    candles = np.array([
        [jh.date_to_timestamp(d.isoformat()), 1.0, 1.0, 1.0, 1.0, 1.0]
        for d in days
    ])
    schedule = backtest_mode._timestamp_bucket_generation_schedule(candles, _GENERATING_1W)

    assert schedule == {3: [('1W', 0)]}  # the second (final) bucket never gets a later row to release it
    bucket_start = jh.timeframe_bucket_start(int(candles[0, 0]), '1W')
    assert jh.timestamp_to_arrow(bucket_start).format('dddd') == 'Thursday'


# --------------------------------------------------------------------------------------
# End-to-end: NSE backtest with a 1W route
# --------------------------------------------------------------------------------------

SYMBOL = 'RELIANCE-INR'


def _sessions() -> list:
    """Must mirror TestIndiaWeeklyCandlesBacktest's `_sessions()` exactly."""
    holidays = set(nse_trading_hours(2024, 2024)['closed'])
    sessions = []
    d = date(2024, 1, 1)
    end = date(2024, 4, 30)
    while d <= end:
        if d.weekday() < 5 and d.isoformat() not in holidays:
            sessions.append(d)
        d += timedelta(days=1)
    return sessions


def _session_bar(i: int) -> tuple:
    """Must mirror TestIndiaWeeklyCandlesBacktest's `_session_bar()` exactly."""
    base = 100 + i * 10
    return base, base + 5, base + 8, base + 1, 50 + i


def _build_candles() -> np.ndarray:
    sessions = _sessions()
    rows = [
        [session_row_timestamp(d), *_session_bar(i)]
        for i, d in enumerate(sessions)
    ]
    return np.array(rows, dtype=np.float64)


def test_1w_route_backtest_sees_monday_aligned_correctly_aggregated_weekly_candles():
    candles_array = _build_candles()
    routes = [
        {'exchange': exchanges.NSE, 'symbol': SYMBOL, 'timeframe': '1W', 'strategy': 'TestIndiaWeeklyCandlesBacktest'},
    ]
    config = {
        'starting_balance': 1_000_000,
        'fee': 0,
        'type': 'spot',
        'exchange': exchanges.NSE,
        'warm_up_candles': 0,
    }
    candles = {
        jh.key(exchanges.NSE, SYMBOL): {
            'exchange': exchanges.NSE,
            'symbol': SYMBOL,
            'candles': candles_array,
        }
    }

    # All assertions live inside the strategy (jesse-strategy-tests convention); a
    # failed assertion raises and fails this test.
    research.backtest(config, routes, [], candles)
