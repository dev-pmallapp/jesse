"""Tests for the TradingView-style symbol helpers added in
jesse/services/historical_data/india/symbols.py (`JesseInstrument`,
`parse_tradingview_symbol`, `to_tradingview_symbol`, `AMFI_EXCHANGE`).
"""
import pytest

from jesse.enums import exchanges
from jesse.services.historical_data.errors import HistoricalDataRequestError
from jesse.services.historical_data.india import (
    AMFI_EXCHANGE,
    JesseInstrument,
    parse_tradingview_symbol,
    to_tradingview_symbol,
)

# --------------------------------------------------------------------------------------
# parse_tradingview_symbol
# --------------------------------------------------------------------------------------


@pytest.mark.parametrize(
    ('value', 'expected'),
    [
        ('NSE:RELIANCE', ('NSE', 'RELIANCE-INR')),
        ('NSE:BAJAJ-AUTO', ('NSE', 'BAJAJ_AUTO-INR')),
        ('NSE:M&M', ('NSE', 'M&M-INR')),
        ('NSE:NIFTY', ('NSE', 'NIFTY-INR')),
        ('BSE:RELIANCE', ('BSE', 'RELIANCE-INR')),
        ('AMFI:119551', ('AMFI', '119551-INR')),
    ],
)
def test_parse_tradingview_symbol(value, expected):
    result = parse_tradingview_symbol(value)

    assert isinstance(result, JesseInstrument)
    assert result == expected
    assert (result.exchange, result.symbol) == expected


def test_parse_tradingview_symbol_exchange_matches_jesse_enums():
    assert parse_tradingview_symbol('NSE:RELIANCE').exchange == exchanges.NSE
    assert parse_tradingview_symbol('BSE:RELIANCE').exchange == exchanges.BSE
    assert parse_tradingview_symbol('AMFI:119551').exchange == AMFI_EXCHANGE


@pytest.mark.parametrize(
    ('value', 'expected'),
    [
        ('nse:reliance', ('NSE', 'RELIANCE-INR')),
        ('  NSE:RELIANCE  ', ('NSE', 'RELIANCE-INR')),
        ('  nse:reliance  ', ('NSE', 'RELIANCE-INR')),
        ('nse:bajaj-auto', ('NSE', 'BAJAJ_AUTO-INR')),
    ],
)
def test_parse_tradingview_symbol_normalizes_case_and_whitespace(value, expected):
    assert parse_tradingview_symbol(value) == expected


# --------------------------------------------------------------------------------------
# to_tradingview_symbol
# --------------------------------------------------------------------------------------


@pytest.mark.parametrize(
    ('exchange', 'symbol', 'expected'),
    [
        ('NSE', 'RELIANCE-INR', 'NSE:RELIANCE'),
        ('NSE', 'BAJAJ_AUTO-INR', 'NSE:BAJAJ-AUTO'),
        ('NSE', 'M&M-INR', 'NSE:M&M'),
        ('NSE', 'NIFTY-INR', 'NSE:NIFTY'),
        ('BSE', 'RELIANCE-INR', 'BSE:RELIANCE'),
        (AMFI_EXCHANGE, '119551-INR', 'AMFI:119551'),
    ],
)
def test_to_tradingview_symbol(exchange, symbol, expected):
    assert to_tradingview_symbol(exchange, symbol) == expected


# --------------------------------------------------------------------------------------
# round trips
# --------------------------------------------------------------------------------------


@pytest.mark.parametrize(
    'value',
    ['NSE:RELIANCE', 'NSE:BAJAJ-AUTO', 'NSE:M&M', 'NSE:NIFTY', 'BSE:RELIANCE', 'AMFI:119551'],
)
def test_parse_then_format_round_trips(value):
    instrument = parse_tradingview_symbol(value)

    assert to_tradingview_symbol(instrument.exchange, instrument.symbol) == value


@pytest.mark.parametrize(
    ('exchange', 'symbol'),
    [
        ('NSE', 'RELIANCE-INR'),
        ('NSE', 'BAJAJ_AUTO-INR'),
        ('NSE', 'M&M-INR'),
        ('NSE', 'NIFTY-INR'),
        ('BSE', 'RELIANCE-INR'),
        (AMFI_EXCHANGE, '119551-INR'),
    ],
)
def test_format_then_parse_round_trips(exchange, symbol):
    value = to_tradingview_symbol(exchange, symbol)

    assert parse_tradingview_symbol(value) == (exchange, symbol)


# --------------------------------------------------------------------------------------
# parse_tradingview_symbol errors
# --------------------------------------------------------------------------------------


def test_parse_tradingview_symbol_rejects_missing_colon():
    with pytest.raises(HistoricalDataRequestError, match='RELIANCE'):
        parse_tradingview_symbol('RELIANCE')


def test_parse_tradingview_symbol_rejects_two_colons():
    with pytest.raises(HistoricalDataRequestError, match='more than one'):
        parse_tradingview_symbol('NSE:RELIANCE:EXTRA')


def test_parse_tradingview_symbol_rejects_empty_prefix():
    with pytest.raises(HistoricalDataRequestError, match='EXCHANGE prefix'):
        parse_tradingview_symbol(':RELIANCE')


def test_parse_tradingview_symbol_rejects_empty_ticker():
    with pytest.raises(HistoricalDataRequestError, match='TICKER'):
        parse_tradingview_symbol('NSE:')


def test_parse_tradingview_symbol_rejects_unknown_prefix_and_lists_supported():
    with pytest.raises(HistoricalDataRequestError, match='NYSE:AAPL') as exc_info:
        parse_tradingview_symbol('NYSE:AAPL')

    message = str(exc_info.value)
    assert 'NYSE' in message
    assert 'AMFI' in message
    assert 'NSE' in message
    assert 'BSE' in message


@pytest.mark.parametrize('value', [None, 42])
def test_parse_tradingview_symbol_rejects_non_string_input(value):
    with pytest.raises(HistoricalDataRequestError):
        parse_tradingview_symbol(value)


def test_parse_tradingview_symbol_rejects_amfi_non_digit_ticker():
    with pytest.raises(HistoricalDataRequestError, match='AMFI:ABC'):
        parse_tradingview_symbol('AMFI:ABC')


@pytest.mark.parametrize(
    'value, expected',
    [
        ('AMFI: 119551', ('AMFI', '119551-INR')),
        ('NSE : RELIANCE', ('NSE', 'RELIANCE-INR')),
    ],
)
def test_parse_tradingview_symbol_tolerates_spaces_around_colon(value, expected):
    assert parse_tradingview_symbol(value) == expected


def test_parse_tradingview_symbol_rejects_non_ascii_amfi_digits():
    # str.isdigit() accepts superscripts and other Unicode digits; scheme codes are ASCII.
    with pytest.raises(HistoricalDataRequestError):
        parse_tradingview_symbol('AMFI:\u00b2')


def test_parse_tradingview_symbol_rejects_ticker_with_underscore():
    with pytest.raises(HistoricalDataRequestError, match='_'):
        parse_tradingview_symbol('NSE:FOO_BAR')


def test_parse_tradingview_symbol_rejects_ticker_with_internal_whitespace():
    with pytest.raises(HistoricalDataRequestError, match='whitespace'):
        parse_tradingview_symbol('NSE:FOO BAR')


def test_parse_tradingview_symbol_rejects_ticker_with_two_dashes():
    with pytest.raises(HistoricalDataRequestError, match='more than one'):
        parse_tradingview_symbol('NSE:A-B-C')


# --------------------------------------------------------------------------------------
# to_tradingview_symbol errors
# --------------------------------------------------------------------------------------


def test_to_tradingview_symbol_rejects_unsupported_exchange():
    with pytest.raises(HistoricalDataRequestError, match='Binance Spot'):
        to_tradingview_symbol('Binance Spot', 'BTC-USDT')


def test_to_tradingview_symbol_rejects_non_inr_symbol():
    with pytest.raises(HistoricalDataRequestError, match='INR'):
        to_tradingview_symbol('NSE', 'RELIANCE-USD')


def test_to_tradingview_symbol_rejects_amfi_non_digit_symbol():
    with pytest.raises(HistoricalDataRequestError, match='numeric scheme code'):
        to_tradingview_symbol(AMFI_EXCHANGE, 'ABC-INR')
