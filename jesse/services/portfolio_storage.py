"""File-based persistence for saved Portfolio backtest runs (dev-pmallapp/jesse#91).

Deliberately NOT a database model, and no migration is added for it - same rationale as
`jesse.modes.universe_scan_mode.storage`: a saved run is a disposable research artifact
(one equal-weight rebalance backtest, replayable at will from the same inputs) that the
user re-runs whenever the universe/date range/parameters change, not an object that
needs relational queries, joins, or a schema to evolve.

This module is a plain `jesse/services/*.py` helper rather than a `jesse/modes/*_mode/`
package like universe_scan_mode's: a portfolio backtest finishes inside the request that
started it (see the controller's module docstring - no background worker, no
process_manager, no cancel machinery), so there is no "mode" to run, only a run to save,
list, fetch and delete. Each run is one complete, write-once JSON file -
`storage/portfolio-runs/<id>.json`, relative to the project's cwd - with nothing left to
update or reconcile after it is written, unlike a universe-scan session (a directory
that a worker process writes to incrementally over minutes).
"""
import json
import os
import re
import tempfile
from typing import List, Optional

import jesse.helpers as jh

RUNS_ROOT = 'storage/portfolio-runs'

# Ids are generated server-side (`jh.generate_unique_id()`, a uuid4 hex string) but
# still validated on every read/delete before touching the filesystem - same charset
# and rationale as universe_scan_mode.storage's `_SESSION_ID_RE`: this keeps an id a
# single path component (so it can never escape RUNS_ROOT via '..' or an embedded '/')
# and restricts it to characters that are inert wherever it's echoed back verbatim (the
# filesystem, JSON responses, the page's DOM).
_RUN_ID_RE = re.compile(r'^[A-Za-z0-9_-]{1,64}$')


def is_safe_run_id(run_id: str) -> bool:
    return bool(_RUN_ID_RE.match(run_id or ''))


def run_path(run_id: str) -> str:
    return os.path.join(RUNS_ROOT, f'{run_id}.json')


def save_run(run_id: str, created_at: int, result: dict) -> dict:
    """Write `{'id', 'created_at', 'result'}` atomically - temp file + `os.replace()`,
    the same pattern `universe_scan_mode.storage._write_atomic` uses - so a concurrent
    `/runs` listing never observes a half-written file.
    """
    record = {'id': run_id, 'created_at': created_at, 'result': result}
    os.makedirs(RUNS_ROOT, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=RUNS_ROOT, prefix='.run-', suffix='.json.tmp')
    try:
        with os.fdopen(fd, 'w') as f:
            json.dump(record, f)
        # Atomic on POSIX and Windows - a reader never observes a half-written file.
        os.replace(tmp_path, run_path(run_id))
    except BaseException:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise
    return record


def read_run(run_id: str) -> Optional[dict]:
    """The saved run (`{'id', 'created_at', 'result'}`), or None if it doesn't exist OR
    its file is corrupt/unreadable - callers treat both the same way (404): a
    half-written or hand-edited file is not something the API can recover from, and
    "not found" is a more honest response than a 500.
    """
    path = run_path(run_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        jh.debug(f"portfolio run {run_id}: could not read {path} ({type(e).__name__}: {e})")
        return None


def delete_run(run_id: str) -> bool:
    path = run_path(run_id)
    if not os.path.exists(path):
        return False
    os.remove(path)
    return True


def list_run_summaries() -> List[dict]:
    """`{'id', 'created_at', 'config', 'metrics'}` for every saved run, newest first -
    the compact view `/runs` returns; the full result (every equity-curve point, every
    rebalance's trades) is only fetched one at a time via `/run`. Runs are small (about
    30 symbols x a few hundred daily closes), so loading each one fully to extract its
    summary is fine - no separate index file to keep in sync.

    Corrupt/unreadable files are skipped (via `read_run()`) rather than failing the
    whole listing - one bad file must not take down every other saved run.
    """
    if not os.path.isdir(RUNS_ROOT):
        return []
    summaries = []
    for name in os.listdir(RUNS_ROOT):
        if not name.endswith('.json'):
            continue
        run_id = name[:-len('.json')]
        if not is_safe_run_id(run_id):
            continue
        record = read_run(run_id)
        if record is None:
            continue
        result = record.get('result') or {}
        summaries.append({
            'id': record.get('id'),
            'created_at': record.get('created_at'),
            'config': result.get('config'),
            'metrics': result.get('metrics'),
        })
    summaries.sort(key=lambda s: s.get('created_at') or 0, reverse=True)
    return summaries
