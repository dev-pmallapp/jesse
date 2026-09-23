"""NSE/BSE ticker <-> Jesse symbol encoding.

`jh.base_asset`/`jh.quote_asset` split a symbol on '-' and take parts [0]/[1], so an
NSE ticker that itself contains '-' (e.g. `BAJAJ-AUTO`) would silently break those
helpers if stored as-is. Encode the exchange ticker's '-' as '_' in the Jesse base
asset instead: `BAJAJ-AUTO` <-> `BAJAJ_AUTO-INR`. '&' is left alone (`M&M-INR`) since
it does not collide with the '-' separator. A ticker that already contains '_' is
rejected as ambiguous - it could not be told apart from an encoded '-' on decode.
"""
from ..errors import HistoricalDataRequestError


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
