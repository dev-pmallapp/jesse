"""Tests for the universe-scan mode/controller (dev-pmallapp/jesse#80).

Only covers what's cheap: the pure helpers in `universe_scan_mode/helpers.py`, the
file-based session store, and `/universe-scan/start` request validation (mocking
`research.list_universes`/`process_manager.add_task` so no real backtest/candle fetch
ever runs). The full end-to-end scan is exercised manually / by a future integration
test, not here.
"""
from hashlib import sha256
from importlib import import_module

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from jesse.modes.universe_scan_mode import helpers, storage
from jesse.services import auth

universe_scan_controller = import_module('jesse.controllers.universe_scan_controller')
research = import_module('jesse.research')

PASSWORD = 'universe-scan-test-password'
AUTH_HEADERS = {'Authorization': sha256(PASSWORD.encode('utf-8')).hexdigest()}


# ------------------------------------------------------------------ helpers --

def test_resolve_symbols_unions_universes_and_explicit_symbols_deduplicated():
    symbols, survivorship_warning = helpers.resolve_symbols(
        universe_symbols={'NIFTY100 ALPHA 30': ('RELIANCE-INR', 'TCS-INR')},
        universe_used_current_members={'NIFTY100 ALPHA 30': False},
        explicit_symbols=['tcs', 'INFY'],
        exchange='NSE',
    )
    assert symbols == ['INFY-INR', 'RELIANCE-INR', 'TCS-INR']
    assert survivorship_warning is False


def test_resolve_symbols_flags_survivorship_when_any_universe_used_current_members():
    _, survivorship_warning = helpers.resolve_symbols(
        universe_symbols={'A': ('RELIANCE-INR',), 'B': ('TCS-INR',)},
        universe_used_current_members={'A': False, 'B': True},
        explicit_symbols=[],
        exchange='NSE',
    )
    assert survivorship_warning is True


def test_clip_train_window_pushes_start_later_for_short_history_symbol():
    day = helpers.DAY_MS
    first_candle = 0
    train_start_ts = 100 * day
    train_finish_ts = 500 * day
    # A first candle far enough after train_start that the warm-up buffer pushes the
    # clipped start later than the requested train_start.
    first_candle = 50 * day
    clipped = helpers.clip_train_window(first_candle, train_start_ts, train_finish_ts, warm_up_candles=210, min_train_days=100)
    assert clipped is not None
    assert clipped > train_start_ts


def test_clip_train_window_returns_none_when_under_min_train_days():
    day = helpers.DAY_MS
    # Listed just before train_finish - clipped TRAIN window is far under min_train_days.
    first_candle = 490 * day
    clipped = helpers.clip_train_window(first_candle, 100 * day, 500 * day, warm_up_candles=210, min_train_days=365)
    assert clipped is None


def test_extract_metrics_zeroes_out_when_no_trades():
    metrics = helpers.extract_metrics({'total': 0, 'win_rate': 0.5, 'net_profit_percentage': 12.3})
    assert metrics == {'trades': 0, 'win_rate': 0, 'pnl_pct': 0, 'max_dd': 0, 'sharpe': 0}


def test_build_row_error_row_only_carries_identifying_fields():
    row = helpers.build_row('fixed', 'RsiRevert', 'RELIANCE-INR', train_start='2022-01-01',
                             train_metrics={'trades': 5}, error='boom')
    assert row == {'phase': 'fixed', 'strategy': 'RsiRevert', 'symbol': 'RELIANCE-INR',
                   'train_start': '2022-01-01', 'error': 'boom'}


def test_build_row_flattens_train_and_test_metrics():
    row = helpers.build_row(
        'fixed', 'RsiRevert', 'RELIANCE-INR', train_start='2022-01-01',
        train_metrics={'trades': 5, 'pnl_pct': 1.2}, train_bh_pct=3.4,
        test_metrics={'trades': 10, 'pnl_pct': 5.6}, test_bh_pct=7.8,
    )
    assert row == {
        'phase': 'fixed', 'strategy': 'RsiRevert', 'symbol': 'RELIANCE-INR', 'train_start': '2022-01-01',
        'train_trades': 5, 'train_pnl_pct': 1.2, 'train_bh_pct': 3.4,
        'test_trades': 10, 'test_pnl_pct': 5.6, 'test_bh_pct': 7.8,
    }


def _row(phase, strategy, symbol, test_trades, test_win_rate, test_pnl_pct, test_bh_pct, test_sharpe,
         train_pnl_pct=None, train_bh_pct=None):
    row = {
        'phase': phase, 'strategy': strategy, 'symbol': symbol,
        'test_trades': test_trades, 'test_win_rate': test_win_rate,
        'test_pnl_pct': test_pnl_pct, 'test_bh_pct': test_bh_pct, 'test_sharpe': test_sharpe,
    }
    if train_pnl_pct is not None:
        row['train_pnl_pct'] = train_pnl_pct
        row['train_bh_pct'] = train_bh_pct
    return row


def test_summarize_groups_by_phase_and_strategy_and_pools_win_rate():
    rows = [
        _row('fixed', 'RsiRevert', 'A-INR', test_trades=10, test_win_rate=50, test_pnl_pct=5, test_bh_pct=2, test_sharpe=1.0,
             train_pnl_pct=3, train_bh_pct=1),
        _row('fixed', 'RsiRevert', 'B-INR', test_trades=30, test_win_rate=70, test_pnl_pct=-1, test_bh_pct=10, test_sharpe=0.5,
             train_pnl_pct=6, train_bh_pct=2),
        {'phase': 'fixed', 'strategy': 'RsiRevert', 'symbol': 'C-INR', 'error': 'boom'},
    ]
    summary = helpers.summarize(rows)
    assert len(summary) == 1
    row = summary[0]
    assert row['phase'] == 'fixed'
    assert row['strategy'] == 'RsiRevert'
    assert row['stocks'] == 2
    assert row['trades'] == 40
    # Trade-weighted: (10*50 + 30*70) / 40 = 65.0
    assert row['win_rate_pct'] == 65.0
    assert row['beat_bh'] == 1  # only A-INR's 5% beat its 2% B&H
    assert row['median_pnl_pct'] == 2.0  # median(5, -1)
    assert row['errors'] == 1
    assert row['median_train_pnl_pct'] == 4.5  # median(3, 6)


def test_summarize_returns_empty_list_for_no_rows():
    assert helpers.summarize([]) == []


def test_summarize_all_errors_reports_zero_stocks_and_error_count():
    rows = [
        {'phase': 'optimize', 'strategy': 'Kdj', 'symbol': 'A-INR', 'error': 'no valid candidate'},
        {'phase': 'optimize', 'strategy': 'Kdj', 'symbol': 'B-INR', 'error': 'boom'},
    ]
    summary = helpers.summarize(rows)
    assert summary == [{
        'phase': 'optimize', 'strategy': 'Kdj', 'stocks': 0, 'trades': 0, 'win_rate_pct': 0.0,
        'median_pnl_pct': None, 'median_bh_pct': None, 'beat_bh': 0, 'median_sharpe': None,
        'median_train_pnl_pct': None, 'median_train_bh_pct': None, 'errors': 2,
    }]


# -------------------------------------------------------------------- storage --

@pytest.fixture
def storage_cwd(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    return tmp_path


def test_storage_create_read_update_round_trip(storage_cwd):
    session = storage.create_session('sess-1', {'exchange': 'NSE'})
    assert session['status'] == 'running'

    loaded = storage.read_session('sess-1')
    assert loaded['config'] == {'exchange': 'NSE'}

    storage.update_session('sess-1', status='done', rows=[{'a': 1}])
    loaded = storage.read_session('sess-1')
    assert loaded['status'] == 'done'
    assert loaded['rows'] == [{'a': 1}]
    # updated_at must move forward on every write.
    assert loaded['updated_at'] >= loaded['created_at']


def test_storage_cancel_flag_round_trip(storage_cwd):
    storage.create_session('sess-2', {})
    assert storage.is_cancelled('sess-2') is False
    storage.request_cancel('sess-2')
    assert storage.is_cancelled('sess-2') is True


def test_storage_delete_session(storage_cwd):
    storage.create_session('sess-3', {})
    assert storage.delete_session('sess-3') is True
    assert storage.read_session('sess-3') is None
    assert storage.delete_session('sess-3') is False


@pytest.mark.parametrize('bad_id', ['../escape', 'a/b', '', '.', '..'])
def test_storage_rejects_unsafe_session_ids(bad_id):
    assert storage.is_safe_session_id(bad_id) is False


def test_storage_list_sessions_sorted_newest_first(storage_cwd):
    storage.create_session('old', {})
    storage.update_session('old', updated_at='2020-01-01T00:00:00')
    storage.create_session('new', {})
    storage.update_session('new', updated_at='2030-01-01T00:00:00')
    ids = [s['id'] for s in storage.list_sessions()]
    assert ids == ['new', 'old']


# ------------------------------------------------------------------ controller --

@pytest.fixture
def app_client(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setitem(auth.ENV_VALUES, 'PASSWORD', PASSWORD)
    monkeypatch.setattr(universe_scan_controller.jh, 'validate_cwd', lambda: None)
    monkeypatch.setattr(research, 'list_universes', lambda: ('NIFTY100 ALPHA 30', 'NIFTY200 ALPHA 30'))

    added_tasks = []
    monkeypatch.setattr(
        universe_scan_controller.process_manager, 'add_task',
        lambda func, *args: added_tasks.append((func, args)),
    )

    (tmp_path / 'strategies' / 'RsiRevert').mkdir(parents=True)

    app = FastAPI()
    app.include_router(universe_scan_controller.router)
    client = TestClient(app)
    client.headers.update(AUTH_HEADERS)
    client.added_tasks = added_tasks
    return client


def _valid_payload(**overrides):
    payload = {
        'universes': ['NIFTY100 ALPHA 30'],
        'strategies': ['RsiRevert'],
        'train_start': '2021-11-15',
        'train_finish': '2024-12-31',
        'test_start': '2025-01-01',
        'test_finish': '2025-06-01',
    }
    payload.update(overrides)
    return payload


def test_start_rejects_no_symbols(app_client):
    response = app_client.post('/universe-scan/start', json=_valid_payload(universes=[]))
    assert response.status_code == 400
    assert response.json()['error'] == 'no_symbols'


def test_start_rejects_no_strategies(app_client):
    response = app_client.post('/universe-scan/start', json=_valid_payload(strategies=[]))
    assert response.status_code == 400
    assert response.json()['error'] == 'no_strategies'


def test_start_rejects_no_phase_selected(app_client):
    response = app_client.post('/universe-scan/start', json=_valid_payload(run_fixed=False, run_optimize=False))
    assert response.status_code == 400
    assert response.json()['error'] == 'no_phase'


def test_start_rejects_unknown_universe(app_client):
    response = app_client.post('/universe-scan/start', json=_valid_payload(universes=['NOT A REAL UNIVERSE']))
    assert response.status_code == 400
    assert response.json()['error'] == 'unknown_universe'


def test_start_rejects_unknown_strategy(app_client):
    response = app_client.post('/universe-scan/start', json=_valid_payload(strategies=['NoSuchStrategy']))
    assert response.status_code == 400
    assert response.json()['error'] == 'unknown_strategy'


def test_start_rejects_bad_date_order(app_client):
    response = app_client.post('/universe-scan/start', json=_valid_payload(train_finish='2020-01-01'))
    assert response.status_code == 400
    assert response.json()['error'] == 'bad_date_order'


def test_start_rejects_bad_symbol(app_client):
    response = app_client.post('/universe-scan/start', json=_valid_payload(symbols=['bad symbol']))
    assert response.status_code == 400
    assert response.json()['error'] == 'bad_symbol'


def test_start_happy_path_creates_session_and_queues_task(app_client):
    response = app_client.post('/universe-scan/start', json=_valid_payload(id='my-scan'))
    assert response.status_code == 202
    assert response.json() == {'id': 'my-scan'}

    session = storage.read_session('my-scan')
    assert session['status'] == 'running'
    assert session['config']['strategies'] == ['RsiRevert']

    assert len(app_client.added_tasks) == 1
    _, args = app_client.added_tasks[0]
    assert args[0] == 'my-scan'


def test_start_rejects_second_concurrent_scan(app_client, monkeypatch):
    first = app_client.post('/universe-scan/start', json=_valid_payload(id='first-scan'))
    assert first.status_code == 202

    # `any_running()` reconciles against process_manager.active_workers (a read-only
    # property backed by Redis), so the worker registry must say this session is
    # genuinely still active for the 409 to fire.
    process_manager_module = import_module('jesse.services.multiprocessing')
    monkeypatch.setattr(
        process_manager_module.ProcessManager, 'active_workers',
        property(lambda self: {'first-scan'}),
    )

    second = app_client.post('/universe-scan/start', json=_valid_payload(id='second-scan'))
    assert second.status_code == 409
    assert second.json()['error'] == 'scan_running'


def test_get_session_returns_404_for_unknown_id(app_client):
    response = app_client.post('/universe-scan/session', json={'id': 'does-not-exist'})
    assert response.status_code == 404
    assert response.json()['error'] == 'not_found'


def test_get_session_rejects_path_traversal_id(app_client):
    response = app_client.post('/universe-scan/session', json={'id': '../escape'})
    assert response.status_code == 400
    assert response.json()['error'] == 'bad_id'


def test_cancel_returns_404_for_unknown_id(app_client):
    response = app_client.post('/universe-scan/cancel', json={'id': 'does-not-exist'})
    assert response.status_code == 404
    assert response.json()['error'] == 'not_found'


def test_delete_rejects_path_traversal_id(app_client):
    response = app_client.post('/universe-scan/delete', json={'id': 'a/b'})
    assert response.status_code == 400
    assert response.json()['error'] == 'bad_id'


def test_delete_refuses_a_running_session(app_client, monkeypatch):
    started = app_client.post('/universe-scan/start', json=_valid_payload(id='running-scan'))
    assert started.status_code == 202

    process_manager_module = import_module('jesse.services.multiprocessing')
    monkeypatch.setattr(
        process_manager_module.ProcessManager, 'active_workers',
        property(lambda self: {'running-scan'}),
    )

    response = app_client.post('/universe-scan/delete', json={'id': 'running-scan'})
    assert response.status_code == 409
    assert response.json()['error'] == 'scan_running'
    # Refused delete must leave the session file in place.
    assert storage.read_session('running-scan') is not None


def test_sessions_endpoint_lists_newest_first(app_client, monkeypatch):
    # No worker really starts here, so an empty active-workers set keeps /start's
    # "one scan at a time" check off Redis; 'older' is finished before 'newer' starts
    # because that check (correctly) 409s a second start while one is running.
    process_manager_module = import_module('jesse.services.multiprocessing')
    monkeypatch.setattr(
        process_manager_module.ProcessManager, 'active_workers',
        property(lambda self: set()),
    )

    assert app_client.post('/universe-scan/start', json=_valid_payload(id='older')).status_code == 202
    storage.update_session('older', status='done', updated_at='2020-01-01T00:00:00')
    assert app_client.post('/universe-scan/start', json=_valid_payload(id='newer')).status_code == 202
    storage.update_session('newer', status='done', updated_at='2030-01-01T00:00:00')

    response = app_client.post('/universe-scan/sessions')
    assert response.status_code == 200
    ids = [s['id'] for s in response.json()['sessions']]
    assert ids == ['newer', 'older']


def test_universe_scan_post_routes_require_auth(tmp_path, monkeypatch):
    """The router's `dependencies=[Depends(require_auth)]` must reject every POST
    route when no (or a wrong) Authorization header is sent - independent of the
    `app_client` fixture, which always attaches a valid one."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.setitem(auth.ENV_VALUES, 'PASSWORD', PASSWORD)
    monkeypatch.setattr(universe_scan_controller.jh, 'validate_cwd', lambda: None)

    app = FastAPI()
    app.include_router(universe_scan_controller.router)
    unauthenticated_client = TestClient(app)

    response = unauthenticated_client.post('/universe-scan/sessions')
    assert response.status_code == 401


def test_get_universe_scan_page_serves_html_without_auth():
    """`GET /universe-scan` is registered directly on the shared `fastapi_app` (not
    the auth-gated router) - see `jesse/__init__.py` - so the standalone page loads
    with no Authorization header at all."""
    from jesse.services.web import fastapi_app

    client = TestClient(fastapi_app)
    response = client.get('/universe-scan')
    assert response.status_code == 200
    assert 'text/html' in response.headers['content-type']
