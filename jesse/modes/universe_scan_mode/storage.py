"""File-based persistence for universe-scan sessions (dev-pmallapp/jesse#80).

Deliberately NOT a database model, and no migration is added for it: a scan is a
disposable, long-running research report (hundreds of backtests across a stock
universe) that the user re-runs whenever the universe/strategy list changes, not an
object that needs relational queries, joins, or a schema to evolve. Every session
lives entirely as one `session.json` file under
`<cwd>/storage/universe-scans/<id>/`, plus a `cancel` marker file dropped next to it -
so a session can be inspected, copied, or deleted with plain filesystem tools, and
`jesse run` needs no new Alembic/keewee migration to ship this feature.

Concurrency note: only the scan worker process (one at a time - `/start` takes
`start_lock()` around its check-then-create-then-launch sequence, see that function
and `any_running()`) ever calls `update_session()`, and reads (the controller's
`/session`/`/sessions`) only ever see a fully-written file because `_write_atomic()`
writes to a temp file and `os.replace()`s it into place. A 'running' session whose
worker has actually died (crash, or the whole server got SIGKILLed) does not stay
'running' forever: `read_session()`/`list_sessions()` opportunistically reconcile it
whenever the worker's own recorded identity has died (`_reconcile_pid_only()`, no
Redis needed), and `is_running()`/`any_running()` - the controller's actual gating
checks for `/start` and `/delete` - additionally cover the brief pid-less window via
the Redis 'active worker' marker (`_worker_alive()`). Either way this is a lazy,
read-time correction, not a live guarantee.

Container-restart note: this project ships as a Docker image, and a bare pid is not a
stable identity across a container restart - a fresh pid namespace renumbers its first
processes starting near 1 again, so a recorded pid can coincide with an unrelated live
process after a restart and a dead scan would then look "running" forever. On Linux,
`mark_worker_started()` additionally records the worker's pid-namespace inode and its
`/proc` starttime (see `_linux_pid_ns()`/`_linux_proc_start_ticks()`), and
`_worker_process_alive()` treats a pid-namespace mismatch as "definitely dead" without
even checking the pid. That inference relies on one assumption: the only process that
ever reconciles a session is the same `jesse run` server that spawned the worker via
`process_manager` (true here - `is_running()`/`any_running()`/`read_session()` are only
called from this server's own request handlers). Under that assumption, if the reader's
pid namespace differs from the one recorded at start, the server itself must now be
running in a new container/namespace, so the old worker cannot possibly still be alive
in this one.
"""
import json
import os
import re
import shutil
import tempfile
from contextlib import contextmanager
from typing import Optional

import jesse.helpers as jh

try:
    import fcntl
except ImportError:  # Windows has no fcntl; CI's Windows job falls back to no locking
    fcntl = None

SESSIONS_ROOT = 'storage/universe-scans'

# `/start` lets the caller pick the id, and it ends up in `session_dir()`/`session_path()`
# (filesystem paths) and, unescaped, in the page's DOM (see
# jesse/dashboard_patches/universe_scan_page.template.js's running-indicator) - so it
# must be restricted to a small, inert charset rather than just "no path separators".
# Generated ids are `jh.generate_unique_id()` (a uuid4, e.g.
# '550e8400-e29b-41d4-a716-446655440000'), which fits comfortably inside this pattern.
_SESSION_ID_RE = re.compile(r'^[A-Za-z0-9_-]{1,64}$')

# Guards the check-then-create-then-launch sequence in `/start` (see `start_lock()`).
_START_LOCK_PATH = os.path.join(SESSIONS_ROOT, '.start.lock')


class SessionNotFoundError(Exception):
    """Raised by `update_session()` when the session directory was deleted (e.g. via
    `/delete`) while something still held a reference to the id - signals the caller
    to stop, rather than have `update_session()` silently recreate a bare
    `{'id': session_id}` file that would resurrect a session the user explicitly removed.
    """


def is_safe_session_id(session_id: str) -> bool:
    """A session id must match `_SESSION_ID_RE`: this both keeps it a single path
    component (so it can never escape SESSIONS_ROOT via '..' or an embedded '/') and
    restricts it to characters that are inert wherever an id is echoed back verbatim -
    the filesystem, JSON responses, and the page's DOM.
    """
    return bool(_SESSION_ID_RE.match(session_id or ''))


@contextmanager
def start_lock():
    """Exclusive lock around `/start`'s check-then-create-then-launch sequence, so two
    concurrent requests can't both observe "nothing running" (`any_running()`) and both
    launch a worker - a plain read-then-write in the controller would otherwise TOCTOU
    race. Uses an flock'd lock file rather than an in-process lock because
    `process_manager`'s "one running scan" state (Redis + the filesystem) is already
    shared across any number of server processes/workers.

    Windows has no `fcntl`; there this is a no-op context manager, so the "one scan at
    a time" guarantee on Windows relies solely on the (non-atomic) check-then-create in
    the controller, same as before this fix - acceptable because Windows isn't a
    supported deployment target for `jesse run`, only a CI correctness check.
    """
    os.makedirs(SESSIONS_ROOT, exist_ok=True)
    if fcntl is None:
        yield
        return
    fd = os.open(_START_LOCK_PATH, os.O_CREAT | os.O_RDWR)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX)
        yield
    finally:
        fcntl.flock(fd, fcntl.LOCK_UN)
        os.close(fd)


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


def _read_raw(session_id: str) -> Optional[dict]:
    """`session.json` exactly as stored, with no liveness reconciliation - used by
    `update_session()` so a read-modify-write never triggers (or races with) the
    reconciliation side-effect that `read_session()` performs.
    """
    path = session_path(session_id)
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)


def read_session(session_id: str) -> Optional[dict]:
    """`session.json`, lazily reconciled via `_reconcile_pid_only()` so a 'running'
    session whose worker recorded an identity that has since died never reads back as
    'running' forever. This is the cheap, offline-only half of reconciliation - see
    `is_running()`/`_worker_alive()` for the authoritative check (which also covers
    the identity-less window via the Redis marker) that gates `/start` and `/delete`.
    """
    session = _read_raw(session_id)
    if session is None:
        return None
    return _reconcile_pid_only(session)


def update_session(session_id: str, **updates) -> dict:
    """Read-modify-write the session file with a shallow merge of `updates`.

    Raises `SessionNotFoundError` if the session directory no longer exists (e.g. it
    was deleted via `/delete` while a worker still held the id) instead of silently
    recreating a bare `{'id': session_id}` file - callers (namely `run()`) must treat
    that as "stop now", not "start a session from scratch".
    """
    session = _read_raw(session_id)
    if session is None:
        raise SessionNotFoundError(session_id)
    session.update(updates)
    session['updated_at'] = jh.now_to_datetime().isoformat()
    _write_atomic(session_id, session)
    return session


def mark_worker_started(session_id: str, pid: int) -> None:
    """Record the worker's identity in `session.json`, called by `run()` as close to
    its first line as possible. This is what lets `is_running()` tell a genuinely
    running scan apart from a stale 'running' status left by a worker that died
    without updating its own session (SIGKILL, OOM kill, or the whole `jesse run`
    server being killed) - the Redis 'active worker' marker in
    `services/multiprocessing.py` is only cleared by that same server process's
    cleanup thread, so it does not, by itself, survive a hard kill of the server.

    Identity is `{pid, pid_ns, start_ticks}`, not just `pid` - see the module
    docstring's "Container-restart note" for why a bare pid isn't a stable identity in
    a container. `pid_ns`/`start_ticks` are None wherever `/proc` isn't available
    (non-Linux), in which case liveness falls back to a bare pid check.
    """
    update_session(session_id, worker={
        'pid': pid,
        'pid_ns': _linux_pid_ns(),
        'start_ticks': _linux_proc_start_ticks(pid),
    })


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
    """Every session's full JSON, newest first by `updated_at`. Goes through
    `read_session()`, so a listing reconciles any 'running' session whose recorded
    worker identity has died (see `_reconcile_pid_only()`) - but, deliberately, does
    not perform the Redis-backed check for sessions with no identity recorded yet, so
    listing every session never depends on Redis being reachable/configured
    (`is_running()`/`any_running()` still do that check where it matters: gating
    `/start` and `/delete`).
    """
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


def _pid_alive(pid: int) -> bool:
    """Best-effort 'is this OS pid still alive' check with no extra dependency -
    psutil isn't a jesse dependency (not in requirements.txt/setup.py) and isn't
    installed in this project's venv, so it can't be used here without adding one.

    This does not verify the process's identity (e.g. via its start time), only that
    *some* process holds `pid` - so on its own it's vulnerable to pid reuse (see the
    module docstring's "Container-restart note"). It's the fallback `_worker_process_alive()`
    uses when the fuller identity check isn't available (non-Linux, or a session
    written before this fix recorded only a bare pid) - never make a genuinely running
    worker look dead, which is the failure mode that matters most here (a false 'dead'
    would flip a live scan to 'error' out from under it); a false 'alive' after pid
    reuse is comparatively rare and self-heals once the unrelated process also exits.
    """
    if not pid:
        return False
    if os.name == 'nt':
        import ctypes
        PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
        handle = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
        if not handle:
            return False
        ctypes.windll.kernel32.CloseHandle(handle)
        return True
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        # Exists but owned by someone else (unexpected here - the worker is our own
        # child - but "exists" is still the correct answer) rather than "dead".
        return True
    except OSError:
        return False
    return True


def _linux_pid_ns() -> Optional[int]:
    """Inode of this process's pid namespace (`/proc/self/ns/pid`), or None off Linux
    (or wherever `/proc` isn't mounted/readable, e.g. some minimal containers). See the
    module docstring's "Container-restart note" for why this matters: two processes in
    different pid namespaces can share the same pid number without being the same
    process, which is exactly what happens across a container restart.
    """
    try:
        return os.stat('/proc/self/ns/pid').st_ino
    except OSError:
        return None


def _linux_proc_start_ticks(pid: int) -> Optional[int]:
    """`starttime` (field 22, in clock ticks since boot) from `/proc/<pid>/stat`, or
    None if unavailable (non-Linux, no `/proc`, or the pid is already gone). Parsed
    after the last ')' rather than by splitting on spaces, because `comm` (field 2, the
    process name in parens) is whatever the process named itself and can itself
    contain spaces or parentheses - every field up to and including `comm` sits inside
    the outer parens, so the last ')' is the only reliable anchor. `fields[19]` is
    field 22 because splitting after `)` starts the list at field 3 (state).
    """
    try:
        with open(f'/proc/{pid}/stat') as f:
            raw = f.read()
        fields = raw.rsplit(')', 1)[1].split()
        return int(fields[19])
    except (OSError, IndexError, ValueError):
        return None


def _worker_identity(session: dict) -> Optional[dict]:
    """Normalizes `session`'s recorded worker identity to `{'pid', 'pid_ns',
    'start_ticks'}`, whether it was written by this version (`worker` dict, see
    `mark_worker_started()`) or an older one (bare `worker_pid` int) - so a session
    written before this fix keeps reconciling correctly via the pid-only fallback
    instead of erroring on a missing key. None means no worker has been recorded yet
    (the brief `create_session()`..`mark_worker_started()` window).
    """
    worker = session.get('worker')
    if worker is not None:
        return worker
    pid = session.get('worker_pid')
    if pid is None:
        return None
    return {'pid': pid, 'pid_ns': None, 'start_ticks': None}


def _worker_process_alive(identity: dict) -> bool:
    """Liveness of a recorded worker `identity`. Always returns a definite answer
    (never "unknown") - this never touches Redis, only `/proc`/`os.kill`.

    When both `pid_ns` and `start_ticks` were captured (Linux, and the session was
    written by this version), a pid-namespace mismatch means "definitely dead" without
    even looking at the pid - see the module docstring's "Container-restart note" for
    why that inference is safe here. Otherwise (non-Linux, no `/proc`, or a legacy
    session with only a bare pid) falls back to `_pid_alive()`, same as before this fix.
    """
    pid = identity.get('pid')
    pid_ns = identity.get('pid_ns')
    start_ticks = identity.get('start_ticks')
    if pid_ns is not None and start_ticks is not None:
        if _linux_pid_ns() != pid_ns:
            return False
        return _linux_proc_start_ticks(pid) == start_ticks
    return _pid_alive(pid)


def _reconcile_pid_only(session: dict) -> dict:
    """Read/list-path reconciliation: only ever consults the worker's own recorded
    identity via `_worker_process_alive()` - cheap, local, and can never touch Redis or
    raise - so a plain `/session` or `/sessions` read never depends on infrastructure
    beyond the session file itself. A 'running' session with no identity recorded yet
    (the brief window before `run()` reaches `mark_worker_started()`) is left alone
    here; `is_running()`/`any_running()` (the controller's actual gating checks for
    `/start`'s "one scan at a time" and `/delete`'s "can't delete a running scan")
    additionally consult the Redis marker for that window - see `_worker_alive()`.
    """
    if session.get('status') != 'running':
        return session
    identity = _worker_identity(session)
    if identity is None or _worker_process_alive(identity):
        return session
    try:
        return update_session(session['id'], status='error', error='worker process ended unexpectedly')
    except SessionNotFoundError:
        # Deleted out from under us between the raw read and this write - nothing left
        # to reconcile.
        return session


def _worker_alive(session: dict) -> Optional[bool]:
    """Authoritative liveness of `session`'s worker, from an already-loaded session
    dict (never re-reads the file). Prefers the worker's own recorded identity (works
    fully offline, no Redis needed, and is always a definite True/False - see
    `_worker_process_alive()`); when no identity is recorded yet - the brief
    `create_session()`..`mark_worker_started()` window - falls back to the Redis
    'active worker' marker `process_manager.add_task()` sets before starting the child.

    Returns None (rather than False) when that Redis fallback itself fails (client
    unavailable/unconfigured, e.g. running outside a jesse project as in tests, or a
    genuine outage): there is no way to prove the worker is alive, but it hasn't been
    proven dead either, so `is_running()` must not persist 'error' onto a session that
    may simply still be starting up - only a definite False (from the identity check)
    means the caller may do that. Treating "can't tell" as "assume still running"
    would instead let a single Redis hiccup wedge "one scan at a time" forever (every
    future `/start` would keep 409ing).
    """
    identity = _worker_identity(session)
    if identity is not None:
        return _worker_process_alive(identity)
    from jesse.services.multiprocessing import process_manager
    try:
        return session['id'] in process_manager.active_workers
    except Exception as e:  # noqa: BLE001 - any Redis failure must degrade, not crash the request
        jh.debug(f"universe-scan {session.get('id')}: could not check worker liveness ({type(e).__name__}: {e}); treating as unknown")
        return None


def is_running(session_id: str) -> bool:
    """True only when `session_id`'s session is marked 'running' AND `_worker_alive()`
    confirms it. This is the authoritative check the controller gates `/start`'s "one
    scan at a time" rule and `/delete`'s "can't delete a running scan" rule on, so -
    unlike `read_session()`'s cheaper pid-only pass - it also reconciles the pid-less
    window via `_worker_alive()`'s Redis fallback.

    `_worker_alive()` returning None (unknown - e.g. Redis is unreachable during that
    brief window) is treated as "not running" for gating purposes (so a hiccup can't
    permanently 409 every future `/start`), but is deliberately NOT persisted as
    'error' - the session might just still be starting. Only a definite False (the
    worker's own recorded identity says it's dead) is persisted, immediately, so a
    genuine crash can't permanently block new scans either.
    """
    session = _read_raw(session_id)
    if session is None or session.get('status') != 'running':
        return False
    alive = _worker_alive(session)
    if alive is True:
        return True
    if alive is False:
        try:
            update_session(session_id, status='error', error='worker process ended unexpectedly')
        except SessionNotFoundError:
            pass
    return False


def any_running() -> Optional[str]:
    """Id of a currently-running scan, or None. Deliberately calls `is_running()` (not
    just trusting `list_sessions()`'s cheaper pid-only reconciliation) for every
    candidate, so a session stuck in the pid-less window is reconciled here too instead
    of permanently blocking every future `/start`. Callers that need "and nobody else
    can start one while I check" must call this from inside `start_lock()`.
    """
    for session in list_sessions():
        if session.get('status') != 'running':
            continue
        if is_running(session['id']):
            return session['id']
    return None
