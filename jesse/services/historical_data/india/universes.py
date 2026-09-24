"""Index universes with point-in-time membership (dev-pmallapp/jesse#14, D6 in
docs/india-markets/PLAN.md).

**Why this exists / the survivorship-bias problem:** NSE index constituent files
(fetched below) only ever give *today's* membership - no free source publishes a
dated history of who was added/removed at each quarterly rebalance (spike #41,
docs/india-markets/spike-sources.md §9.2: the Wayback Machine has 1-3 snapshots per
file spanning years, far too sparse against a quarterly cadence). So this module
starts capturing Jesse's own dated snapshot on every fetch, going forward, and is
explicit (`used_current_members=True`) whenever a request predates any real capture
for its rebalance period, rather than silently substituting today's list.

**Snapshot store:** each successful fetch is saved verbatim (the raw CSV bytes, not
re-serialized) as `<snapshot_dir>/<universe-slug>/<YYYY-MM-DD>.csv`, dated by the
fetch date in IST. `snapshot_dir` defaults to `storage/india/universes`, resolved
against the current working directory - same cwd-relative convention as
`archive_cache.DEFAULT_ARCHIVE_CACHE_DIR` (a caller running from a different
directory than the project root will read/write a different, likely empty, store;
this is deliberate, matching every other `storage/...` path in this package, not a
bug). A snapshot already saved for a given date is never overwritten unless the
caller passes `refresh=True`.

**Rebalance periods:** NSE Alpha-family indices rebalance quarterly (Mar/Jun/Sep/Dec)
and the plain Nifty size indices (50/100/200/500) semi-annually (Mar/Sep) - see
`_UNIVERSE_REGISTRY`. A period boundary is the last NSE/BSE trading day (per
`jesse.markets.india.is_trading_day`) of a rebalance month; a period runs from one
boundary (inclusive) to the next (exclusive). Edge case worth calling out: a snapshot
fetched ON a boundary day itself belongs to the NEW period starting that day, not the
one ending the day before - `_period_start`/`_next_boundary` below both derive from
the same boundary calculation, so this falls out automatically rather than needing
special-casing.
"""
import os
import re
import tempfile
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path

import jesse.helpers as jh
from jesse.markets.india import is_trading_day

from ..errors import HistoricalDataRequestError, ProviderSchemaError, ProviderUnavailableError
from .archive_parsing import decode_csv_bytes, field, read_csv_rows_from_text
from .http import IndiaHttpClient
from .nse_indices import _canonical_name, _derive_ticker
from .sessions import IST
from .symbols import to_jesse_symbol

# cwd-relative, like archive_cache.DEFAULT_ARCHIVE_CACHE_DIR - resolved against
# whatever directory the calling process is run from (Jesse's project root), not this
# file's location. Overridable per call via `universe(..., snapshot_dir=...)`.
DEFAULT_SNAPSHOT_DIR = 'storage/india/universes'

_SEMIANNUAL_MONTHS = (3, 9)
_QUARTERLY_MONTHS = (3, 6, 9, 12)

# NSE serves these from nsearchives.nseindia.com/content/indices/<file> - a mirror of
# niftyindices.com's own constituent CSVs, but on a host with no soft-404 problem
# (unmatched slugs there 404 for real; see http.py's module docstring and
# spike-sources.md §9.1). File names are NOT a mechanical transform of the display
# name (confirmed in spike #41 for the Alpha family) - each was looked up individually
# and is hardcoded here, not derived.
_CONSTITUENTS_URL_TEMPLATE = 'https://nsearchives.nseindia.com/content/indices/{filename}'

_REQUIRED_COLUMNS = ('Company Name', 'Industry', 'Symbol', 'Series', 'ISIN Code')


@dataclass(frozen=True)
class UniverseSpec:
    """One registry entry: which file to fetch, how often it rebalances, and the
    display index name used to derive the benchmark ticker (see `_benchmark_symbol`).
    """
    constituents_file: str
    rebalance_months: tuple[int, ...]
    index_name: str


# Canonical universe name (upper-case, single-spaced - see `_normalize_universe_name`)
# -> UniverseSpec. File names verified live against nsearchives.nseindia.com
# (2026-09-24): all seven returned HTTP 200 with Content-Type text/csv and the
# `Company Name,Industry,Symbol,Series,ISIN Code` schema `_parse_members` expects.
_UNIVERSE_REGISTRY: dict[str, UniverseSpec] = {
    'NIFTY 50': UniverseSpec('ind_nifty50list.csv', _SEMIANNUAL_MONTHS, 'Nifty 50'),
    'NIFTY 100': UniverseSpec('ind_nifty100list.csv', _SEMIANNUAL_MONTHS, 'Nifty 100'),
    'NIFTY 200': UniverseSpec('ind_nifty200list.csv', _SEMIANNUAL_MONTHS, 'Nifty 200'),
    'NIFTY 500': UniverseSpec('ind_nifty500list.csv', _SEMIANNUAL_MONTHS, 'Nifty 500'),
    'NIFTY ALPHA 50': UniverseSpec('ind_nifty_Alpha_Index.csv', _QUARTERLY_MONTHS, 'Nifty Alpha 50'),
    'NIFTY100 ALPHA 30': UniverseSpec('ind_nifty100Alpha30list.csv', _QUARTERLY_MONTHS, 'NIFTY100 Alpha 30'),
    'NIFTY200 ALPHA 30': UniverseSpec('ind_nifty200alpha30_list.csv', _QUARTERLY_MONTHS, 'Nifty200 Alpha 30'),
}

# Name lookup is case-/whitespace-insensitive and tolerates '_' in place of a space
# (so 'nifty alpha 50' and 'NIFTY_ALPHA_50' both resolve) - collapse any run of
# whitespace/underscore to a single space, then upper-case, before the registry
# lookup.
_NAME_SEPARATOR_RE = re.compile(r'[\s_]+')
_SLUG_RE = re.compile(r'[^a-z0-9]+')
_SNAPSHOT_FILENAME_RE = re.compile(r'^(\d{4}-\d{2}-\d{2})\.csv$')


@dataclass(frozen=True)
class Member:
    """One constituent row. `ticker` is the bare NSE ticker (user-facing, per #75's
    decision); `symbol` is the internal Jesse symbol (`to_jesse_symbol(ticker)`).
    """
    ticker: str
    symbol: str
    company: str
    industry: str
    series: str
    isin: str


@dataclass(frozen=True)
class Universe:
    """Point-in-time snapshot of one index's membership.

    `used_current_members=True` means `snapshot_date` falls outside `as_of`'s own
    rebalance period (no real snapshot exists for that period yet) - a survivorship-
    bias warning, not an error; see the module docstring.
    """
    name: str
    as_of: date
    snapshot_date: date
    used_current_members: bool
    members: tuple[Member, ...]
    benchmark: tuple[str, str]

    @property
    def tickers(self) -> tuple[str, ...]:
        """Bare, user-facing NSE tickers, e.g. `'RELIANCE'`, `'BAJAJ-AUTO'`."""
        return tuple(member.ticker for member in self.members)

    @property
    def symbols(self) -> tuple[str, ...]:
        """Internal Jesse symbols, e.g. `'RELIANCE-INR'`, `'BAJAJ_AUTO-INR'`."""
        return tuple(member.symbol for member in self.members)


def list_universes() -> tuple[str, ...]:
    """Canonical names of every supported universe, sorted."""
    return tuple(sorted(_UNIVERSE_REGISTRY))


def universe(
    name: str,
    as_of: date | None = None,
    *,
    refresh: bool = False,
    snapshot_dir: str | Path | None = None,
    http_client: IndiaHttpClient | None = None,
) -> Universe:
    """Resolve `name`'s point-in-time membership as of `as_of` (default: today, IST).

    - `as_of=None`: today. Ensures today has a snapshot (fetching one if missing, or
      if `refresh=True`), then resolves exactly like any other `as_of` in today's own
      rebalance period - which that fresh snapshot always is, so this always yields
      `used_current_members=False`.
    - A past `as_of` with a stored snapshot dated <= as_of in the SAME rebalance
      period: uses the latest such snapshot, `used_current_members=False` (real
      point-in-time membership).
    - Otherwise (no snapshot captured yet for that period): uses the nearest stored
      snapshot dated AFTER `as_of` if one exists, else fetches/stores today's,
      `used_current_members=True` in both cases (see module docstring).
    - A future `as_of` raises `ValueError` - there is no way to know tomorrow's
      constituents.
    """
    canonical_name, spec = _resolve_spec(name)
    today = _today()
    resolved_as_of = as_of if as_of is not None else today
    if resolved_as_of > today:
        raise ValueError(f'as_of {resolved_as_of} is in the future; today is {today}')

    client = http_client if http_client is not None else IndiaHttpClient()
    base_dir = Path(snapshot_dir) if snapshot_dir is not None else Path(DEFAULT_SNAPSHOT_DIR)
    universe_dir = base_dir / _slug(canonical_name)

    if resolved_as_of == today:
        # Guarantees today's snapshot is on disk before the period lookup below, so an
        # as_of=None/today call always resolves through the "found in period" branch,
        # never the used_current_members=True fallback.
        _ensure_today_snapshot(canonical_name, spec, universe_dir, client, today, refresh)

    period_start = _period_start(resolved_as_of, spec.rebalance_months)
    period_end = _next_boundary(period_start, spec.rebalance_months)
    stored_dates = _list_snapshot_dates(universe_dir)

    in_period_dates = [d for d in stored_dates if period_start <= d < period_end and d <= resolved_as_of]
    if in_period_dates:
        snapshot_date = max(in_period_dates)
        members = _read_snapshot(universe_dir, snapshot_date, canonical_name)
        return _build_universe(canonical_name, resolved_as_of, snapshot_date, False, members, spec)

    later_dates = sorted(d for d in stored_dates if d > resolved_as_of)
    if later_dates:
        snapshot_date = later_dates[0]
        members = _read_snapshot(universe_dir, snapshot_date, canonical_name)
    else:
        snapshot_date, members = _ensure_today_snapshot(canonical_name, spec, universe_dir, client, today, refresh)

    jh.debug(
        f'{canonical_name} universe: no point-in-time snapshot for {resolved_as_of}, falling back to the '
        f'{snapshot_date} snapshot - survivorship bias may apply'
    )
    return _build_universe(canonical_name, resolved_as_of, snapshot_date, True, members, spec)


def _build_universe(
    name: str,
    as_of: date,
    snapshot_date: date,
    used_current_members: bool,
    members: tuple[Member, ...],
    spec: UniverseSpec,
) -> Universe:
    return Universe(
        name=name,
        as_of=as_of,
        snapshot_date=snapshot_date,
        used_current_members=used_current_members,
        members=members,
        benchmark=('NSE', _benchmark_symbol(spec.index_name)),
    )


def _benchmark_symbol(index_name: str) -> str:
    """The `NseIndexSource` ticker for `index_name` - same derivation
    (`_canonical_name` + `_derive_ticker`) that module uses on `ind_close_all`, so
    `research.get_candles('NSE', universe.benchmark[1], ...)` lines up with whatever
    that source actually published this index's bars under.
    """
    ticker = _derive_ticker(_canonical_name(index_name))
    return to_jesse_symbol(ticker)


def _resolve_spec(name: str) -> tuple[str, UniverseSpec]:
    if not isinstance(name, str) or not name.strip():
        raise HistoricalDataRequestError(f'universe name must be a non-empty string, got {name!r}')
    normalized = _normalize_universe_name(name)
    spec = _UNIVERSE_REGISTRY.get(normalized)
    if spec is None:
        valid = ', '.join(sorted(_UNIVERSE_REGISTRY))
        raise HistoricalDataRequestError(f'Unknown universe {name!r}; valid universes: {valid}')
    return normalized, spec


def _normalize_universe_name(name: str) -> str:
    return _NAME_SEPARATOR_RE.sub(' ', name.strip()).upper()


def _slug(canonical_name: str) -> str:
    return _SLUG_RE.sub('-', canonical_name.lower()).strip('-')


# --------------------------------------------------------------------------------------
# rebalance-period math
# --------------------------------------------------------------------------------------

def _last_trading_day_of_month(year: int, month: int) -> date:
    first_of_next_month = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    day = first_of_next_month - timedelta(days=1)
    while not is_trading_day(day):
        day -= timedelta(days=1)
    return day


def _period_start(d: date, rebalance_months: tuple[int, ...]) -> date:
    """Last rebalance boundary at or before `d` - the boundary day itself starts its
    own (new) period (see module docstring).
    """
    months_sorted = sorted(rebalance_months)
    same_year_candidates = [m for m in months_sorted if m <= d.month]
    if same_year_candidates:
        year, month = d.year, max(same_year_candidates)
    else:
        year, month = d.year - 1, months_sorted[-1]

    boundary = _last_trading_day_of_month(year, month)
    if boundary <= d:
        return boundary
    # `d` sits earlier in `month` than that month's own boundary (e.g. `d` is
    # mid-March and March is itself a rebalance month, whose boundary is ~28th) - step
    # back to the previous rebalance month instead.
    idx = months_sorted.index(month)
    if idx == 0:
        year, month = year - 1, months_sorted[-1]
    else:
        month = months_sorted[idx - 1]
    return _last_trading_day_of_month(year, month)


def _next_boundary(period_start: date, rebalance_months: tuple[int, ...]) -> date:
    """The boundary after `period_start` (which is always itself a boundary date, so
    `period_start.month` is always one of `rebalance_months`).
    """
    months_sorted = sorted(rebalance_months)
    idx = months_sorted.index(period_start.month)
    if idx == len(months_sorted) - 1:
        year, month = period_start.year + 1, months_sorted[0]
    else:
        year, month = period_start.year, months_sorted[idx + 1]
    return _last_trading_day_of_month(year, month)


# --------------------------------------------------------------------------------------
# snapshot store (disk)
# --------------------------------------------------------------------------------------

def _ensure_today_snapshot(
    canonical_name: str,
    spec: UniverseSpec,
    universe_dir: Path,
    client: IndiaHttpClient,
    today: date,
    refresh: bool,
) -> tuple[date, tuple[Member, ...]]:
    path = universe_dir / f'{today.isoformat()}.csv'
    if path.exists() and not refresh:
        return today, _read_snapshot(universe_dir, today, canonical_name)

    url = _CONSTITUENTS_URL_TEMPLATE.format(filename=spec.constituents_file)
    payload = client.get(url, expect='csv')
    if payload is None:
        raise ProviderUnavailableError(f'{canonical_name} constituents file ({spec.constituents_file}) is currently unavailable')

    members = _parse_members(payload, label=f'{canonical_name} constituents ({spec.constituents_file})')
    _write_snapshot(path, payload)
    return today, members


def _read_snapshot(universe_dir: Path, snapshot_date: date, canonical_name: str) -> tuple[Member, ...]:
    payload = (universe_dir / f'{snapshot_date.isoformat()}.csv').read_bytes()
    return _parse_members(payload, label=f'{canonical_name} snapshot {snapshot_date}')


def _list_snapshot_dates(universe_dir: Path) -> list[date]:
    if not universe_dir.exists():
        return []
    dates: list[date] = []
    for entry in universe_dir.iterdir():
        match = _SNAPSHOT_FILENAME_RE.match(entry.name)
        if match is None:
            continue
        dates.append(date.fromisoformat(match.group(1)))
    return dates


def _write_snapshot(path: Path, payload: bytes) -> None:
    """Write the raw fetched bytes verbatim, atomically (mirrors
    `ArchiveFileCache._atomic_write`, archive_cache.py) so a process killed mid-write
    never leaves a half-written snapshot file that a later `path.exists()` check would
    wrongly treat as already-captured-for-today.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(dir=path.parent, prefix=f'.{path.name}.', suffix='.tmp')
    try:
        with os.fdopen(fd, 'wb') as tmp_file:
            tmp_file.write(payload)
        os.replace(tmp_name, path)
    except BaseException:
        try:
            os.unlink(tmp_name)
        except OSError:
            pass
        raise


# --------------------------------------------------------------------------------------
# CSV parsing
# --------------------------------------------------------------------------------------

def _parse_members(payload: bytes, *, label: str) -> tuple[Member, ...]:
    text = decode_csv_bytes(payload, label=label)
    fieldnames, rows = read_csv_rows_from_text(text)
    missing_columns = [column for column in _REQUIRED_COLUMNS if column not in fieldnames]
    if missing_columns:
        raise ProviderSchemaError(f'{label} is missing required column(s) {missing_columns}')

    members: list[Member] = []
    seen_tickers: set[str] = set()
    skipped_row_count = 0
    for row in rows:
        company = field(row, 'Company Name').strip()
        ticker = field(row, 'Symbol').strip().upper()
        if not ticker or not company:
            skipped_row_count += 1
            continue
        try:
            symbol = to_jesse_symbol(ticker)
        except HistoricalDataRequestError:
            # A ticker containing '_' (ambiguous with the '-' encoding) or whitespace -
            # not seen in practice, but a row this malformed is worth skipping rather
            # than failing the whole universe.
            skipped_row_count += 1
            continue
        if ticker in seen_tickers:
            # An NSE data anomaly (same ticker twice in one file), not a naming
            # collision - keep the first occurrence, same pattern as
            # NseIndexSource._parse_index_csv.
            skipped_row_count += 1
            continue
        seen_tickers.add(ticker)
        members.append(
            Member(
                ticker=ticker,
                symbol=symbol,
                company=company,
                industry=field(row, 'Industry').strip(),
                series=field(row, 'Series').strip(),
                isin=field(row, 'ISIN Code').strip(),
            )
        )

    if skipped_row_count:
        jh.debug(f'{label}: skipped {skipped_row_count} malformed/duplicate row(s)')
    return tuple(members)


def _today() -> date:
    """Real current IST date - a module-level function (not a class default) so tests
    can monkeypatch it directly instead of threading a clock through every call.
    """
    return datetime.now(IST).date()
