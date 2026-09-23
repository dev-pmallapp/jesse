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
    SymbolCatalogEntry,
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

    def __init__(self, exchange: str, source: IndiaDailySource | None = None) -> None:
        self._source = source if source is not None else create_source(exchange)
        self.provider_id = exchange
        self.source_id = self._source.source_id
        self.prices_adjusted = self._source.prices_adjusted
        # A per-instance attribute (not the shared class default) because ticker_search
        # depends on whether *this* source overrides list_symbol_entries - two providers
        # backed by different sources must not share one capabilities object.
        self.capabilities = ProviderCapabilities(
            native_timeframes=('1m',),
            max_candles_per_request=INDIA_MAX_CANDLES_PER_REQUEST,
            ticker_search=_has_symbol_catalog(self._source),
        )

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

    def list_symbol_entries(self) -> tuple[SymbolCatalogEntry, ...]:
        return self._source.list_symbol_entries()

    def list_symbols(self) -> tuple[str, ...]:
        return tuple(entry.symbol for entry in self.list_symbol_entries())

    def search_symbols(self, query: str, limit: int = 50) -> tuple[str, ...]:
        normalized_query = query.strip().upper()
        if not normalized_query:
            return ()

        prefix_matches: list[str] = []
        other_matches: list[str] = []
        for entry in self.list_symbol_entries():
            symbol = entry.symbol.upper()
            name = (entry.name or '').upper()
            if normalized_query not in symbol and normalized_query not in name:
                continue
            # A symbol-prefix match (e.g. "TCS" for query "TCS") is what a user typing a
            # ticker is almost always looking for, so it outranks a mid-string/name hit.
            (prefix_matches if symbol.startswith(normalized_query) else other_matches).append(entry.symbol)

        return tuple((prefix_matches + other_matches)[:limit])


def _has_symbol_catalog(source: IndiaDailySource) -> bool:
    # `IndiaDailySource.list_symbol_entries` is the shared "not supported" default (it
    # raises ProviderCapabilityError); a source only offers ticker search when its own
    # class overrides that method with a real implementation.
    return type(source).list_symbol_entries is not IndiaDailySource.list_symbol_entries
