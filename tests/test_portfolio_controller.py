"""Tests for the Portfolio backtest controller (dev-pmallapp/jesse#91).

Runs entirely against `jesse.services.web.fastapi_app` (the same shared app object
`jesse/__init__.py` registers the router on) with `_load_closes` monkeypatched, so no
real database or India network access is ever touched - mirrors
`tests/test_portfolio_rebalance.py`'s approach to stubbing that same function and
`tests/test_universe_scan.py`'s auth/`cwd` fixture pattern.
"""
from datetime import date, timedelta
from hashlib import sha256
from importlib import import_module

import pytest
from fastapi.testclient import TestClient

from jesse.services import auth
from jesse.services.web import fastapi_app

research = import_module('jesse.research')
# `jesse.research.portfolio_rebalance` (the module) is shadowed on the `jesse.research`
# package by the re-exported function of the same name (see `jesse/research/__init__.py`),
# so the module itself must be fetched by its fully-qualified name to monkeypatch the
# module-level `_load_closes` the real function calls internally.
prb_module = import_module('jesse.research.portfolio_rebalance')
storage = import_module('jesse.services.portfolio_storage')

PASSWORD = 'portfolio-controller-test-password'
AUTH_HEADERS = {'Authorization': sha256(PASSWORD.encode('utf-8')).hexdigest()}


def _sessions(start: str, finish: str) -> list:
    """Weekdays between start and finish (inclusive) - mirrors
    test_portfolio_rebalance.py's `sessions()` helper."""
    d, out = date.fromisoformat(start), []
    end = date.fromisoformat(finish)
    while d <= end:
        if d.weekday() < 5:
            out.append(d)
        d += timedelta(days=1)
    return out


def _loader(prices: dict):
    """A fake `_load_closes(exchange, symbol, start, finish)` backed by a plain
    `{symbol: [(date, close), ...]}` map - a symbol absent from `prices` reports no
    candles at all, exactly like an un-imported symbol would."""
    def load(exchange, symbol, start, finish):
        return prices.get(symbol, [])
    return load


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setitem(auth.ENV_VALUES, 'PASSWORD', PASSWORD)
    test_client = TestClient(fastapi_app)
    test_client.headers.update(AUTH_HEADERS)
    return test_client


# ------------------------------------------------------------------- options --

def test_options_returns_exchanges_universes_and_defaults(client, monkeypatch):
    monkeypatch.setattr(research, 'list_universes', lambda: ('NIFTY100 ALPHA 30', 'NIFTY200 ALPHA 30'))

    response = client.post('/portfolio/options', json={})

    assert response.status_code == 200
    body = response.json()
    assert body['exchanges'] == ['NSE', 'BSE']
    assert body['universes'] == ['NIFTY100 ALPHA 30', 'NIFTY200 ALPHA 30']
    assert body['benchmarks'] == ['NIFTY200', 'NIFTY', 'NIFTY200ALPHA30']
    assert body['defaults']['exchange'] == 'NSE'
    assert body['defaults']['universe'] == 'NIFTY200 ALPHA 30'
    assert body['defaults']['capital'] == 15_000
    assert body['defaults']['rebalance_days'] == 15
    assert body['defaults']['fee'] == 0.001
    assert body['defaults']['benchmark'] is None


# ------------------------------------------------------------------ backtest --

def test_backtest_happy_path_with_symbols_saves_and_round_trips_through_runs(client, monkeypatch):
    days = _sessions('2025-01-01', '2025-01-10')
    prices = {
        'A-INR': [(d, 100.0) for d in days],
        'B-INR': [(d, 50.0) for d in days],
    }
    monkeypatch.setattr(prb_module, '_load_closes', _loader(prices))

    payload = {
        'exchange': 'NSE', 'symbols': ['A-INR', 'B-INR'],
        'start_date': '2025-01-01', 'finish_date': '2025-01-10',
        'capital': 3000, 'rebalance_days': 15, 'fee': 0.0, 'save': True,
    }
    response = client.post('/portfolio/backtest', json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body['id'] is not None
    assert isinstance(body['created_at'], int)
    result = body['result']
    assert result['config']['symbols'] == ['A-INR', 'B-INR']
    # capital=3000 split equally over 2 symbols -> target 1500 each; floor(1500/100)=15
    # A shares, floor(1500/50)=30 B shares (fee=0, no rebalance triggers inside this
    # 10-day window, so day0's allocation is also the final holding).
    assert result['final_holdings'] == {'A-INR': 15, 'B-INR': 30}
    assert result['survivorship_warning'] is False
    run_id = body['id']

    runs_response = client.post('/portfolio/runs')
    assert runs_response.status_code == 200
    listed = runs_response.json()['runs']
    assert [r['id'] for r in listed] == [run_id]
    assert listed[0]['config'] == result['config']
    assert listed[0]['metrics'] == result['metrics']

    run_response = client.post('/portfolio/run', json={'id': run_id})
    assert run_response.status_code == 200
    fetched = run_response.json()
    assert fetched['id'] == run_id
    assert fetched['result'] == result

    delete_response = client.post('/portfolio/run/delete', json={'id': run_id})
    assert delete_response.status_code == 200
    assert delete_response.json() == {'ok': True}

    not_found_response = client.post('/portfolio/run', json={'id': run_id})
    assert not_found_response.status_code == 404
    assert not_found_response.json()['error'] == 'not_found'


def test_backtest_missing_candles_returns_422_with_missing_symbols(client, monkeypatch):
    def load(exchange, symbol, start, finish):
        if symbol == 'A-INR':
            return [(date(2025, 1, 1), 100.0)]
        return []

    monkeypatch.setattr(prb_module, '_load_closes', load)

    payload = {
        'symbols': ['A-INR', 'B-INR'],
        'start_date': '2025-01-01', 'finish_date': '2025-01-10',
    }
    response = client.post('/portfolio/backtest', json=payload)

    assert response.status_code == 422
    body = response.json()
    assert body['error'] == 'missing_candles'
    assert body['missing_symbols'] == ['B-INR']
    assert body['exchange'] == 'NSE'
    assert body['start_date'] == '2025-01-01'
    assert body['finish_date'] == '2025-01-10'


def test_backtest_both_universe_and_symbols_returns_400(client):
    payload = {
        'universe': 'NIFTY200 ALPHA 30', 'symbols': ['A-INR'],
        'start_date': '2025-01-01', 'finish_date': '2025-01-10',
    }
    response = client.post('/portfolio/backtest', json=payload)

    assert response.status_code == 400
    assert response.json()['error'] == 'invalid_request'


def test_backtest_neither_universe_nor_symbols_returns_400(client):
    payload = {'start_date': '2025-01-01', 'finish_date': '2025-01-10'}
    response = client.post('/portfolio/backtest', json=payload)

    assert response.status_code == 400
    assert response.json()['error'] == 'invalid_request'


def test_backtest_empty_symbols_list_returns_400(client):
    # `symbols: []` is falsy - the same "nothing selected" case as omitting it, distinct
    # from `portfolio_rebalance`'s own `is None` check (see the controller's comment).
    payload = {'symbols': [], 'start_date': '2025-01-01', 'finish_date': '2025-01-10'}
    response = client.post('/portfolio/backtest', json=payload)

    assert response.status_code == 400
    assert response.json()['error'] == 'invalid_request'


def test_backtest_unknown_universe_returns_400(client, monkeypatch):
    monkeypatch.setattr(research, 'list_universes', lambda: ('NIFTY200 ALPHA 30',))

    payload = {
        'universe': 'NOT A REAL UNIVERSE',
        'start_date': '2025-01-01', 'finish_date': '2025-01-10',
    }
    response = client.post('/portfolio/backtest', json=payload)

    assert response.status_code == 400
    assert response.json()['error'] == 'invalid_request'


def test_backtest_invalid_capital_returns_400(client, monkeypatch):
    days = _sessions('2025-01-01', '2025-01-05')
    monkeypatch.setattr(prb_module, '_load_closes', _loader({'A-INR': [(d, 10.0) for d in days]}))

    payload = {
        'symbols': ['A-INR'], 'start_date': '2025-01-01', 'finish_date': '2025-01-05',
        'capital': 0,
    }
    response = client.post('/portfolio/backtest', json=payload)

    assert response.status_code == 400
    assert response.json()['error'] == 'invalid_request'


def test_backtest_save_false_returns_null_id_and_persists_nothing(client, monkeypatch, tmp_path):
    days = _sessions('2025-01-01', '2025-01-05')
    monkeypatch.setattr(prb_module, '_load_closes', _loader({'A-INR': [(d, 10.0) for d in days]}))

    payload = {
        'symbols': ['A-INR'], 'start_date': '2025-01-01', 'finish_date': '2025-01-05',
        'capital': 100, 'save': False,
    }
    response = client.post('/portfolio/backtest', json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body['id'] is None
    assert not (tmp_path / storage.RUNS_ROOT).exists()

    runs_response = client.post('/portfolio/runs')
    assert runs_response.json()['runs'] == []


# ---------------------------------------------------------------- saved runs --

def test_run_rejects_path_traversal_id_without_touching_filesystem(client, tmp_path):
    response = client.post('/portfolio/run', json={'id': '../escape'})

    assert response.status_code == 404
    assert response.json()['error'] == 'not_found'
    # An unsafe id must never reach a path join - nothing should exist outside tmp_path.
    assert not (tmp_path.parent / 'escape.json').exists()


def test_run_returns_404_for_unknown_id(client):
    response = client.post('/portfolio/run', json={'id': 'does-not-exist'})

    assert response.status_code == 404
    assert response.json()['error'] == 'not_found'


def test_run_delete_rejects_path_traversal_id(client, tmp_path):
    response = client.post('/portfolio/run/delete', json={'id': '../escape'})

    assert response.status_code == 404
    assert response.json()['error'] == 'not_found'
    assert not (tmp_path.parent / 'escape.json').exists()


def test_run_delete_returns_404_for_unknown_id(client):
    response = client.post('/portfolio/run/delete', json={'id': 'does-not-exist'})

    assert response.status_code == 404
    assert response.json()['error'] == 'not_found'


def test_runs_lists_newest_first(client, monkeypatch):
    days = _sessions('2025-01-01', '2025-01-05')
    monkeypatch.setattr(prb_module, '_load_closes', _loader({'A-INR': [(d, 10.0) for d in days]}))
    payload = {'symbols': ['A-INR'], 'start_date': '2025-01-01', 'finish_date': '2025-01-05', 'capital': 100}

    older_id = client.post('/portfolio/backtest', json=payload).json()['id']
    storage.save_run(older_id, 1_000, storage.read_run(older_id)['result'])
    newer_id = client.post('/portfolio/backtest', json=payload).json()['id']
    storage.save_run(newer_id, 2_000, storage.read_run(newer_id)['result'])

    response = client.post('/portfolio/runs')
    ids = [r['id'] for r in response.json()['runs']]
    assert ids == [newer_id, older_id]


# ---------------------------------------------------------------------- auth --

def test_portfolio_post_routes_require_auth(tmp_path, monkeypatch):
    """The router's `dependencies=[Depends(require_auth)]` must reject every POST route
    when no (or a wrong) Authorization header is sent."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.setitem(auth.ENV_VALUES, 'PASSWORD', PASSWORD)

    unauthenticated_client = TestClient(fastapi_app)
    response = unauthenticated_client.post('/portfolio/runs')

    assert response.status_code == 401
