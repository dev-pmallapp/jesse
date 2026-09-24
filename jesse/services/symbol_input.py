"""User-facing symbol normalisation (dev-pmallapp/jesse#75).

NSE/BSE users type a bare exchange ticker (`RELIANCE`, `BAJAJ-AUTO`) or a
TradingView-style `EXCHANGE:TICKER` symbol; Jesse's core still needs the internal
`BASE-QUOTE` symbol (`RELIANCE-INR`, `BAJAJ_AUTO-INR`) - `jh.base_asset`/`quote_asset`,
symbol validation, DB keys and adjustment state all split on '-' and assume that shape.
This module is the single place that bridges the two, so every user/agent-facing entry
point (the router, research.backtest/get_candles/import_candles, the candle import
request/controller, MCP tool inputs) calls `normalize_symbol` once at its own boundary
instead of duplicating the encoding rules already implemented in
`historical_data/india/symbols.py`.

Import note: this module must NOT import `jesse.services.historical_data.india` at
module scope - that subpackage's `__init__` registers every India data source as a
side effect, so importing it eagerly would slow down (and complicate) `import jesse`
for every exchange, including non-India ones. The india symbol helpers are imported
lazily below, only once an exchange is confirmed to be INR-settled.
"""
from jesse import exceptions
from jesse.info import exchange_info


def _is_inr_settled(exchange: str) -> bool:
    """Whether `exchange` uses the bare-ticker convention (currently NSE/BSE only).

    Decided by the registered `settlement_currency` rather than a hard-coded exchange
    name list, so a future INR-settled exchange picks this up automatically.
    """
    return exchange_info.get(exchange, {}).get('settlement_currency') == 'INR'


def normalize_symbol(exchange: str, value: str) -> str:
    """Normalise a user-supplied symbol for `exchange` into Jesse's internal BASE-QUOTE form.

    On an INR-settled exchange (NSE/BSE), accepts - case-insensitively, with
    surrounding whitespace stripped:
    - a bare exchange ticker: `RELIANCE` -> `RELIANCE-INR`, `BAJAJ-AUTO` -> `BAJAJ_AUTO-INR`
    - a TradingView-style symbol: `NSE:RELIANCE` -> `RELIANCE-INR`
    - the internal form itself: `RELIANCE-INR` / `BAJAJ_AUTO-INR` (returned upper-cased)

    Any other exchange (e.g. the internal `Sandbox` test exchange) doesn't use this
    bare-ticker convention, so `value` is returned unchanged (only whitespace-stripped).

    Raises `exceptions.InvalidSymbol` for an empty value, whitespace inside the value,
    a TradingView prefix naming a different exchange than `exchange`, or any other
    malformed ticker (see `historical_data/india/symbols.py` for the exact rules).
    """
    if not isinstance(value, str):
        raise exceptions.InvalidSymbol(f'symbol must be a string, got {value!r}')

    stripped = value.strip()
    if not stripped:
        raise exceptions.InvalidSymbol('symbol must not be empty')

    if not _is_inr_settled(exchange):
        return stripped

    # Inner whitespace ('RELIANCE INR') is never valid input, bare or internal - reject
    # it here so every downstream branch below can assume a single contiguous token.
    if any(character.isspace() for character in stripped):
        raise exceptions.InvalidSymbol(f'symbol {value!r} must not contain whitespace')

    # Lazy import: keep `import jesse` from loading every India data source (see the
    # module docstring).
    from jesse.services.historical_data.india import symbols as india_symbols
    from jesse.services.historical_data.errors import HistoricalDataRequestError

    upper = stripped.upper()

    if upper.endswith('-INR'):
        # Already the internal form - validate its shape (rejects things like an
        # extra '-' or an embedded '_') and return it as-is rather than re-encoding it.
        try:
            india_symbols.to_exchange_ticker(upper)
        except HistoricalDataRequestError as e:
            raise exceptions.InvalidSymbol(str(e)) from e
        return upper

    if ':' in upper:
        try:
            instrument = india_symbols.parse_tradingview_symbol(upper)
        except HistoricalDataRequestError as e:
            raise exceptions.InvalidSymbol(str(e)) from e
        if instrument.exchange != exchange:
            raise exceptions.InvalidSymbol(
                f'symbol {value!r} is prefixed for {instrument.exchange!r}, not {exchange!r}'
            )
        return instrument.symbol

    # Bare exchange ticker, e.g. `RELIANCE` or `BAJAJ-AUTO`.
    try:
        return india_symbols.to_jesse_symbol(upper)
    except HistoricalDataRequestError as e:
        raise exceptions.InvalidSymbol(str(e)) from e


def display_ticker(exchange: str, symbol: str) -> str:
    """Format an internal Jesse `symbol` back into the bare ticker a user typed.

    `RELIANCE-INR` -> `RELIANCE`, `BAJAJ_AUTO-INR` -> `BAJAJ-AUTO` on an INR-settled
    exchange (NSE/BSE); any other exchange's symbol is returned unchanged, since it
    doesn't use this bare-ticker convention. Outputs (reports, dashboard payloads) are
    unaffected by this story - this helper exists for later output-facing stories.
    """
    if not _is_inr_settled(exchange):
        return symbol

    from jesse.services.historical_data.india import symbols as india_symbols
    from jesse.services.historical_data.errors import HistoricalDataRequestError

    try:
        return india_symbols.to_exchange_ticker(symbol)
    except HistoricalDataRequestError as e:
        raise exceptions.InvalidSymbol(str(e)) from e
