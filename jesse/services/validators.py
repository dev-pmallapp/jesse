from jesse import exceptions
import jesse.helpers as jh
from jesse.services import logger

# Timeframes accepted on a "daily-bars-only" exchange (story #8; #9 sets the
# `daily_bars_only` flag on NSE/BSE-style India exchanges in `jesse.info.exchange_info`)
# - only 1D. Measured against how Jesse actually buckets 1m rows into higher timeframes
# (`candle_service.generate_candle_from_observed_minutes`/`generate_candle_from_one_minutes`:
# `bucket_start = timestamp - (timestamp % (timeframe_minutes * 60_000))`, i.e. every
# bucket boundary is anchored to the Unix epoch, 1970-01-01 00:00:00 UTC):
# - 1D's bucket width (86_400_000 ms) divides evenly into a UTC day, so 1D buckets are
#   plain UTC-midnight boundaries - and a session's stored row (09:59 UTC, D3) always
#   falls inside the correct IST trading day's UTC-midnight-to-midnight bucket. Allowed.
# - 1W's bucket width (604_800_000 ms, 7 days) is ALSO epoch-anchored - but the epoch
#   (1970-01-01) was a THURSDAY, so 1W buckets start every Thursday 00:00 UTC, not
#   Monday. A "weekly" India candle would silently span Thu-Wed instead of a real
#   Mon-Fri trading week (verified: session_row_timestamp(2024-01-03) buckets to
#   2023-12-28 00:00 UTC, a Thursday). Refused until a Monday-aligned weekly
#   aggregation exists for sparse-1m sources - tracked as a follow-up, not fixed here.
# - 3D is never allowed at all, for any exchange: a 3-day bucket walks across weekends
#   at an arbitrary phase and never lines up with any real exchange session structure.
DAILY_BARS_ONLY_ALLOWED_TIMEFRAMES = ('1D',)


def is_daily_bars_only(exchange: str) -> bool:
    """Whether `exchange` only ever stores one 1m row per trading session (D3) - reads
    the flag story #9 sets on NSE/BSE-style exchanges in `jesse.info.exchange_info`,
    defaulting to False (every crypto exchange today, and any exchange not yet
    registered there at all).
    """
    from jesse.info import exchange_info
    return bool(exchange_info.get(exchange, {}).get('daily_bars_only', False))


def validate_routes(router) -> None:
    if not router.routes:
        raise exceptions.InvalidRoutes(
            'No routes found. Please add at least one route at: routes.py\nMore info: https://docs.jesse.trade/docs/routes.html#routing')

    # validation for number of routes in the live mode
    if jh.is_live():
        if len(router.routes) > 10:
            logger.broadcast_error_without_logging('Too many routes (not critical, but use at your own risk): Using that more than 5 routes in live/paper trading is not recommended because exchange WS connections are often not reliable for handling that much traffic.')

    _validate_daily_bars_only_timeframes(router)


def _validate_daily_bars_only_timeframes(router) -> None:
    """Reject a trading or data route on a daily-bars-only exchange (story #8/#9) whose
    timeframe isn't one of `DAILY_BARS_ONLY_ALLOWED_TIMEFRAMES` - see that constant's
    comment for the bucket-alignment evidence behind which timeframes are safe. A
    crypto (or any non-daily-bars-only) exchange's routes are never touched here.
    """
    for route in list(router.routes) + list(router.data_routes):
        if not is_daily_bars_only(route.exchange):
            continue
        if route.timeframe not in DAILY_BARS_ONLY_ALLOWED_TIMEFRAMES:
            raise exceptions.InvalidRoutes(
                f'{route.exchange} only stores one daily bar per trading session, so timeframe '
                f'"{route.timeframe}" is not supported. Allowed timeframe(s): '
                f'{", ".join(DAILY_BARS_ONLY_ALLOWED_TIMEFRAMES)}.'
            )
