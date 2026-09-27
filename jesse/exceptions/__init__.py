class EmptyPosition(Exception):
    pass


class OpenPositionError(Exception):
    pass


class OrderNotAllowed(Exception):
    pass


class ConflictingRules(Exception):
    pass


class InvalidStrategy(Exception):
    pass


class CandleNotFoundInDatabase(Exception):
    pass


class CandleNotFoundInExchange(Exception):
    pass


class SymbolNotFound(Exception):
    pass


class RouteNotFound(Exception):
    def __init__(self, symbol, timeframe):
        message = f"Data route is required but missing: symbol='{symbol}', timeframe='{timeframe}'"
        super().__init__(message)


class InvalidRoutes(Exception):
    pass


class ExchangeInMaintenance(Exception):
    pass


class ExchangeNotResponding(Exception):
    pass


class ExchangeRejectedOrder(Exception):
    pass

class ExchangeRejectedLeverageNumber(Exception):
    pass


class ExchangeOrderNotFound(Exception):
    pass


class HistoryIntegrityError(ValueError):
    pass


class InvalidShape(Exception):
    pass


class InvalidConfig(Exception):
    pass


class InvalidTimeframe(Exception):
    pass


class InvalidSymbol(Exception):
    pass


class NegativeBalance(Exception):
    pass


class InsufficientMargin(Exception):
    pass


class InsufficientBalance(Exception):
    pass


class Termination(Exception):
    pass


class InvalidExchangeApiKeys(Exception):
    pass


class ExchangeError(Exception):
    pass


class NotSupportedError(Exception):
    pass


class CandlesNotFound(Exception):
    pass


class InvalidDateRange(Exception):
    pass


class PortfolioCandlesMissing(ValueError):
    """Raised by jesse.research.portfolio_rebalance when the basket (or its benchmark)
    has symbols with no imported daily candles over the requested window. Subclasses
    ValueError so existing `except ValueError` callers keep working, while exposing
    structured fields an API route can turn into a "missing data" response instead of
    just a formatted string.
    """

    def __init__(self, exchange, symbols, start_date, finish_date):
        self.exchange = exchange
        self.symbols = sorted(symbols)
        self.start_date = start_date
        self.finish_date = finish_date
        super().__init__(
            f'No daily candles for {", ".join(self.symbols)} between {start_date} and {finish_date} '
            f'on {exchange} - import them first.'
        )
