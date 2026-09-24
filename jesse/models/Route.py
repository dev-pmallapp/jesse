from typing import TYPE_CHECKING

from jesse.services.symbol_input import normalize_symbol

if TYPE_CHECKING:
    from jesse.strategies import Strategy


class Route:
    def __init__(
            self,
            exchange: str,
            symbol: str,
            timeframe: str = None,
            strategy_name: str = None,
            dna: str = None
    ) -> None:
        self.exchange = exchange
        # Every route construction path (strategies' routes.py, dashboard backtest/
        # optimize/monte-carlo requests, research routes) funnels through here, so this
        # is the single choke point that turns a user-typed bare ticker (`RELIANCE`,
        # `NSE:RELIANCE`) into Jesse's internal BASE-QUOTE symbol (`RELIANCE-INR`) -
        # see dev-pmallapp/jesse#75. A no-op for non-INR exchanges (Sandbox, and an
        # already-canonical symbol on NSE/BSE).
        self.symbol = normalize_symbol(exchange, symbol)
        self.timeframe = timeframe
        self.strategy_name = strategy_name
        # set by the router when strategies are initiated, hence declared with
        # its post-initiation type for type checkers
        self.strategy: 'Strategy' = None  # type: ignore
        self.dna = dna
