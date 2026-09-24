"""Exchange trading-calendar lookups used to decide when a 1W bucket may be released
on a daily-bars-only source (story #67; see
`jesse.modes.backtest_mode._timestamp_bucket_generation_schedule`).

Keeps the exchange -> calendar mapping in one place: NSE/BSE-style exchanges use the
real India trading calendar (holidays, BCP Saturdays, Muhurat evenings), imported
lazily so `import jesse` never loads `jesse.markets.india`/`jesse.india`. Every other
exchange (i.e. every crypto exchange, which trades every day of the week) falls back
to a plain Mon-Fri work week - harmless there since crypto routes never call this.
"""
import datetime

import jesse.helpers as jh

# Single place mapping an exchange to "uses the India NSE/BSE trading calendar".
_INDIA_CALENDAR_EXCHANGES = {'NSE', 'BSE'}


def _is_session_day(exchange: str, date: datetime.date) -> bool:
    if exchange in _INDIA_CALENDAR_EXCHANGES:
        # Lazy import: `jesse.markets.india` must stay off the `import jesse` path.
        from jesse.markets.india import is_trading_day
        return is_trading_day(date)
    return date.weekday() < 5


def has_session_later_in_week(exchange: str, timestamp: int) -> bool:
    """Whether `exchange` has a trading session strictly after `timestamp`'s UTC date,
    up to and including that Monday-aligned week's Sunday (see
    `jesse.helpers.timeframe_bucket_start`/`MONDAY_WEEK_OFFSET_MS`).

    Used to decide whether a 1W bucket's own last row can already stand in for the
    week's close (no later session remains) or whether the bucket is still forming.
    """
    row_date = jh.timestamp_to_arrow(timestamp).date()
    week_end = row_date + datetime.timedelta(days=6 - row_date.weekday())

    date = row_date + datetime.timedelta(days=1)
    while date <= week_end:
        if _is_session_day(exchange, date):
            return True
        date += datetime.timedelta(days=1)
    return False
