"""File-based persistence for universe-scan sessions (dev-pmallapp/jesse#80).

Deliberately NOT a database model, and no migration is added for it: a scan is a
disposable, long-running research report (hundreds of backtests across a stock
universe) that the user re-runs whenever the universe/strategy list changes, not an
object that needs relational queries, joins, or a schema to evolve. Every session
lives entirely as one `session.json` file under
`<cwd>/storage/universe-scans/<id>/`, plus a `cancel` marker file dropped next to it -
so a session can be inspected, copied, or deleted with plain filesystem tools, and
`jesse run` needs no new Alembic/keewee migration to ship this feature.

Concurrency note: only the scan worker process (one at a time - `/start` refuses a
second concurrent scan, see `any_running()`) ever calls `update_session()`, and reads
(the controller's `/session`/`/sessions`) only ever see a fully-written file because
`_write_atomic()` writes to a temp file and `os.replace()`s it into place.
"""
import json
import os
import shutil
import tempfile
from typing import Optional

import jesse.helpers as jh

SESSIONS_ROOT = 'storage/universe-scans'


def is_safe_session_id(session_id: str) -> bool:
    """A session id must be a single path component, so it can never be used to
    escape SESSIONS_ROOT via '..' or an embedded '/'.
    """
    return bool(session_id) and os.path.basename(session_id) == session_id and session_id not in ('.', '..')


def session_dir(session_id: str) -> str:
    return os.path.join(SESSIONS_ROOT, session_id)


def session_path(session_id: str) -> str:
    return os.path.join(session_dir(session_id), 'session.json')


def cancel_flag_path(session_id: str) -> str:
    return os.path.join(session_dir(session_id), 'cancel')


def _write_atomic(session_id: str, session: dict) -> None:
    directory = session_dir(session_id)
    os.makedirs(directory, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=directory, prefix='.session-', suffix='.json.tmp')
    try:
        with os.fdopen(fd, 'w') as f:
            json.dump(session, f)
        # Atomic on POSIX and Windows - a reader never observes a half-written file.
        os.replace(tmp_path, session_path(session_id))
    except BaseException:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise


def create_session(session_id: str, config: dict) -> dict:
    """Create the session directory and its initial `session.json` (status 'running').
    Called by the controller before `process_manager.add_task()` starts the worker, so
    `/session`/`/sessions` can see the session immediately even before the worker's
    first progress update.
    """
    now = jh.now_to_datetime().isoformat()
    session = {
        'id': session_id,
        'created_at': now,
        'updated_at': now,
        'status': 'running',
        'config': config,
        'progress': {'phase': None, 'done': 0, 'total': 0, 'current': None},
        'skipped': [],
        'survivorship_warning': False,
        'summary': [],
        'rows': [],
        'error': None,
    }
    _write_atomic(session_id, session)
    return session


def read_session(session_id: str) -> Optional[dict]:
    path = session_path(session_id)
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)


def update_session(session_id: str, **updates) -> dict:
    """Read-modify-write the session file with a shallow merge of `updates`."""
    session = read_session(session_id) or {'id': session_id}
    session.update(updates)
    session['updated_at'] = jh.now_to_datetime().isoformat()
    _write_atomic(session_id, session)
    return session


def request_cancel(session_id: str) -> None:
    """Drop the cooperative cancel marker; the worker polls `is_cancelled()` between
    units and stops on its own, keeping whatever partial results it already has.
    """
    os.makedirs(session_dir(session_id), exist_ok=True)
    open(cancel_flag_path(session_id), 'a').close()


def is_cancelled(session_id: str) -> bool:
    return os.path.exists(cancel_flag_path(session_id))


def delete_session(session_id: str) -> bool:
    directory = session_dir(session_id)
    if not os.path.isdir(directory):
        return False
    shutil.rmtree(directory)
    return True


def list_sessions() -> list:
    """Every session's full JSON, newest first by `updated_at`."""
    if not os.path.isdir(SESSIONS_ROOT):
        return []
    sessions = []
    for name in os.listdir(SESSIONS_ROOT):
        if not is_safe_session_id(name):
            continue
        session = read_session(name)
        if session:
            sessions.append(session)
    sessions.sort(key=lambda s: s.get('updated_at', ''), reverse=True)
    return sessions


def is_running(session_id: str) -> bool:
    """True only when `session_id` is marked 'running' AND its worker process is
    actually still registered active - reconciles a 'running' status a crashed worker
    or server restart could otherwise leave behind forever (same idea as
    `services/transformers.py`'s live-session status reconciliation).
    """
    session = read_session(session_id)
    if not session or session.get('status') != 'running':
        return False
    from jesse.services.multiprocessing import process_manager
    return session_id in process_manager.active_workers


def any_running() -> Optional[str]:
    """Id of a currently-running scan, or None. Reconciles (and persists) a stale
    'running' status left behind by a crashed/killed worker so one crash doesn't
    permanently block new scans with a false 409.
    """
    for session in list_sessions():
        if session.get('status') != 'running':
            continue
        if is_running(session['id']):
            return session['id']
        update_session(
            session['id'],
            status='error',
            error='Worker process is no longer running (crashed, or the app restarted).',
        )
    return None
