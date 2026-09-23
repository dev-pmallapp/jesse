"""Bridges a pluggable `IndiaDailySource` (NSE/BSE archive or broker) into Jesse's
generic `HistoricalCandleProvider` contract, per D1/D3 in docs/india-markets/PLAN.md.

Not registered anywhere yet: exchange registration (`jesse/info.py`,
`jesse/modes/import_candles_mode/drivers/__init__.py`) is stories #8/#9.
"""
from ..contracts import (
    HistoricalCandle,
    HistoricalCandleBatch,
    HistoricalCandleProvider,
    HistoricalCandleRequest,
    ProviderCapabilities,
)
from .sessions import next_session_row_timestamp, session_dates_in_range, session_row_timestamp
from .sources import IndiaDailySource, create_source
from .symbols import to_exchange_ticker

# import_candles_mode requires a finite max_candles_per_request (it raises ValueError
# otherwise - see jesse/modes/import_candles_mode/__init__.py:~274). Expressed as one
# calendar month of 1m slots, matching the existing crypto providers' pattern, even
# though these sources only ever produce one candle per session: with one row per
# session, a "page" of this size holds at most ~23 real candles (one per trading day
# in the month). Actual importer paging against this sparse-1m-per-session shape is
# revisited in story #8.
INDIA_MAX_CANDLES_PER_REQUEST = 31 * 24 * 60


class IndiaExchangeProvider(HistoricalCandleProvider):
    """One NSE/BSE-style exchange, backed by whichever `IndiaDailySource` it is given.

    Every trading session is stored as a single 1m candle stamped at 15:29 IST (D3):
    the sparse-market engine already aggregates isolated 1m rows into correct 1D/1W
    candles, so no India-specific replay/aggregation change is needed.
    """

    capabilities = ProviderCapabilities(
        native_timeframes=('1m',),
        max_candles_per_request=INDIA_MAX_CANDLES_PER_REQUEST,
    )

    def __init__(self, exchange: str, source: IndiaDailySource | None = None) -> None:
        self._source = source if source is not None else create_source(exchange)
        self.provider_id = exchange
        self.source_id = self._source.source_id
        self.prices_adjusted = self._source.prices_adjusted

    def _fetch_candles(self, request: HistoricalCandleRequest) -> HistoricalCandleBatch:
        ticker = to_exchange_ticker(request.symbol)
        sessions = session_dates_in_range(request.requested_range)
        bars = self._source.fetch_daily_bars(ticker, sessions)

        candles = []
        for bar in bars:
            timestamp = session_row_timestamp(bar.session)
            if not (
                request.requested_range.start_timestamp
                <= timestamp
                < request.requested_range.end_timestamp
            ):
                # Defensive: only sessions inside the requested range should ever reach
                # here, but a source must never be trusted to have respected that itself.
                continue
            candles.append(
                HistoricalCandle(
                    timestamp=timestamp,
                    open=bar.open,
                    high=bar.high,
                    low=bar.low,
                    close=bar.close,
                    volume=bar.volume,
                )
            )
        candles.sort(key=lambda candle: candle.timestamp)

        next_available_timestamp = None
        if not candles:
            # No bar landed in range (e.g. an all-weekend range, or every session in it
            # was a holiday); point the caller at the next weekday session row instead
            # of leaving them to guess where to resume.
            next_available_timestamp = next_session_row_timestamp(request.requested_range.end_timestamp)

        return HistoricalCandleBatch(
            request=request,
            candles=tuple(candles),
            next_available_timestamp=next_available_timestamp,
        )
