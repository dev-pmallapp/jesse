"""API for named stock groups ("baskets") backing the equities dashboard.

Two kinds exist by design (`kind` on every response), though only `'index'` (NSE index
universes, `services/historical_data/india/universes.py`) is implemented today -
`'mf'` (AMFI mutual-fund holdings) is reserved so the UI's basket list/detail views
don't need a breaking shape change once that lands (see `symbols.py`'s `AMFI_EXCHANGE`
docstring for the same not-yet-wired-up mutual-fund note).

India import boundary: same rule as `portfolio_controller`/`equities_controller` (see
their module docstrings) - this module's top level must never import
`jesse.services.historical_data.india.*` directly. `jesse.services.symbol_input`
(lazy-imports India internally) is safe here at module scope.

`/list` and the "cached snapshot" parts of `/get` deliberately avoid `research.universe()`:
its `as_of=None` default always ensures (fetching if missing) TODAY's snapshot on disk,
which would make listing every basket touch the network on every call. Reading the
snapshot store directly (`_cached_snapshot`) keeps `/list` free-standing and fast;
`/get` still calls `research.universe()` for the full point-in-time resolution the spec
asks for (as_of/refresh support, survivorship-bias flag, benchmark) - a network call
there is expected and mapped to a 502 on failure, not an error.
"""
import bisect
from collections import Counter
from datetime import date, timedelta
from typing import Optional

import numpy as np
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

import jesse.helpers as jh
from jesse.repositories import candle_repository
from jesse.services.auth import require_auth
from jesse.services.symbol_input import display_ticker
from jesse.services.web import BasketGetRequestJson

router = APIRouter(prefix="/baskets", tags=["Baskets"], dependencies=[Depends(require_auth)])

DAY_MS = 86_400_000
# Padding beyond ~260 trading sessions (~1 calendar year) so a return_1y lookback has
# enough calendar slack for NSE holidays/weekends without over-fetching per member.
_RECENT_WINDOW_DAYS = 380


def _invalid_request(message: str) -> JSONResponse:
    return JSONResponse({'error': 'invalid_request', 'message': message}, status_code=400)


def _not_found(basket_id: str) -> JSONResponse:
    return JSONResponse({'error': 'not_found', 'message': f'Basket {basket_id!r} not found.'}, status_code=404)


def _basket_id(canonical_universe_name: str) -> str:
    """URL-safe basket id - the same slug convention the snapshot store already uses on
    disk (`universes._slug`), so an id round-trips back to a universe name (see
    `_basket_ids_by_name`) without a separate stored mapping table."""
    from jesse.services.historical_data.india.universes import _slug
    return _slug(canonical_universe_name)


def _basket_ids_by_name() -> dict:
    from jesse import research  # lazy: research.list_universes() only touches India lazily itself
    return {_basket_id(name): name for name in research.list_universes()}


# --------------------------------------------------------------------------------------
# cached-snapshot access (no network - see module docstring)
# --------------------------------------------------------------------------------------

def _cached_snapshot(canonical_name: str) -> tuple:
    """`(snapshot_date, members, benchmark_tv_symbol)` for `canonical_name`'s latest
    snapshot already on disk. `snapshot_date`/`members` are `(None, ())` when nothing
    has ever been captured for this universe yet (see universes.py's snapshot-store
    docstring) - `benchmark_tv_symbol` is always resolvable, being a pure derivation
    from the index's display name, not something fetched over the network.
    """
    from pathlib import Path

    from jesse.services.historical_data.india.universes import (
        DEFAULT_SNAPSHOT_DIR,
        _UNIVERSE_REGISTRY,
        _benchmark_symbol,
        _list_snapshot_dates,
        _read_snapshot,
        _slug,
    )

    spec = _UNIVERSE_REGISTRY[canonical_name]
    benchmark_symbol = _benchmark_symbol(spec.index_name)
    benchmark_tv = f'NSE:{display_ticker("NSE", benchmark_symbol)}'

    universe_dir = Path(DEFAULT_SNAPSHOT_DIR) / _slug(canonical_name)
    dates = _list_snapshot_dates(universe_dir)
    if not dates:
        return None, (), benchmark_tv

    snapshot_date = max(dates)
    members = _read_snapshot(universe_dir, snapshot_date, canonical_name)
    return snapshot_date, members, benchmark_tv


@router.post("/list")
def list_baskets():
    """Every basket's summary, from cached data only (no network) - see module
    docstring. `snapshot_date`/`member_count` are null for a universe never yet
    fetched (its snapshot store is empty)."""
    from jesse import research  # lazy: research.list_universes() only touches India lazily itself

    baskets = []
    for name in research.list_universes():
        snapshot_date, members, benchmark = _cached_snapshot(name)
        baskets.append({
            'id': _basket_id(name),
            'name': name,
            'kind': 'index',
            'benchmark': benchmark,
            'snapshot_date': snapshot_date.isoformat() if snapshot_date else None,
            'member_count': len(members) if snapshot_date else None,
        })
    return JSONResponse({'baskets': baskets})


# --------------------------------------------------------------------------------------
# /get
# --------------------------------------------------------------------------------------

def _daily_candles(exchange: str, symbol: str, start_date: str, end_date: str) -> Optional[np.ndarray]:
    """Every imported 1D candle in `[start_date, end_date]` inclusive, DB column order
    (timestamp, open, close, high, low, volume). Duplicated from
    `equities_controller._daily_candles` (see that module's docstring for why it
    bypasses `get_candles_from_db`) rather than imported across controllers, keeping
    each controller independently testable/self-contained - the same pattern
    `portfolio_controller`/`universe_scan_controller` already follow.
    """
    from jesse.models.Candle import Candle

    start_ts = jh.date_to_timestamp(start_date)
    finish_ts = jh.date_to_timestamp(end_date) + DAY_MS - 1
    rows = list(Candle.select(
        Candle.timestamp, Candle.open, Candle.close, Candle.high, Candle.low, Candle.volume,
    ).where(
        Candle.exchange == exchange,
        Candle.symbol == symbol,
        (Candle.timeframe == '1m') | (Candle.timeframe.is_null()),
        Candle.timestamp.between(start_ts, finish_ts),
    ).order_by(Candle.timestamp.asc()).tuples())
    if not rows:
        return None
    return np.array(rows, dtype=float)


def _shift_months(d: date, months: int) -> date:
    """See `equities_controller._shift_months` (same duplication rationale)."""
    import calendar

    total = d.month - 1 - months
    year = d.year + total // 12
    month = total % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _last_close_and_return_1y(symbol: str, end_date: str) -> tuple:
    """`(last_close, return_1y_pct)` for one member, from a SINGLE bounded query
    covering only the last ~260 sessions ending at its own imported `end_date` - avoids
    loading a member's full history just to answer this (a basket can have ~200
    members, so this is the dominant cost of `/get`)."""
    start_date = (date.fromisoformat(end_date) - timedelta(days=_RECENT_WINDOW_DAYS)).isoformat()
    daily = _daily_candles('NSE', symbol, start_date, end_date)
    if daily is None:
        return None, None

    last_close = float(daily[-1, 2])
    dates = [date.fromisoformat(jh.timestamp_to_date(int(ts))) for ts in daily[:, 0]]
    target = _shift_months(dates[-1], 12)
    idx = bisect.bisect_right(dates, target) - 1
    if idx < 0:
        # The window doesn't reach back a full year (e.g. a recent listing) - too short
        # a history to compute a 1-year return.
        return last_close, None
    price_1y = float(daily[idx, 2])
    return last_close, 100 * (last_close / price_1y - 1)


@router.post("/get")
def get_basket(request_json: BasketGetRequestJson):
    """One basket's point-in-time membership (via `research.universe()` - real network
    access, see module docstring) plus per-member coverage/last_close/return_1y.
    """
    canonical_name = _basket_ids_by_name().get(request_json.id)
    if canonical_name is None:
        return _not_found(request_json.id)

    as_of = None
    if request_json.as_of:
        try:
            as_of = date.fromisoformat(request_json.as_of)
        except ValueError:
            return _invalid_request('as_of must be in YYYY-MM-DD format.')

    from jesse import research  # lazy: research.universe() only touches India lazily itself
    from jesse.services.historical_data.errors import HistoricalDataProviderError

    try:
        resolved = research.universe(canonical_name, as_of, refresh=request_json.refresh)
    except ValueError as e:
        # A future as_of - universe()'s own guard.
        return _invalid_request(str(e))
    except HistoricalDataProviderError as e:
        return JSONResponse({'error': 'provider_unavailable', 'message': str(e)}, status_code=502)

    members = resolved.members
    member_symbols = {m.symbol for m in members}
    coverage_by_symbol = {
        row['symbol']: row
        for row in candle_repository.get_existing_candles()
        if row['exchange'] == 'NSE' and row['symbol'] in member_symbols
    }

    member_payloads, missing_tickers = [], []
    for member in members:
        coverage = coverage_by_symbol.get(member.symbol)
        if coverage is None:
            missing_tickers.append(member.ticker)
            last_close = return_1y = None
        else:
            last_close, return_1y = _last_close_and_return_1y(member.symbol, coverage['end_date'])
        member_payloads.append({
            'ticker': member.ticker,
            'symbol': member.symbol,
            'company': member.company,
            'industry': member.industry,
            'series': member.series,
            'isin': member.isin,
            'imported': {'start_date': coverage['start_date'], 'end_date': coverage['end_date']} if coverage else None,
            'last_close': last_close,
            'return_1y': return_1y,
        })

    industry_counts = Counter(m.industry for m in members if m.industry)
    industries = [
        {'industry': industry, 'count': count}
        for industry, count in sorted(industry_counts.items(), key=lambda kv: (-kv[1], kv[0]))
    ]

    benchmark_exchange, benchmark_symbol = resolved.benchmark
    return JSONResponse({
        'id': request_json.id,
        'name': canonical_name,
        'kind': 'index',
        'as_of': resolved.as_of.isoformat(),
        'snapshot_date': resolved.snapshot_date.isoformat(),
        'used_current_members': resolved.used_current_members,
        'benchmark': f'{benchmark_exchange}:{display_ticker(benchmark_exchange, benchmark_symbol)}',
        'members': member_payloads,
        'coverage': {
            'imported': len(members) - len(missing_tickers),
            'missing': len(missing_tickers),
            'missing_tickers': missing_tickers,
        },
        'industries': industries,
    })
