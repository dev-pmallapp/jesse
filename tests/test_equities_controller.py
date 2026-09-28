"""Tests for the equities dashboard controller (stock search/detail/candles).

Mounts `equities_controller.router` on a throwaway `FastAPI()` app (not
`jesse.services.web.fastapi_app`) per the task spec, so these tests don't depend on
`jesse/__init__.py` router registration. DB-touching routes bind `Candle` to an
in-memory SQLite database (mirrors `tests/test_candle_timeframe_filter.py`); India
network access (`_load_catalog`) is stubbed per-test so nothing here ever touches the
real NSE/BSE catalogs.
"""
from datetime import date, timedelta
from hashlib import sha256
from types import SimpleNamespace

import numpy as np
import peewee
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import jesse.helpers as jh
from jesse.controllers import equities_controller as ec
from jesse.models.Candle import Candle
from jesse.services import auth

PASSWORD = 'equities-controller-test-password'
AUTH_HEADERS = {'Authorization': sha256(PASSWORD.encode('utf-8')).hexdigest()}

# Mirrors the production table (see test_candle_timeframe_filter.py / test_candle_copy.py).
CANDLE_SCHEMA = """
    CREATE TABLE candle (
        id TEXT NOT NULL PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        open REAL NOT NULL,
        close REAL NOT NULL,
        high REAL NOT NULL,
        low REAL NOT NULL,
        volume REAL NOT NULL,
        exchange VARCHAR(255) NOT NULL,
        symbol VARCHAR(255) NOT NULL,
        timeframe VARCHAR(255)
    )
"""


@pytest.fixture
def sqlite_candles(tmp_path):
    """Bind the Candle model to a throwaway on-disk database for the test.

    A file-backed DB (not `:memory:`) is required here specifically because these
    tests query it through `TestClient`, whose FastAPI sync routes run in a
    threadpool worker thread (see `fastapi.concurrency.run_in_threadpool`) - a plain
    `:memory:` SQLite database is private to the connection that created it, so a
    second thread's connection would see an empty (tableless) database.
    """
    db = peewee.SqliteDatabase(str(tmp_path / 'equities_controller_test.db'))
    with db.bind_ctx([Candle]):
        db.execute_sql(CANDLE_SCHEMA)
        yield db


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setitem(auth.ENV_VALUES, 'PASSWORD', PASSWORD)
    app = FastAPI()
    app.include_router(ec.router)
    test_client = TestClient(app)
    test_client.headers.update(AUTH_HEADERS)
    return test_client


def _row(exchange: str, symbol: str, d: date, *, open=None, high=None, low=None, close, volume=1000.0):
    """One daily candle row, timestamped at `d`'s own midnight UTC - any time-of-day
    inside the calendar day works for `_daily_candles`'s date-bounded query (see its
    docstring); midnight keeps the arithmetic in tests trivial."""
    ts = jh.date_to_timestamp(d.isoformat())
    return {
        'id': jh.generate_unique_id(),
        'exchange': exchange,
        'symbol': symbol,
        'timeframe': '1m',
        'timestamp': ts,
        'open': open if open is not None else close,
        'close': close,
        'high': high if high is not None else close,
        'low': low if low is not None else close,
        'volume': volume,
    }


def _store(rows) -> None:
    # Chunked: SQLite caps bound variables per statement (SQLITE_MAX_VARIABLE_NUMBER),
    # which a single `insert_many` over thousands of 10-column rows can exceed - the
    # truncation test seeds `_MAX_CANDLE_ROWS + 5` rows.
    chunk_size = 500
    for i in range(0, len(rows), chunk_size):
        Candle.insert_many(rows[i:i + chunk_size]).execute()


def _catalog_entry(symbol: str, name: str):
    from jesse.services.historical_data.contracts import SymbolCatalogEntry
    return SymbolCatalogEntry(symbol, name=name, kind='Stock', venue='NSE')


# ------------------------------------------------------------------- /search --

def test_search_empty_query_returns_400(client):
    response = client.post('/equities/search', json={'query': '   '})
    assert response.status_code == 400
    assert response.json()['error'] == 'invalid_request'


def test_search_invalid_exchange_returns_400(client):
    response = client.post('/equities/search', json={'query': 'REL', 'exchange': 'NYSE'})
    assert response.status_code == 400


def test_search_ranks_ticker_prefix_before_company_substring(client, monkeypatch, sqlite_candles):
    entries = [
        ('NSE', _catalog_entry('RELCAPITAL-INR', 'Reliance Capital Ltd')),
        ('NSE', _catalog_entry('RELIANCE-INR', 'Reliance Industries Ltd')),
        # Doesn't start with "REL" but the company name contains it.
        ('NSE', _catalog_entry('TCS-INR', 'Something REL Corp')),
    ]
    monkeypatch.setattr(ec, '_load_catalog', lambda exchanges: (entries, True))

    response = client.post('/equities/search', json={'query': 'rel', 'exchange': 'NSE'})

    assert response.status_code == 200
    body = response.json()
    assert body['catalog_available'] is True
    tickers = [r['ticker'] for r in body['results']]
    # Ticker-prefix hits (alphabetical) before the company-substring hit.
    assert tickers == ['NSE:RELCAPITAL', 'NSE:RELIANCE', 'NSE:TCS']
    assert body['results'][0]['company'] == 'Reliance Capital Ltd'
    assert body['results'][0]['imported'] is None


def test_search_reports_imported_range_for_matches(client, monkeypatch, sqlite_candles):
    entries = [('NSE', _catalog_entry('RELIANCE-INR', 'Reliance Industries Ltd'))]
    monkeypatch.setattr(ec, '_load_catalog', lambda exchanges: (entries, True))
    _store([
        _row('NSE', 'RELIANCE-INR', date(2025, 1, 1), close=100),
        _row('NSE', 'RELIANCE-INR', date(2025, 1, 5), close=110),
    ])

    response = client.post('/equities/search', json={'query': 'RELIANCE'})

    assert response.status_code == 200
    imported = response.json()['results'][0]['imported']
    assert imported == {'start_date': '2025-01-01', 'end_date': '2025-01-05'}


def test_search_falls_back_to_imported_symbols_when_catalog_unavailable(client, monkeypatch, sqlite_candles):
    monkeypatch.setattr(ec, '_load_catalog', lambda exchanges: ([], False))
    _store([_row('NSE', 'RELIANCE-INR', date(2025, 1, 1), close=100)])
    _store([_row('BSE', 'RELIANCE-EQ', date(2025, 1, 1), close=100)])

    response = client.post('/equities/search', json={'query': 'REL', 'exchange': 'NSE'})

    assert response.status_code == 200
    body = response.json()
    assert body['catalog_available'] is False
    assert [r['symbol'] for r in body['results']] == ['RELIANCE-INR']
    assert body['results'][0]['company'] is None


# -------------------------------------------------------------------- /stock --

def test_stock_invalid_symbol_returns_400(client, sqlite_candles):
    response = client.post('/equities/stock', json={'symbol': 'RE LIANCE', 'exchange': 'NSE'})
    assert response.status_code == 400


def test_stock_not_imported_returns_null_imported_and_stats(client, monkeypatch, sqlite_candles):
    monkeypatch.setattr(ec, '_load_catalog', lambda exchanges: ([('NSE', _catalog_entry('RELIANCE-INR', 'Reliance Industries Ltd'))], True))
    monkeypatch.setattr(ec, '_cached_universe_members', lambda: {})

    response = client.post('/equities/stock', json={'symbol': 'RELIANCE', 'exchange': 'NSE'})

    assert response.status_code == 200
    body = response.json()
    assert body['company'] == 'Reliance Industries Ltd'
    assert body['imported'] is None
    assert body['stats'] is None
    assert body['baskets'] == []


def test_stock_enriches_industry_from_cached_basket_membership(client, monkeypatch, sqlite_candles):
    monkeypatch.setattr(ec, '_load_catalog', lambda exchanges: ([], False))
    member = SimpleNamespace(ticker='RELIANCE', symbol='RELIANCE-INR', company='Reliance Industries Ltd', industry='Energy', series='EQ', isin='INE002A01018')
    monkeypatch.setattr(ec, '_cached_universe_members', lambda: {'RELIANCE-INR': (member, ['NIFTY 50', 'NIFTY 200'])})

    response = client.post('/equities/stock', json={'symbol': 'RELIANCE', 'exchange': 'NSE'})

    assert response.status_code == 200
    body = response.json()
    assert body['industry'] == 'Energy'
    assert body['series'] == 'EQ'
    assert body['isin'] == 'INE002A01018'
    assert body['baskets'] == ['NIFTY 50', 'NIFTY 200']


def test_stock_stats_math_on_synthetic_series(client, monkeypatch, sqlite_candles):
    monkeypatch.setattr(ec, '_load_catalog', lambda exchanges: ([], False))
    monkeypatch.setattr(ec, '_cached_universe_members', lambda: {})

    closes = [100, 110, 90, 95, 130, 80, 85, 90, 95, 100]
    start = date(2025, 1, 1)
    rows = [
        _row('NSE', 'A-INR', start + timedelta(days=i), open=c, high=c + 5, low=c - 5, close=c, volume=1000.0)
        for i, c in enumerate(closes)
    ]
    _store(rows)

    response = client.post('/equities/stock', json={'symbol': 'A', 'exchange': 'NSE'})

    assert response.status_code == 200
    stats = response.json()['stats']
    assert stats['last_close'] == 100
    assert stats['last_date'] == '2025-01-10'
    # Only 10 days of history - every lookback window (>= 1 month) predates it.
    assert stats['returns'] == {'1m': None, '3m': None, '6m': None, '1y': None, '3y': None, '5y': None}
    # last_close == first_close -> flat CAGR.
    assert stats['cagr_pct'] == pytest.approx(0.0)
    assert stats['week_52_high'] == pytest.approx(135.0)  # close=130 (day5) + 5
    assert stats['week_52_low'] == pytest.approx(75.0)  # close=80 (day6) - 5
    assert stats['avg_volume_20d'] == pytest.approx(1000.0)

    closes_arr = np.array(closes, dtype=float)
    expected_returns = np.diff(closes_arr) / closes_arr[:-1]
    expected_vol = 100 * float(np.std(expected_returns, ddof=1)) * (252 ** 0.5)
    assert stats['volatility_pct'] == pytest.approx(expected_vol)

    # Peak 130 on day5 (2025-01-05), trough 80 on day6 (2025-01-06) is the deepest drawdown.
    assert stats['max_drawdown']['pct'] == pytest.approx(100 * (80 / 130 - 1))
    assert stats['max_drawdown']['peak_date'] == '2025-01-05'
    assert stats['max_drawdown']['trough_date'] == '2025-01-06'


# ------------------------------------------------------------------ /candles --

def test_candles_invalid_symbol_returns_400(client, sqlite_candles):
    response = client.post('/equities/candles', json={'symbol': 'RE LIANCE'})
    assert response.status_code == 400


def test_candles_invalid_timeframe_returns_400(client, sqlite_candles):
    response = client.post('/equities/candles', json={'symbol': 'RELIANCE', 'timeframe': '5m'})
    assert response.status_code == 400


def test_candles_not_imported_returns_empty_list(client, sqlite_candles):
    response = client.post('/equities/candles', json={'symbol': 'RELIANCE'})
    assert response.status_code == 200
    body = response.json()
    assert body['candles'] == []
    assert body['truncated'] is False


def test_candles_defaults_to_whole_imported_range_and_reorders_ohlcv(client, sqlite_candles):
    _store([
        _row('NSE', 'A-INR', date(2025, 1, 1), open=10, high=15, low=5, close=12, volume=100),
        _row('NSE', 'A-INR', date(2025, 1, 2), open=12, high=18, low=11, close=17, volume=200),
    ])

    response = client.post('/equities/candles', json={'symbol': 'A', 'timeframe': '1D'})

    assert response.status_code == 200
    body = response.json()
    assert body['truncated'] is False
    assert len(body['candles']) == 2
    # [timestamp_ms, open, high, low, close, volume] - not the DB's own column order.
    first = body['candles'][0]
    assert first[1:] == [10, 15, 5, 12, 100]
    second = body['candles'][1]
    assert second[1:] == [12, 18, 11, 17, 200]


def test_candles_clamps_requested_window_to_imported_range(client, sqlite_candles):
    _store([
        _row('NSE', 'A-INR', date(2025, 1, 5), close=100),
        _row('NSE', 'A-INR', date(2025, 1, 10), close=110),
    ])

    response = client.post('/equities/candles', json={
        'symbol': 'A', 'start_date': '2020-01-01', 'finish_date': '2030-01-01',
    })

    assert response.status_code == 200
    candles = response.json()['candles']
    assert len(candles) == 2


def test_candles_truncates_to_most_recent_rows(client, sqlite_candles):
    start = date(2020, 1, 1)
    rows = [_row('NSE', 'A-INR', start + timedelta(days=i), close=float(i)) for i in range(ec._MAX_CANDLE_ROWS + 5)]
    _store(rows)

    response = client.post('/equities/candles', json={'symbol': 'A'})

    assert response.status_code == 200
    body = response.json()
    assert body['truncated'] is True
    assert len(body['candles']) == ec._MAX_CANDLE_ROWS
    # The most recent rows are kept, not the oldest.
    assert body['candles'][-1][4] == float(ec._MAX_CANDLE_ROWS + 4)


def test_candles_weekly_aggregates_daily_rows(client, sqlite_candles):
    week1 = [
        _row('NSE', 'A-INR', date(2025, 1, 6) + timedelta(days=i), open=100 + i * 10, high=105 + i * 10, low=95 + i * 10, close=102 + i * 10, volume=100)
        for i in range(5)
    ]
    week2 = [
        _row('NSE', 'A-INR', date(2025, 1, 13) + timedelta(days=i), open=200 + i * 10, high=205 + i * 10, low=195 + i * 10, close=202 + i * 10, volume=100)
        for i in range(5)
    ]
    # A single day into week 3 - the same "is this bucket complete yet" rule
    # `candle_service._get_generated_candles` applies for every non-`is_for_jesse` '1W'
    # request: week 2's own bucket only counts as complete once a later bar exists,
    # otherwise it (like a live-forming candle) is excluded rather than returned partial.
    week3_anchor = [_row('NSE', 'A-INR', date(2025, 1, 20), close=300)]
    _store(week1 + week2 + week3_anchor)

    response = client.post('/equities/candles', json={'symbol': 'A', 'timeframe': '1W'})

    assert response.status_code == 200
    candles = response.json()['candles']
    assert len(candles) == 2
    # week1: open=day0's open (100), close=day4's close (142), high=max(105..145)=145,
    # low=min(95..135)=95, volume=sum(100*5)=500.
    assert candles[0][1:] == [100, 145, 95, 142, 500]
    assert candles[1][1:] == [200, 245, 195, 242, 500]


# ---------------------------------------------------------------------- auth --

def test_equities_post_routes_require_auth(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setitem(auth.ENV_VALUES, 'PASSWORD', PASSWORD)
    app = FastAPI()
    app.include_router(ec.router)
    unauthenticated_client = TestClient(app)

    response = unauthenticated_client.post('/equities/search', json={'query': 'REL'})

    assert response.status_code == 401
