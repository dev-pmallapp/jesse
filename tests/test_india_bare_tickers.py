"""Tests for dev-pmallapp/jesse#75: accepting bare NSE/BSE tickers (`RELIANCE`,
`NSE:RELIANCE`, `BAJAJ-AUTO`) at every user/agent-facing entry point, in addition to
the internal `BASE-QUOTE` symbol (`RELIANCE-INR`). Covers the normaliser itself
(`jesse.services.symbol_input`), the router/Route choke point, the candle import
boundary, and an end-to-end backtest equivalence check across spellings - mirrors the
NSE end-to-end pattern in `tests/test_india_daily_backtest.py`.
"""
from datetime import date, timedelta

import numpy as np
import pytest

import jesse.helpers as jh
from jesse import exceptions, research
from jesse.controllers import candles_controller
from jesse.enums import exchanges
from jesse.markets.india import nse_trading_hours
from jesse.modes import import_candles_mode
from jesse.routes import router
from jesse.services.historical_data.india.sessions import session_row_timestamp
from jesse.services.symbol_input import display_ticker, normalize_symbol

# --------------------------------------------------------------------------------------
# normalize_symbol()
# --------------------------------------------------------------------------------------

# (exchange, input, expected) - the bare/TradingView/internal forms the issue requires,
# plus case-insensitivity and surrounding-whitespace handling.
_NORMALIZE_TABLE = [
    (exchanges.NSE, 'RELIANCE', 'RELIANCE-INR'),
    (exchanges.NSE, 'reliance', 'RELIANCE-INR'),
    (exchanges.NSE, '  RELIANCE  ', 'RELIANCE-INR'),
    (exchanges.NSE, 'BAJAJ-AUTO', 'BAJAJ_AUTO-INR'),
    (exchanges.NSE, 'bajaj-auto', 'BAJAJ_AUTO-INR'),
    (exchanges.NSE, 'NSE:RELIANCE', 'RELIANCE-INR'),
    (exchanges.NSE, 'nse:reliance', 'RELIANCE-INR'),
    (exchanges.NSE, 'NSE:BAJAJ-AUTO', 'BAJAJ_AUTO-INR'),
    (exchanges.NSE, 'RELIANCE-INR', 'RELIANCE-INR'),
    (exchanges.NSE, 'reliance-inr', 'RELIANCE-INR'),
    (exchanges.NSE, 'BAJAJ_AUTO-INR', 'BAJAJ_AUTO-INR'),
    (exchanges.BSE, 'RELIANCE', 'RELIANCE-INR'),
    (exchanges.BSE, 'BSE:RELIANCE', 'RELIANCE-INR'),
]


@pytest.mark.parametrize(('exchange', 'value', 'expected'), _NORMALIZE_TABLE)
def test_normalize_symbol_table(exchange, value, expected):
    assert normalize_symbol(exchange, value) == expected


def test_normalize_symbol_rejects_empty_value():
    with pytest.raises(exceptions.InvalidSymbol):
        normalize_symbol(exchanges.NSE, '')
    with pytest.raises(exceptions.InvalidSymbol):
        normalize_symbol(exchanges.NSE, '   ')


def test_normalize_symbol_rejects_inner_whitespace():
    with pytest.raises(exceptions.InvalidSymbol):
        normalize_symbol(exchanges.NSE, 'RELIANCE INR')
    with pytest.raises(exceptions.InvalidSymbol):
        normalize_symbol(exchanges.NSE, 'NSE : RELIANCE')


def test_normalize_symbol_rejects_wrong_exchange_prefix():
    """A TradingView prefix naming a different exchange than the route's is ambiguous,
    not silently accepted - e.g. BSE:RELIANCE on an NSE route."""
    with pytest.raises(exceptions.InvalidSymbol):
        normalize_symbol(exchanges.NSE, 'BSE:RELIANCE')


def test_normalize_symbol_rejects_malformed_ticker():
    # Two dashes: ambiguous under the '-' -> '_' encoding (historical_data/india/symbols.py).
    with pytest.raises(exceptions.InvalidSymbol):
        normalize_symbol(exchanges.NSE, 'FOO-BAR-INR')
    # An embedded '_' collides with the '-' -> '_' encoding and cannot be told apart on decode.
    with pytest.raises(exceptions.InvalidSymbol):
        normalize_symbol(exchanges.NSE, 'FOO_BAR')


def test_normalize_symbol_sandbox_passthrough():
    """The internal Sandbox test exchange isn't INR-settled, so it doesn't use the
    bare-ticker convention at all - value is only whitespace-stripped, not upper-cased."""
    assert normalize_symbol(exchanges.SANDBOX, 'BTC-USDT') == 'BTC-USDT'
    assert normalize_symbol(exchanges.SANDBOX, '  btc-USDT  ') == 'btc-USDT'


# --------------------------------------------------------------------------------------
# display_ticker()
# --------------------------------------------------------------------------------------

def test_display_ticker_round_trip():
    assert display_ticker(exchanges.NSE, 'RELIANCE-INR') == 'RELIANCE'
    assert display_ticker(exchanges.NSE, 'BAJAJ_AUTO-INR') == 'BAJAJ-AUTO'
    assert display_ticker(exchanges.SANDBOX, 'BTC-USDT') == 'BTC-USDT'


def test_display_ticker_and_normalize_symbol_round_trip():
    for ticker in ('RELIANCE', 'BAJAJ-AUTO'):
        symbol = normalize_symbol(exchanges.NSE, ticker)
        assert display_ticker(exchanges.NSE, symbol) == ticker.upper()


# --------------------------------------------------------------------------------------
# router / Route
# --------------------------------------------------------------------------------------

def test_router_normalizes_bare_and_tradingview_symbols():
    try:
        router.initiate(
            routes=[{
                'exchange': exchanges.NSE,
                'symbol': 'RELIANCE',
                'timeframe': '1D',
                'strategy': 'TestIndiaDailyInrBacktest',
            }],
            data_routes=[{'exchange': exchanges.NSE, 'symbol': 'NSE:BAJAJ-AUTO', 'timeframe': '1D'}],
        )

        assert router.routes[0].symbol == 'RELIANCE-INR'
        assert router.formatted_routes[0]['symbol'] == 'RELIANCE-INR'
        assert router.data_routes[0].symbol == 'BAJAJ_AUTO-INR'
        assert router.formatted_data_routes[0]['symbol'] == 'BAJAJ_AUTO-INR'
    finally:
        router._reset()


# --------------------------------------------------------------------------------------
# candle import boundary
# --------------------------------------------------------------------------------------

def test_validate_import_request_accepts_bare_ticker():
    """`import_candles_mode.validate_import_request` is the entry point every import
    path (dashboard, research.import_candles) funnels through - see its docstring."""
    _, symbol = import_candles_mode.validate_import_request(exchanges.NSE, 'RELIANCE', '2024-01-01')
    assert symbol == 'RELIANCE-INR'

    _, symbol = import_candles_mode.validate_import_request(exchanges.NSE, 'NSE:BAJAJ-AUTO', '2024-01-01')
    assert symbol == 'BAJAJ_AUTO-INR'


def test_validate_import_request_rejects_wrong_exchange_prefix():
    with pytest.raises(ValueError):
        import_candles_mode.validate_import_request(exchanges.NSE, 'BSE:RELIANCE', '2024-01-01')


def test_candles_import_controller_accepts_bare_ticker(monkeypatch):
    """`POST /candles/import` (candles_controller.import_candles) is the dashboard/MCP
    boundary - the import worker itself is stubbed out, but the real (unmocked)
    `validate_import_request` must accept a bare ticker without a 422.
    """
    monkeypatch.setattr(candles_controller.jh, 'validate_cwd', lambda: None)
    monkeypatch.setattr(candles_controller.process_manager, 'add_task', lambda *args: None)
    monkeypatch.setattr(import_candles_mode, 'store_import_outcome', lambda *args, **kwargs: None)

    from jesse.services.web import ImportCandlesRequestJson

    request_json = ImportCandlesRequestJson(
        id='import-id', exchange=exchanges.NSE, symbol='RELIANCE', start_date='2024-01-01'
    )
    response = candles_controller.import_candles(request_json)

    assert response.status_code == 202


def test_candles_delete_controller_accepts_bare_ticker(monkeypatch):
    calls = []
    monkeypatch.setattr(
        candles_controller.candle_repository,
        'delete_candles_from_db',
        lambda exchange, symbol: calls.append((exchange, symbol)),
    )

    from jesse.services.web import DeleteCandlesRequestJson

    request_json = DeleteCandlesRequestJson(exchange=exchanges.NSE, symbol='reliance')
    response = candles_controller.delete_candles(request_json)

    assert response.status_code == 200
    assert calls == [(exchanges.NSE, 'RELIANCE-INR')]


# --------------------------------------------------------------------------------------
# boot-path isolation
# --------------------------------------------------------------------------------------

def test_plain_import_jesse_does_not_load_india_modules():
    """Mirrors test_india_universes.py's boot-path test: `import jesse` must never pull
    in the India package - `jesse.services.symbol_input` imports it lazily inside
    `normalize_symbol`/`display_ticker`'s own function bodies. Run in a fresh subprocess
    so this test file's own module-level India imports above don't make the assertion
    trivially true within this process.
    """
    import subprocess
    import sys
    from pathlib import Path

    result = subprocess.run(
        [
            sys.executable, '-c',
            "import jesse, sys; "
            "assert 'jesse.services.historical_data.india' not in sys.modules; "
            "assert 'jesse.markets.india' not in sys.modules",
        ],
        cwd=str(Path(__file__).resolve().parents[1]),
        capture_output=True,
        text=True,
        timeout=60,
    )

    assert result.returncode == 0, f'stdout={result.stdout!r} stderr={result.stderr!r}'


# --------------------------------------------------------------------------------------
# acceptance: RELIANCE / NSE:RELIANCE / RELIANCE-INR give identical backtests
# --------------------------------------------------------------------------------------

# Deterministic rising close series, same shape as test_india_daily_backtest.py.
BASE_PRICE = 100


def _nse_sessions(start: date, end: date) -> list:
    """Real 2024 NSE trading sessions (weekdays minus holidays) in [start, end]."""
    holidays = set(nse_trading_hours(start.year, end.year)['closed'])
    sessions = []
    d = start
    while d <= end:
        if d.weekday() < 5 and d.isoformat() not in holidays:
            sessions.append(d)
        d += timedelta(days=1)
    return sessions


def _build_candles() -> np.ndarray:
    sessions = _nse_sessions(date(2024, 1, 1), date(2024, 3, 31))
    rows = [
        [session_row_timestamp(d), BASE_PRICE + i, BASE_PRICE + i, BASE_PRICE + i, BASE_PRICE + i, 1]
        for i, d in enumerate(sessions)
    ]
    return np.array(rows, dtype=np.float64)


def _base_config() -> dict:
    return {
        'starting_balance': 1_000_000,
        'fee': 0,
        'type': 'spot',
        'exchange': exchanges.NSE,
        'warm_up_candles': 0,
    }


def _candles_dict(canonical_symbol: str, candles_array: np.ndarray) -> dict:
    return {
        jh.key(exchanges.NSE, canonical_symbol): {
            'exchange': exchanges.NSE,
            'symbol': canonical_symbol,
            'candles': candles_array,
        }
    }


def _stable_trade_fields(trades: list) -> list:
    """Strip randomly-generated ids (trade/order uuids, timestamps of insertion) so two
    otherwise-identical backtests can be compared for equality regardless of spelling."""
    return [
        {k: v for k, v in trade.items() if k not in ('id', 'orders')}
        for trade in (trades or [])
    ]


def _run_backtest(symbol_spelling: str, canonical_symbol: str, candles_array: np.ndarray) -> dict:
    routes = [{
        'exchange': exchanges.NSE,
        'symbol': symbol_spelling,
        'timeframe': '1D',
        'strategy': 'TestIndiaDailyInrBacktest',
    }]
    # The candles dict is keyed by the canonical symbol regardless of which spelling the
    # route uses - research.backtest() re-keys it internally after normalising.
    return research.backtest(_base_config(), routes, [], _candles_dict(canonical_symbol, candles_array))


@pytest.mark.parametrize('symbol_spelling', ['RELIANCE', 'NSE:RELIANCE', 'RELIANCE-INR', 'reliance'])
def test_bare_ticker_backtest_matches_canonical_symbol(symbol_spelling):
    candles_array = _build_candles()
    canonical_result = _run_backtest('RELIANCE-INR', 'RELIANCE-INR', candles_array)
    result = _run_backtest(symbol_spelling, 'RELIANCE-INR', candles_array)

    assert result['metrics'] == canonical_result['metrics']
    assert _stable_trade_fields(result.get('trades')) == _stable_trade_fields(canonical_result.get('trades'))


@pytest.mark.parametrize('symbol_spelling', ['BAJAJ-AUTO', 'NSE:BAJAJ-AUTO', 'BAJAJ_AUTO-INR'])
def test_hyphenated_ticker_backtest_matches_canonical_symbol(symbol_spelling):
    """A hyphenated NSE ticker (`BAJAJ-AUTO`) round-trips through the '-' -> '_' encoding
    (historical_data/india/symbols.py) the same as it does for the internal form."""
    candles_array = _build_candles()
    canonical_result = _run_backtest('BAJAJ_AUTO-INR', 'BAJAJ_AUTO-INR', candles_array)
    result = _run_backtest(symbol_spelling, 'BAJAJ_AUTO-INR', candles_array)

    assert result['metrics'] == canonical_result['metrics']
    assert _stable_trade_fields(result.get('trades')) == _stable_trade_fields(canonical_result.get('trades'))
