"""NSE/BSE ticker <-> Jesse symbol encoding.

`jh.base_asset`/`jh.quote_asset` split a symbol on '-' and take parts [0]/[1], so an
NSE ticker that itself contains '-' (e.g. `BAJAJ-AUTO`) would silently break those
helpers if stored as-is. Encode the exchange ticker's '-' as '_' in the Jesse base
asset instead: `BAJAJ-AUTO` <-> `BAJAJ_AUTO-INR`. '&' is left alone (`M&M-INR`) since
it does not collide with the '-' separator. A ticker that already contains '_' is
rejected as ambiguous - it could not be told apart from an encoded '-' on decode.

This module also provides the user-facing TradingView-style symbol form
(`NSE:RELIANCE`, `BSE:RELIANCE`, `AMFI:<scheme_code>`), which wraps the
`to_jesse_symbol`/`to_exchange_ticker` ticker encoding above with an `EXCHANGE:`
prefix (see `parse_tradingview_symbol`/`to_tradingview_symbol`).
"""
from typing import NamedTuple

from jesse import enums

from ..errors import HistoricalDataRequestError

# AMFI (mutual funds) has no registered Jesse exchange yet - that's phase P4. The
# constant exists so TradingView-style `AMFI:<scheme_code>` symbols can already be
# parsed/validated ahead of the exchange itself being wired up.
AMFI_EXCHANGE = 'AMFI'

# Single source of truth for supported TradingView-style prefixes, so P2+ can extend
# this without touching the parse/format logic below.
_TRADINGVIEW_PREFIX_TO_EXCHANGE = {
    'NSE': enums.exchanges.NSE,
    'BSE': enums.exchanges.BSE,
    'AMFI': AMFI_EXCHANGE,
}
_EXCHANGE_TO_TRADINGVIEW_PREFIX = {value: key for key, value in _TRADINGVIEW_PREFIX_TO_EXCHANGE.items()}


class JesseInstrument(NamedTuple):
    exchange: str
    symbol: str


def to_jesse_symbol(ticker: str) -> str:
    """Encode an NSE/BSE ticker (e.g. `BAJAJ-AUTO`) into a Jesse symbol (`BAJAJ_AUTO-INR`)."""
    normalized = ticker.strip().upper()
    if not normalized:
        raise HistoricalDataRequestError('NSE/BSE ticker must not be empty')
    if any(character.isspace() for character in normalized):
        raise HistoricalDataRequestError(f'NSE/BSE ticker {ticker!r} must not contain whitespace')
    if '_' in normalized:
        raise HistoricalDataRequestError(
            f'NSE/BSE ticker {ticker!r} already contains "_", which collides with the "-" -> "_" encoding'
        )
    if normalized.count('-') > 1:
        raise HistoricalDataRequestError(f'NSE/BSE ticker {ticker!r} has more than one "-"')
    return f'{normalized.replace("-", "_")}-INR'


def to_exchange_ticker(symbol: str) -> str:
    """Decode a Jesse symbol (`BAJAJ_AUTO-INR`) back into its NSE/BSE ticker (`BAJAJ-AUTO`)."""
    normalized = symbol.strip().upper()
    if not normalized:
        raise HistoricalDataRequestError('Jesse symbol must not be empty')
    if any(character.isspace() for character in normalized):
        raise HistoricalDataRequestError(f'Jesse symbol {symbol!r} must not contain whitespace')
    dash_count = normalized.count('-')
    if dash_count == 0:
        raise HistoricalDataRequestError(f'Jesse symbol {symbol!r} is missing a quote asset')
    if dash_count > 1:
        raise HistoricalDataRequestError(f'Jesse symbol {symbol!r} has more than one "-"')
    base, _, quote_asset = normalized.partition('-')
    if quote_asset != 'INR':
        raise HistoricalDataRequestError(f'Jesse symbol {symbol!r} must quote INR for an NSE/BSE instrument')
    if not base:
        raise HistoricalDataRequestError(f'Jesse symbol {symbol!r} is missing a base asset')
    return base.replace('_', '-')


def parse_tradingview_symbol(value: str) -> JesseInstrument:
    """Parse a TradingView-style symbol (`NSE:RELIANCE`, `AMFI:119551`) into a `JesseInstrument`."""
    if not isinstance(value, str):
        raise HistoricalDataRequestError(f'TradingView symbol must be a string, got {value!r}')
    normalized = value.strip().upper()
    if not normalized:
        raise HistoricalDataRequestError('TradingView symbol must not be empty')
    colon_count = normalized.count(':')
    if colon_count == 0:
        raise HistoricalDataRequestError(
            f'TradingView symbol {value!r} is missing ":" - expected EXCHANGE:TICKER, e.g. NSE:RELIANCE'
        )
    if colon_count > 1:
        raise HistoricalDataRequestError(f'TradingView symbol {value!r} has more than one ":"')
    prefix, _, ticker = normalized.partition(':')
    if not prefix:
        raise HistoricalDataRequestError(f'TradingView symbol {value!r} is missing its EXCHANGE prefix before ":"')
    if not ticker:
        raise HistoricalDataRequestError(f'TradingView symbol {value!r} is missing its TICKER after ":"')
    if prefix not in _TRADINGVIEW_PREFIX_TO_EXCHANGE:
        supported = ', '.join(sorted(_TRADINGVIEW_PREFIX_TO_EXCHANGE))
        raise HistoricalDataRequestError(
            f'TradingView symbol {value!r} has unsupported exchange prefix {prefix!r}; supported prefixes: {supported}'
        )
    # AMFI has no ticker vocabulary of its own yet (phase P4) - it identifies mutual
    # fund schemes purely by their numeric AMFI scheme code.
    if prefix == 'AMFI' and not ticker.isdigit():
        raise HistoricalDataRequestError(
            f'AMFI TradingView symbol {value!r} must use a numeric scheme code, e.g. AMFI:119551'
        )
    return JesseInstrument(_TRADINGVIEW_PREFIX_TO_EXCHANGE[prefix], to_jesse_symbol(ticker))


def to_tradingview_symbol(exchange: str, symbol: str) -> str:
    """Format a Jesse (exchange, symbol) pair back into its TradingView-style symbol."""
    if not isinstance(exchange, str) or not isinstance(symbol, str):
        raise HistoricalDataRequestError(f'exchange and symbol must be strings, got {exchange!r} and {symbol!r}')
    if exchange not in _EXCHANGE_TO_TRADINGVIEW_PREFIX:
        supported = ', '.join(sorted(_EXCHANGE_TO_TRADINGVIEW_PREFIX))
        raise HistoricalDataRequestError(
            f'{exchange!r} is not a supported TradingView exchange; supported exchanges: {supported}'
        )
    prefix = _EXCHANGE_TO_TRADINGVIEW_PREFIX[exchange]
    ticker = to_exchange_ticker(symbol)
    if prefix == 'AMFI' and not ticker.isdigit():
        raise HistoricalDataRequestError(
            f'AMFI Jesse symbol {symbol!r} must decode to a numeric scheme code, got {ticker!r}'
        )
    return f'{prefix}:{ticker}'
