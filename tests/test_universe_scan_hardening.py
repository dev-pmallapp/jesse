"""Regression tests for the universe-scan code-review hardening pass
(dev-pmallapp/jesse#80, review of commit 8bdd235e):

- session id charset (stored-XSS / path-safety) - `storage.is_safe_session_id()`
- the `/start` check-then-create-then-launch TOCTOU race - `storage.start_lock()`
- stale-'running' reconciliation when a worker dies without updating its own session -
  `storage.is_running()` / `storage._worker_alive()`
- `update_session()` on a session deleted out from under it - `storage.SessionNotFoundError`

Kept in its own file (not `tests/test_universe_scan.py` / `tests/test_universe_scan_run.py`)
per this task's instructions - those files are owned by a concurrently-running agent.
"""
import os
import subprocess
import sys
from hashlib import sha256
from importlib import import_module

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from jesse.modes.universe_scan_mode import run as run_universe_scan
from jesse.modes.universe_scan_mode import storage
from jesse.services import auth

universe_scan_controller = import_module('jesse.controllers.universe_scan_controller')

PASSWORD = 'universe-scan-hardening-test-password'
AUTH_HEADERS = {'Authorization': sha256(PASSWORD.encode('utf-8')).hexdigest()}


@pytest.fixture
def storage_cwd(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    return tmp_path


@pytest.fixture
def app_client(tmp_path, monkeypatch):
    """Same shape as test_universe_scan.py's own `app_client` fixture - duplicated
    here (not imported) so this file stays a self-contained, cold-start unit.
    """
    monkeypatch.chdir(tmp_path)
    monkeypatch.setitem(auth.ENV_VALUES, 'PASSWORD', PASSWORD)
    monkeypatch.setattr(universe_scan_controller.jh, 'validate_cwd', lambda: None)

    research = import_module('jesse.research')
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


def _spawn_and_reap() -> int:
    """A pid guaranteed to belong to no running process (a real subprocess, started
    and waited-on) - the only portable way to get a "definitely dead" pid without
    guessing at an unused number, which `_pid_alive()`'s docstring already flags as
    theoretically reusable but practically fine for a short-lived test.
    """
    proc = subprocess.Popen([sys.executable, '-c', 'pass'])
    proc.wait()
    return proc.pid


# --------------------------------------------------------------- id charset --

@pytest.mark.parametrize('bad_id', [
    '<img src=x onerror=alert(1)>',  # the stored-XSS payload from the review finding
    'a' * 65,                        # one over the 64-char cap
    'a\x00b',                        # embedded NUL - would raise OSError/ValueError on some OSes
])
def test_is_safe_session_id_rejects_dangerous_or_oversized_ids(bad_id):
    assert storage.is_safe_session_id(bad_id) is False


def test_is_safe_session_id_accepts_generated_uuid4_ids():
    # jh.generate_unique_id() is str(uuid.uuid4()) - the charset must not reject it.
    import jesse.helpers as jh
    for _ in range(5):
        assert storage.is_safe_session_id(jh.generate_unique_id()) is True


@pytest.mark.parametrize('bad_id', [
    '<img src=x onerror=alert(1)>',
    'a' * 65,
])
def test_start_rejects_unsafe_id_with_400(app_client, bad_id):
    response = app_client.post('/universe-scan/start', json=_valid_payload(id=bad_id))
    assert response.status_code == 400
    assert response.json()['error'] == 'bad_id'


def test_start_validates_id_before_checking_for_a_running_scan(app_client, monkeypatch):
    """id validation must happen before the "one scan at a time" check, so a bad id is
    always a 400 - not a 409 that only happens to occur because another scan is
    running (previously, `/start` checked `any_running()` first).
    """
    first = app_client.post('/universe-scan/start', json=_valid_payload(id='first-scan'))
    assert first.status_code == 202

    process_manager_module = import_module('jesse.services.multiprocessing')
    monkeypatch.setattr(
        process_manager_module.ProcessManager, 'active_workers',
        property(lambda self: {'first-scan'}),
    )

    response = app_client.post('/universe-scan/start', json=_valid_payload(id='<img src=x onerror=alert(1)>'))
    assert response.status_code == 400
    assert response.json()['error'] == 'bad_id'


# ------------------------------------------------------------------ start_lock --

def test_start_lock_is_exclusive(storage_cwd):
    """While `start_lock()` is held, a second, independent attempt to acquire the same
    flock non-blockingly must fail - proving the check-then-create-then-launch
    sequence in `/start` is actually serialized, not just "usually fine".
    """
    if storage.fcntl is None:
        pytest.skip('fcntl is not available on this platform (e.g. Windows)')

    with storage.start_lock():
        probe_fd = os.open(storage._START_LOCK_PATH, os.O_CREAT | os.O_RDWR)
        try:
            with pytest.raises(BlockingIOError):
                storage.fcntl.flock(probe_fd, storage.fcntl.LOCK_EX | storage.fcntl.LOCK_NB)
        finally:
            os.close(probe_fd)

    # Released on exit - a fresh non-blocking acquisition must now succeed.
    probe_fd = os.open(storage._START_LOCK_PATH, os.O_CREAT | os.O_RDWR)
    try:
        storage.fcntl.flock(probe_fd, storage.fcntl.LOCK_EX | storage.fcntl.LOCK_NB)
        storage.fcntl.flock(probe_fd, storage.fcntl.LOCK_UN)
    finally:
        os.close(probe_fd)


def test_start_lock_is_a_noop_without_fcntl(storage_cwd, monkeypatch):
    """Windows has no fcntl - `start_lock()` must still work as a plain context
    manager there (see its docstring) rather than raising."""
    monkeypatch.setattr(storage, 'fcntl', None)
    with storage.start_lock():
        pass  # must not raise


# -------------------------------------------------------- stale-running reconcile --

def test_is_running_reconciles_a_dead_worker_pid_to_error(app_client):
    started = app_client.post('/universe-scan/start', json=_valid_payload(id='dead-worker'))
    assert started.status_code == 202

    # Simulate run() having recorded its pid, then dying without ever updating its
    # own session again (SIGKILL, OOM kill, host reboot, ...).
    storage.mark_worker_started('dead-worker', _spawn_and_reap())

    assert storage.is_running('dead-worker') is False

    session = storage.read_session('dead-worker')
    assert session['status'] == 'error'
    assert session['error'] == 'worker process ended unexpectedly'


def test_start_allowed_again_after_dead_worker_is_reconciled(app_client):
    """The whole point of real liveness checking: a crashed worker must not 409 every
    future /start forever."""
    started = app_client.post('/universe-scan/start', json=_valid_payload(id='dead-worker'))
    assert started.status_code == 202
    storage.mark_worker_started('dead-worker', _spawn_and_reap())

    second = app_client.post('/universe-scan/start', json=_valid_payload(id='second-scan'))
    assert second.status_code == 202


def test_is_running_true_for_a_worker_pid_that_is_actually_alive(app_client):
    """The other half of the check: a live pid (this test process itself) must read
    back as running, not get reconciled away."""
    started = app_client.post('/universe-scan/start', json=_valid_payload(id='alive-worker'))
    assert started.status_code == 202
    storage.mark_worker_started('alive-worker', os.getpid())

    assert storage.is_running('alive-worker') is True
    assert storage.read_session('alive-worker')['status'] == 'running'


def test_worker_liveness_check_degrades_instead_of_crashing_when_redis_is_unreachable(app_client, monkeypatch):
    """No pid recorded yet (the brief create_session()..mark_worker_started() window)
    falls back to the Redis marker - if that check itself blows up (unconfigured/down
    Redis), `is_running()` must not 500 the request; it treats "can't tell" as "not
    running" so a crash can't wedge every future /start behind an infra hiccup.
    """
    started = app_client.post('/universe-scan/start', json=_valid_payload(id='no-pid-yet'))
    assert started.status_code == 202

    process_manager_module = import_module('jesse.services.multiprocessing')

    def _boom(self):
        raise RuntimeError('redis is unreachable')
    monkeypatch.setattr(process_manager_module.ProcessManager, 'active_workers', property(_boom))

    assert storage.is_running('no-pid-yet') is False
    assert storage.read_session('no-pid-yet')['status'] == 'error'


def test_list_sessions_never_touches_redis_for_a_session_with_no_recorded_pid(storage_cwd):
    """`list_sessions()`/`read_session()` only ever reconcile via the worker's own
    recorded pid (never Redis) - created directly through `storage`, bypassing the
    controller/`process_manager` entirely, so any Redis access here would raise.
    """
    storage.create_session('never-had-a-worker', {})
    # Must not raise even though process_manager/Redis were never touched.
    sessions = storage.list_sessions()
    assert [s['id'] for s in sessions] == ['never-had-a-worker']
    assert sessions[0]['status'] == 'running'  # left alone - no pid to check


# ------------------------------------------------------------- update_session --

def test_update_session_raises_after_the_session_is_deleted(storage_cwd):
    storage.create_session('to-delete', {'exchange': 'NSE'})
    assert storage.delete_session('to-delete') is True

    with pytest.raises(storage.SessionNotFoundError):
        storage.update_session('to-delete', status='error')


def test_update_session_does_not_recreate_a_deleted_session(storage_cwd):
    storage.create_session('to-delete', {'exchange': 'NSE'})
    storage.delete_session('to-delete')

    with pytest.raises(storage.SessionNotFoundError):
        storage.update_session('to-delete', status='done')

    # The old bug: update_session() would silently write back a bare {'id': ...}
    # session, resurrecting a directory the user explicitly deleted.
    assert storage.read_session('to-delete') is None


def test_run_stops_cleanly_when_session_is_deleted_before_it_can_record_its_pid(storage_cwd, monkeypatch):
    """If the very first thing run() does - `storage.mark_worker_started()` - finds
    the session gone (deleted out from under it), it must stop quietly instead of
    crashing or resurrecting the session file (see update_session()'s docstring).
    """
    def _raise(*_args, **_kwargs):
        raise storage.SessionNotFoundError('gone')
    monkeypatch.setattr(storage, 'mark_worker_started', _raise)

    config = {
        'exchange': 'NSE', 'strategies': [], 'train_start': '2021-01-01',
        'train_finish': '2021-02-01', 'test_start': '2021-02-02', 'test_finish': '2021-02-03',
    }
    run_universe_scan('gone', config)  # must not raise

    assert storage.read_session('gone') is None
