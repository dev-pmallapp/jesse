"""Tests for the baskets controller (named index-universe member groups).

Mounts `baskets_controller.router` on a throwaway `FastAPI()` app (not
`jesse.services.web.fastapi_app`) per the task spec. `/list` is exercised with
`_cached_snapshot` stubbed (so it never touches disk/network - matching the real
route's own no-network contract); `/get` stubs `jesse.research.universe`/
`list_universes` the same way `tests/test_portfolio_controller.py` stubs
`portfolio_rebalance`'s India-touching calls, so no real NSE network access happens
here either.
"""
from datetime import date
from hashlib import sha256
from importlib import import_module
from types import SimpleNamespace

import peewee
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import jesse.helpers as jh
from jesse.controllers import baskets_controller as bc
from jesse.models.Candle import Candle
from jesse.services import auth
from jesse.services.historical_data.errors import ProviderUnavailableError

research = import_module('jesse.research')

PASSWORD = 'baskets-controller-test-password'
AUTH_HEADERS = {'Authorization': sha256(PASSWORD.encode('utf-8')).hexdigest()}

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
    """Bind the Candle model to a throwaway on-disk database - must be file-backed, not
    `:memory:`, because these tests query it through `TestClient`'s threadpool worker
    thread (see the identical fixture/comment in test_equities_controller.py)."""
    db = peewee.SqliteDatabase(str(tmp_path / 'baskets_controller_test.db'))
    with db.bind_ctx([Candle]):
        db.execute_sql(CANDLE_SCHEMA)
        yield db


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setitem(auth.ENV_VALUES, 'PASSWORD', PASSWORD)
    app = FastAPI()
    app.include_router(bc.router)
    test_client = TestClient(app)
    test_client.headers.update(AUTH_HEADERS)
    return test_client


def _row(exchange: str, symbol: str, d: date, close: float):
    ts = jh.date_to_timestamp(d.isoformat())
    return {
        'id': jh.generate_unique_id(), 'exchange': exchange, 'symbol': symbol, 'timeframe': '1m',
        'timestamp': ts, 'open': close, 'close': close, 'high': close, 'low': close, 'volume': 1000.0,
    }


def _member(ticker, symbol, company='Co', industry='IT - Software', series='EQ', isin='INE000A00000'):
    return SimpleNamespace(ticker=ticker, symbol=symbol, company=company, industry=industry, series=series, isin=isin)


def _universe(name, members, benchmark=('NSE', 'NIFTY200-INR'), as_of=None, snapshot_date=None, used_current_members=False):
    return SimpleNamespace(
        name=name,
        as_of=as_of or date(2025, 1, 1),
        snapshot_date=snapshot_date or date(2025, 1, 1),
        used_current_members=used_current_members,
        members=tuple(members),
        benchmark=benchmark,
    )


# --------------------------------------------------------------------- /list --

def test_list_baskets_without_network(client, monkeypatch):
    monkeypatch.setattr(research, 'list_universes', lambda: ('U1', 'U2'))

    def fake_cached_snapshot(name):
        if name == 'U1':
            return date(2025, 1, 1), (SimpleNamespace(), SimpleNamespace(), SimpleNamespace()), 'NSE:U1BENCH'
        return None, (), 'NSE:U2BENCH'

    monkeypatch.setattr(bc, '_cached_snapshot', fake_cached_snapshot)

    def _forbidden(*args, **kwargs):
        raise AssertionError('research.universe() must never be called by /baskets/list (no-network contract)')

    monkeypatch.setattr(research, 'universe', _forbidden)

    response = client.post('/baskets/list', json={})

    assert response.status_code == 200
    baskets = response.json()['baskets']
    assert len(baskets) == 2
    u1 = next(b for b in baskets if b['name'] == 'U1')
    assert u1['id'] == bc._basket_id('U1')
    assert u1['kind'] == 'index'
    assert u1['snapshot_date'] == '2025-01-01'
    assert u1['member_count'] == 3
    assert u1['benchmark'] == 'NSE:U1BENCH'
    u2 = next(b for b in baskets if b['name'] == 'U2')
    assert u2['snapshot_date'] is None
    assert u2['member_count'] is None


# ---------------------------------------------------------------------- /get --

def test_get_unknown_id_returns_404(client, monkeypatch):
    monkeypatch.setattr(research, 'list_universes', lambda: ('U1',))

    response = client.post('/baskets/get', json={'id': 'not-a-real-basket'})

    assert response.status_code == 404
    assert response.json()['error'] == 'not_found'


def test_get_basket_with_partial_coverage(client, monkeypatch, sqlite_candles):
    monkeypatch.setattr(research, 'list_universes', lambda: ('TEST UNIVERSE',))
    members = [
        _member('A', 'A-INR', industry='Energy'),
        _member('B', 'B-INR', industry='IT - Software'),
        _member('C', 'C-INR', industry='Energy'),
    ]
    fake_universe = _universe('TEST UNIVERSE', members, benchmark=('NSE', 'NIFTY200-INR'))
    monkeypatch.setattr(research, 'universe', lambda name, as_of=None, **kwargs: fake_universe)

    # Only A and C are imported; B is not.
    _row_a1 = _row('NSE', 'A-INR', date(2025, 1, 1), close=100)
    _row_a2 = _row('NSE', 'A-INR', date(2025, 1, 10), close=110)
    _row_c1 = _row('NSE', 'C-INR', date(2025, 1, 1), close=50)
    Candle.insert_many([_row_a1, _row_a2, _row_c1]).execute()

    basket_id = bc._basket_id('TEST UNIVERSE')
    response = client.post('/baskets/get', json={'id': basket_id})

    assert response.status_code == 200
    body = response.json()
    assert body['id'] == basket_id
    assert body['name'] == 'TEST UNIVERSE'
    assert body['kind'] == 'index'
    assert body['benchmark'] == 'NSE:NIFTY200'
    assert body['snapshot_date'] == '2025-01-01'
    assert body['used_current_members'] is False

    by_ticker = {m['ticker']: m for m in body['members']}
    assert by_ticker['A']['imported'] == {'start_date': '2025-01-01', 'end_date': '2025-01-10'}
    assert by_ticker['A']['last_close'] == pytest.approx(110.0)
    assert by_ticker['B']['imported'] is None
    assert by_ticker['B']['last_close'] is None
    assert by_ticker['C']['imported'] == {'start_date': '2025-01-01', 'end_date': '2025-01-01'}

    assert body['coverage'] == {'imported': 2, 'missing': 1, 'missing_tickers': ['B']}

    industries = {i['industry']: i['count'] for i in body['industries']}
    assert industries == {'Energy': 2, 'IT - Software': 1}


def test_get_basket_bad_as_of_returns_400(client, monkeypatch):
    monkeypatch.setattr(research, 'list_universes', lambda: ('TEST UNIVERSE',))
    basket_id = bc._basket_id('TEST UNIVERSE')

    response = client.post('/baskets/get', json={'id': basket_id, 'as_of': 'not-a-date'})

    assert response.status_code == 400
    assert response.json()['error'] == 'invalid_request'


def test_get_basket_future_as_of_returns_400(client, monkeypatch):
    monkeypatch.setattr(research, 'list_universes', lambda: ('TEST UNIVERSE',))

    def raise_future(name, as_of=None, **kwargs):
        raise ValueError(f'as_of {as_of} is in the future')

    monkeypatch.setattr(research, 'universe', raise_future)
    basket_id = bc._basket_id('TEST UNIVERSE')

    response = client.post('/baskets/get', json={'id': basket_id, 'as_of': '2099-01-01'})

    assert response.status_code == 400
    assert response.json()['error'] == 'invalid_request'


def test_get_basket_provider_unavailable_returns_502(client, monkeypatch):
    monkeypatch.setattr(research, 'list_universes', lambda: ('TEST UNIVERSE',))

    def raise_unavailable(name, as_of=None, **kwargs):
        raise ProviderUnavailableError('NSE constituents file is currently unavailable')

    monkeypatch.setattr(research, 'universe', raise_unavailable)
    basket_id = bc._basket_id('TEST UNIVERSE')

    response = client.post('/baskets/get', json={'id': basket_id})

    assert response.status_code == 502
    assert response.json()['error'] == 'provider_unavailable'


# ---------------------------------------------------------------------- auth --

def test_baskets_post_routes_require_auth(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setitem(auth.ENV_VALUES, 'PASSWORD', PASSWORD)
    app = FastAPI()
    app.include_router(bc.router)
    unauthenticated_client = TestClient(app)

    response = unauthenticated_client.post('/baskets/list', json={})

    assert response.status_code == 401
