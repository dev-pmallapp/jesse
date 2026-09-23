"""IST session-date <-> UTC-millisecond helpers for NSE/BSE daily-as-sparse-1m storage.

D3 in docs/india-markets/PLAN.md: each trading session is stored as ONE 1m candle
carrying the day's OHLCV, stamped at 15:29 IST (the last minute of the 15:30 close).
15:29 IST is 09:59 UTC, i.e. inside both the UTC calendar day and the trading session,
so the existing sparse-market engine aggregates it into correct 1D/1W candles without
any India-specific change to the replay/aggregation path.
"""
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from ..contracts import HistoricalCandleRange

IST = ZoneInfo('Asia/Kolkata')

# The minute the NSE/BSE cash session closes (15:30 IST); the row is stamped one
# minute earlier so it lands on a whole minute that is still inside the session.
_SESSION_CLOSE_HOUR = 15
_SESSION_CLOSE_MINUTE = 29


def session_row_timestamp(d: date) -> int:
    """UTC millisecond timestamp of 15:29 IST on trading session `d`."""
    session_close = datetime(d.year, d.month, d.day, _SESSION_CLOSE_HOUR, _SESSION_CLOSE_MINUTE, tzinfo=IST)
    # round() (not int()) avoids truncating a hair below the true millisecond from float error.
    return round(session_close.timestamp() * 1000)


def session_date(timestamp: int) -> date:
    """IST calendar date that a UTC millisecond timestamp falls on."""
    return _utc_datetime(timestamp).astimezone(IST).date()


def session_dates_in_range(requested_range: HistoricalCandleRange) -> list[date]:
    """Mon-Fri dates whose session-row timestamp falls inside the half-open UTC range.

    Holidays are not known here (no India holiday calendar is wired up yet) - a
    holiday's date is still returned and the source simply reports no bar for it.
    """
    # 15:29 IST never crosses a UTC day boundary (09:59 UTC same calendar day), so the
    # row timestamp for date `d` always falls on UTC calendar day `d`; a one-day pad on
    # each side keeps this correct even if that invariant is ever revisited.
    start_date = _utc_datetime(requested_range.start_timestamp).date() - timedelta(days=1)
    end_date = _utc_datetime(requested_range.end_timestamp).date() + timedelta(days=1)

    dates = []
    current = start_date
    while current <= end_date:
        if current.weekday() < 5:  # Monday=0 .. Sunday=6
            row_timestamp = session_row_timestamp(current)
            if requested_range.start_timestamp <= row_timestamp < requested_range.end_timestamp:
                dates.append(current)
        current += timedelta(days=1)
    return dates


def next_session_row_timestamp(after_timestamp: int) -> int:
    """First weekday session-row timestamp that is >= `after_timestamp`."""
    current = _utc_datetime(after_timestamp).date()
    while True:
        if current.weekday() < 5:
            row_timestamp = session_row_timestamp(current)
            if row_timestamp >= after_timestamp:
                return row_timestamp
        current += timedelta(days=1)


def _utc_datetime(timestamp: int) -> datetime:
    # Integer divmod (rather than timestamp / 1000) keeps this exact for large ms values,
    # where float division can drift by a millisecond.
    seconds, milliseconds = divmod(timestamp, 1000)
    return datetime.fromtimestamp(seconds, tz=timezone.utc) + timedelta(milliseconds=milliseconds)
