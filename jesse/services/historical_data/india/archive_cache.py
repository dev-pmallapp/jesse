"""Persistent on-disk cache for India archive sources' raw payload bytes (story #8).

`ArchiveDailySource` already keeps a small in-memory LRU of parsed sessions
(`sources.py`), but that only helps within one process's lifetime - a fresh CLI
invocation (or a bulk `import_sessions` run spanning years) re-downloads every session
from scratch. This cache persists the raw bytes NSE/BSE published for one
`(source_id, file kind, session)` to disk, so a session already seen once never needs
the network again, regardless of process restarts.

Layout: `<base_dir>/<source_id>/<YYYY>/<kind>_<YYYY-MM-DD>.bin` for a fetched payload,
and the same path with a `.absent` suffix (an empty marker file) for a session
confirmed NOT published (a holiday, weekend, or a date before the symbol/exchange
existed). The `.absent` marker is only ever written for an immutable session (see
`ARCHIVE_IMMUTABLE_AFTER_DAYS`) - a recent "not published" answer might just be late
publication, so it is never persisted and the next lookup re-checks the network.
"""
import os
import re
import tempfile
from collections.abc import Callable
from datetime import date, datetime
from pathlib import Path

from .sessions import IST

# NSE/BSE occasionally re-publish or correct a bhavcopy/index file within a day or two
# of the session (observed informally, not from a documented SLA) - a session younger
# than this is always re-fetched from the network rather than trusted from cache, and
# its "not published" answer (if any) is never persisted as a marker either. A session
# this old or older is treated as permanently settled.
ARCHIVE_IMMUTABLE_AFTER_DAYS = 3

# `source_id`/`kind` become path segments/filename prefixes (see `_paths`) - restricted
# to this shape so neither can ever be read as a path separator, `..`, or anything else
# that would let a (currently trusted, but defense-in-depth matters here) caller write
# outside `base_dir`. Every real value used today (`nse_bhavcopy`, `udiff`, ...) already
# satisfies this.
_SAFE_PATH_SEGMENT_RE = re.compile(r'^[a-z0-9_]+$')


def _default_today() -> date:
    # Session dates are IST calendar dates (see sessions.py) - "today" for the
    # immutability window must be computed in IST too, not the host process's local
    # timezone or a naive UTC-only `date.today()`. A host running in, say, US hours
    # would otherwise flip a session between "recent" and "immutable" up to a day away
    # from the actual IST trading calendar this cache protects.
    return datetime.now(IST).date()


class _MissingType:
    """Sentinel distinguishing "nothing cached yet" from a cached `None` (a
    remembered "not published" marker) - `None` itself is a valid, meaningful cache
    value here, so it can't double as "no entry".
    """

    def __repr__(self) -> str:
        return 'MISSING'


MISSING = _MissingType()


class ArchiveFileCache:
    """Caches one raw payload per `(source_id, kind, session)` under `base_dir`.

    `today` is injectable so tests control which sessions count as "immutable"
    without depending on the real calendar date (mirrors every other injectable-clock
    source in this package) - defaults to the real current IST date (see
    `_default_today`).
    """

    def __init__(self, base_dir: str | os.PathLike, *, today: Callable[[], date] | None = None) -> None:
        self._base_dir = Path(base_dir)
        self._today = today if today is not None else _default_today

    def is_immutable(self, session: date) -> bool:
        return (self._today() - session).days >= ARCHIVE_IMMUTABLE_AFTER_DAYS

    def get(self, source_id: str, kind: str, session: date) -> bytes | None | _MissingType:
        """Return cached payload bytes, `None` for a cached "not published" marker, or
        `MISSING` when nothing is cached at all (the caller must fetch from network).
        """
        payload_path, absent_path = self._paths(source_id, kind, session)
        if payload_path.exists():
            return payload_path.read_bytes()
        if absent_path.exists():
            return None
        return MISSING

    def put(self, source_id: str, kind: str, session: date, payload: bytes | None) -> None:
        """Persist a freshly-fetched payload, or (only for an immutable session) a "not
        published" marker, so the next `get` for this key avoids the network entirely.
        """
        payload_path, absent_path = self._paths(source_id, kind, session)
        if payload is None:
            if not self.is_immutable(session):
                return
            payload_path.parent.mkdir(parents=True, exist_ok=True)
            self._atomic_write(absent_path, b'')
            return

        payload_path.parent.mkdir(parents=True, exist_ok=True)
        self._atomic_write(payload_path, payload)
        # A payload that arrives after an earlier "not published" marker (a late
        # publication, or the file appearing right at the edge of the immutability
        # window) must win - clear the stale marker so future lookups return this
        # fresh payload instead of the old "absent" answer.
        if absent_path.exists():
            absent_path.unlink()

    def invalidate(self, source_id: str, kind: str, session: date) -> None:
        """Delete a corrupt cached payload so the next `get`/`put` re-fetches it."""
        payload_path, _absent_path = self._paths(source_id, kind, session)
        payload_path.unlink(missing_ok=True)

    def _paths(self, source_id: str, kind: str, session: date) -> tuple[Path, Path]:
        if not _SAFE_PATH_SEGMENT_RE.fullmatch(source_id):
            raise ValueError(f'Unsafe archive cache source_id (must match {_SAFE_PATH_SEGMENT_RE.pattern!r}): {source_id!r}')
        if not _SAFE_PATH_SEGMENT_RE.fullmatch(kind):
            raise ValueError(f'Unsafe archive cache kind (must match {_SAFE_PATH_SEGMENT_RE.pattern!r}): {kind!r}')
        directory = self._base_dir / source_id / f'{session.year:04d}'
        stem = directory / f'{kind}_{session.isoformat()}'
        return stem.with_suffix('.bin'), stem.with_suffix('.absent')

    @staticmethod
    def _atomic_write(path: Path, data: bytes) -> None:
        """Write `data` to `path` without ever leaving a partially-written final file
        behind (e.g. a process killed mid-write, or a full disk): write to a sibling
        temp file in the SAME directory (so the final `os.replace` is a same-
        filesystem rename, atomic on POSIX), then rename it onto `path`. A failed
        write removes its own leftover temp file before re-raising, rather than
        leaving stray partial data around `path`'s directory.
        """
        fd, tmp_name = tempfile.mkstemp(dir=path.parent, prefix=f'.{path.name}.', suffix='.tmp')
        try:
            with os.fdopen(fd, 'wb') as tmp_file:
                tmp_file.write(data)
            os.replace(tmp_name, path)
        except BaseException:
            try:
                os.unlink(tmp_name)
            except OSError:
                pass
            raise
