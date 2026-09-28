"""API for the equities-centric dashboard (stock search, stock detail, candles) -
NSE/BSE only, backed by the India equity catalogs (`nse_archives.py`/`bse_archives.py`)
and the index-universe snapshot store (`services/historical_data/india/universes.py`).

India import boundary: same rule as `portfolio_controller`/`universe_scan_controller`
(see their module docstrings) - this module's top level must never import
`jesse.services.historical_data.india.*` directly, since `jesse/__init__.py` imports
every controller at module scope. Only `jesse.services.symbol_input` (lazy-imports
India internally) and `jesse.services.historical_data.errors` (plain exception
classes, no India import) are safe here at module scope; every other India-touching
call stays inside its own function body.

Candle access deliberately bypasses `jesse.services.candle_service.get_candles_from_db`
(see `_daily_candles` below): that helper's finish-date bound is exclusive of the day
itself and its future-date guard is tuned for live-trading-style requests, not for
browsing a window already known (via `get_existing_candles`) to be imported - both
would spuriously reject a window ending "today", a common case for a dashboard.
"""
import bisect
import math
from datetime import date, timedelta
from typing import Optional

import numpy as np
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

import jesse.helpers as jh
from jesse import exceptions
from jesse.repositories import candle_repository
from jesse.services.auth import require_auth
from jesse.services.candle_service import generate_completed_candles_from_observed_minutes
from jesse.services.symbol_input import display_ticker, normalize_symbol
from jesse.services.validators import is_daily_bars_only
from jesse.services.web import (
    EquityCandlesRequestJson,
    EquitySearchRequestJson,
    EquityStockRequestJson,
)

router = APIRouter(prefix="/equities", tags=["Equities"], dependencies=[Depends(require_auth)])

_SUPPORTED_EXCHANGES = ('NSE', 'BSE')
_SUPPORTED_TIMEFRAMES = ('1D', '1W')
# Chart payloads beyond this are truncated to the most recent rows - keeps the response
# bounded for a symbol with decades of daily history.
_MAX_CANDLE_ROWS = 5000
# Trading sessions per year, matching `jesse.research.portfolio_rebalance.SESSIONS_PER_YEAR`
# (NSE/BSE `annualization`, jesse/info.py) - used to annualise daily volatility.
_SESSIONS_PER_YEAR = 252
DAY_MS = 86_400_000


def _invalid_request(message: str) -> JSONResponse:
    return JSONResponse({'error': 'invalid_request', 'message': message}, status_code=400)


def _parse_date(value: str) -> Optional[date]:
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _shift_months(d: date, months: int) -> date:
    """`d` minus `months` calendar months, clamping the day-of-month into the target
    month (e.g. Mar 31 minus 1 month -> Feb 28/29) - avoids a `dateutil` dependency for
    what `research/portfolio_rebalance.py`'s lookback windows only need approximately.
    """
    import calendar

    total = d.month - 1 - months
    year = d.year + total // 12
    month = total % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _price_on_or_before(dates: list, closes: np.ndarray, target: date) -> Optional[float]:
    """Latest close at or before `target`, or None when `target` predates the series
    (the "history too short" case for a lookback return)."""
    idx = bisect.bisect_right(dates, target) - 1
    if idx < 0:
        return None
    return float(closes[idx])


# --------------------------------------------------------------------------------------
# candle access (DB-only, no India network calls)
# --------------------------------------------------------------------------------------

def _daily_candles(exchange: str, symbol: str, start_date: str, end_date: str) -> Optional[np.ndarray]:
    """Every imported 1D candle in `[start_date, end_date]` inclusive, in the DB's own
    column order (timestamp, open, close, high, low, volume) - None when nothing is
    imported in the window. See the module docstring for why this bypasses
    `get_candles_from_db`. Mirrors that function's own WHERE clause (only 1m/NULL-
    timeframe rows - `import_candles_mode` stores every India daily bar under '1m').
    """
    from jesse.models.Candle import Candle

    start_ts = jh.date_to_timestamp(start_date)
    # +DAY_MS - 1: end_date's own session is stamped 09:59 UTC *inside* that calendar
    # day (see historical_data/india/sessions.session_row_timestamp), so the inclusive
    # upper bound must reach just short of the next day, not stop at end_date's midnight.
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


def _weekly_from_daily(exchange: str, daily: np.ndarray) -> np.ndarray:
    """Weekly bars generated from imported daily rows - the same
    `generate_completed_candles_from_observed_minutes` path `candle_service` uses for
    every non-`is_for_jesse` '1W' request, with `monday_weeks` so NSE/BSE weeks span
    Mon-Fri rather than the crypto-default Thu-Wed (see `jh.timeframe_bucket_start`).
    """
    return generate_completed_candles_from_observed_minutes(
        '1W', daily, int(daily[-1, 0]) + 60_000, monday_weeks=is_daily_bars_only(exchange),
    )


def _coverage(exchange: str, symbol: str) -> Optional[dict]:
    """`{start_date, end_date}` of `symbol`'s imported candles, or None if un-imported."""
    for row in candle_repository.get_existing_candles():
        if row['exchange'] == exchange and row['symbol'] == symbol:
            return {'start_date': row['start_date'], 'end_date': row['end_date']}
    return None


# --------------------------------------------------------------------------------------
# equity catalog (India network access - degrades to DB-only search on failure)
# --------------------------------------------------------------------------------------

def _load_catalog(exchanges: list) -> tuple:
    """`(entries, catalog_available)` - `entries` is a list of `(exchange, SymbolCatalogEntry)`
    across every requested exchange whose catalog fetch succeeded; `catalog_available`
    is True as soon as at least one did. A single exchange's provider failing (network
    down, NSE serving HTML instead of CSV, ...) is skipped rather than failing the whole
    search - see `IndiaDailySource.list_symbol_entries`/`ProviderUnavailableError`.
    """
    from jesse.services.historical_data.errors import HistoricalDataProviderError
    from jesse.services.historical_data.india.exchange_providers import BseProvider, NseProvider

    provider_classes = {'NSE': NseProvider, 'BSE': BseProvider}
    entries = []
    catalog_available = False
    for exchange in exchanges:
        provider_cls = provider_classes.get(exchange)
        if provider_cls is None:
            continue
        try:
            for entry in provider_cls().list_symbol_entries():
                entries.append((exchange, entry))
            catalog_available = True
        except HistoricalDataProviderError as e:
            jh.debug(f'{exchange} equity catalog unavailable: {e}')
    return entries, catalog_available


def _cached_universe_members() -> dict:
    """`symbol -> (Member, [universe name, ...])` from every index universe's latest
    CACHED snapshot on disk - never touches the network, unlike `research.universe()`
    (whose `as_of=None` default always ensures/re-fetches today's snapshot). Used to
    enrich a stock's industry/series/isin (not carried by the plain equity catalog -
    see `SymbolCatalogEntry`) and to answer "which baskets contain this stock".
    """
    from pathlib import Path

    from jesse.services.historical_data.india.universes import (
        DEFAULT_SNAPSHOT_DIR,
        _UNIVERSE_REGISTRY,
        _list_snapshot_dates,
        _read_snapshot,
        _slug,
    )

    by_symbol: dict = {}
    for name in sorted(_UNIVERSE_REGISTRY):
        universe_dir = Path(DEFAULT_SNAPSHOT_DIR) / _slug(name)
        dates = _list_snapshot_dates(universe_dir)
        if not dates:
            continue
        for member in _read_snapshot(universe_dir, max(dates), name):
            entry = by_symbol.setdefault(member.symbol, (member, []))
            entry[1].append(name)
    return by_symbol


def _ticker_symbol(exchange: str, symbol: str) -> str:
    return f'{exchange}:{display_ticker(exchange, symbol)}'


# --------------------------------------------------------------------------------------
# /search
# --------------------------------------------------------------------------------------

def _rank_catalog_matches(entries: list, query: str) -> list:
    """Ticker-prefix hits first (alphabetical), then company-substring hits
    (alphabetical) - see the route's docstring."""
    q = query.upper()
    prefix_matches, substring_matches = [], []
    for exchange, entry in entries:
        ticker = display_ticker(exchange, entry.symbol)
        if ticker.upper().startswith(q):
            prefix_matches.append((exchange, entry, ticker))
        elif entry.name and q in entry.name.upper():
            substring_matches.append((exchange, entry, ticker))
    prefix_matches.sort(key=lambda t: t[2])
    substring_matches.sort(key=lambda t: t[2])
    return prefix_matches + substring_matches


def _search_imported_only(exchanges: list, query: str, limit: int) -> list:
    """Fallback search over already-imported symbols when every catalog fetch failed -
    no company name/industry/series/isin is available without the catalog."""
    q = query.upper()
    prefix_matches, substring_matches = [], []
    for row in candle_repository.get_existing_candles():
        if row['exchange'] not in exchanges:
            continue
        ticker = display_ticker(row['exchange'], row['symbol'])
        if ticker.upper().startswith(q):
            prefix_matches.append((row, ticker))
        elif q in ticker.upper():
            substring_matches.append((row, ticker))
    prefix_matches.sort(key=lambda t: t[1])
    substring_matches.sort(key=lambda t: t[1])
    ranked = (prefix_matches + substring_matches)[:limit]
    return [
        {
            'ticker': f"{row['exchange']}:{ticker}",
            'symbol': row['symbol'],
            'exchange': row['exchange'],
            'company': None,
            'industry': None,
            'series': None,
            'isin': None,
            'imported': {'start_date': row['start_date'], 'end_date': row['end_date']},
        }
        for row, ticker in ranked
    ]


@router.post("/search")
def search_equities(request_json: EquitySearchRequestJson):
    """Rank NSE/BSE equity-catalog matches for `query`, cross-referenced with what's
    already imported. `catalog_available: false` means every exchange's catalog fetch
    failed and results are limited to already-imported symbols (ticker match only, no
    company/industry data) - see `_load_catalog`/`_search_imported_only`.
    """
    query = request_json.query.strip()
    if not query:
        return _invalid_request('query must not be empty.')
    if request_json.exchange is not None and request_json.exchange not in _SUPPORTED_EXCHANGES:
        return _invalid_request(f"exchange must be one of {_SUPPORTED_EXCHANGES}.")

    exchanges = [request_json.exchange] if request_json.exchange else list(_SUPPORTED_EXCHANGES)
    entries, catalog_available = _load_catalog(exchanges)

    if not catalog_available:
        return JSONResponse({
            'results': _search_imported_only(exchanges, query, request_json.limit),
            'catalog_available': False,
        })

    ranked = _rank_catalog_matches(entries, query)[: request_json.limit]
    imported_by_key = {
        (row['exchange'], row['symbol']): row
        for row in candle_repository.get_existing_candles()
        if row['exchange'] in exchanges
    }
    results = []
    for exchange, entry, ticker in ranked:
        coverage = imported_by_key.get((exchange, entry.symbol))
        results.append({
            'ticker': f'{exchange}:{ticker}',
            'symbol': entry.symbol,
            'exchange': exchange,
            'company': entry.name,
            'industry': None,
            'series': None,
            'isin': None,
            'imported': {'start_date': coverage['start_date'], 'end_date': coverage['end_date']} if coverage else None,
        })
    return JSONResponse({'results': results, 'catalog_available': True})


# --------------------------------------------------------------------------------------
# /stock
# --------------------------------------------------------------------------------------

def _compute_stats(daily: np.ndarray) -> dict:
    """Stats derived from one symbol's full imported daily series - see the route
    docstring for the field list."""
    timestamps = daily[:, 0]
    closes = daily[:, 2]
    highs = daily[:, 3]
    lows = daily[:, 4]
    volumes = daily[:, 5]
    dates = [date.fromisoformat(jh.timestamp_to_date(int(ts))) for ts in timestamps]

    last_close, last_date = float(closes[-1]), dates[-1]
    first_close, first_date = float(closes[0]), dates[0]

    returns = {}
    for label, months in (('1m', 1), ('3m', 3), ('6m', 6), ('1y', 12), ('3y', 36), ('5y', 60)):
        target = _shift_months(last_date, months)
        price = _price_on_or_before(dates, closes, target)
        returns[label] = 100 * (last_close / price - 1) if price else None

    years = max((last_date - first_date).days, 1) / 365.25
    cagr_pct = 100 * ((last_close / first_close) ** (1 / years) - 1) if first_close > 0 else None

    # Calendar 52-week window (not 252 trading sessions) - the common "52-week hi/lo"
    # convention.
    window_start_idx = bisect.bisect_left(dates, last_date - timedelta(weeks=52))
    week_52_high = float(np.max(highs[window_start_idx:]))
    week_52_low = float(np.min(lows[window_start_idx:]))

    daily_returns = np.diff(closes) / closes[:-1] if len(closes) > 1 else np.array([])
    volatility_pct = (
        100 * float(np.std(daily_returns, ddof=1)) * math.sqrt(_SESSIONS_PER_YEAR)
        if len(daily_returns) > 1 else None
    )

    running_peak, running_peak_date = closes[0], dates[0]
    max_dd, max_dd_peak_date, max_dd_trough_date = 0.0, dates[0], dates[0]
    for i in range(1, len(closes)):
        if closes[i] > running_peak:
            running_peak, running_peak_date = closes[i], dates[i]
        drawdown = closes[i] / running_peak - 1
        if drawdown < max_dd:
            max_dd, max_dd_peak_date, max_dd_trough_date = drawdown, running_peak_date, dates[i]

    return {
        'last_close': last_close,
        'last_date': last_date.isoformat(),
        'returns': returns,
        'cagr_pct': cagr_pct,
        'week_52_high': week_52_high,
        'week_52_low': week_52_low,
        'volatility_pct': volatility_pct,
        'max_drawdown': {
            'pct': 100 * max_dd,
            'peak_date': max_dd_peak_date.isoformat(),
            'trough_date': max_dd_trough_date.isoformat(),
        },
        'avg_volume_20d': float(np.mean(volumes[-20:])),
    }


@router.post("/stock")
def get_equity_stock(request_json: EquityStockRequestJson):
    """One stock's catalog metadata + imported-history stats + which cached index
    baskets currently contain it. `imported`/`stats` are null (still HTTP 200) when the
    symbol hasn't been imported yet - the UI shows an "import data" hint instead of
    erroring."""
    if request_json.exchange not in _SUPPORTED_EXCHANGES:
        return _invalid_request(f"exchange must be one of {_SUPPORTED_EXCHANGES}.")
    try:
        symbol = normalize_symbol(request_json.exchange, request_json.symbol)
    except exceptions.InvalidSymbol as e:
        return _invalid_request(str(e))

    entries, catalog_available = _load_catalog([request_json.exchange])
    catalog_entry = next((entry for exchange, entry in entries if entry.symbol == symbol), None)

    cached_members = _cached_universe_members()
    member_info = cached_members.get(symbol)
    member, baskets = member_info if member_info else (None, [])

    payload = {
        'ticker': _ticker_symbol(request_json.exchange, symbol),
        'symbol': symbol,
        'exchange': request_json.exchange,
        'company': catalog_entry.name if catalog_entry else (member.company if member else None),
        'industry': member.industry if member else None,
        'series': member.series if member else None,
        'isin': member.isin if member else None,
        'catalog_available': catalog_available,
        'baskets': baskets,
    }

    coverage = _coverage(request_json.exchange, symbol)
    if coverage is None:
        return JSONResponse({**payload, 'imported': None, 'stats': None})

    daily = _daily_candles(request_json.exchange, symbol, coverage['start_date'], coverage['end_date'])
    stats = _compute_stats(daily) if daily is not None else None
    return JSONResponse({**payload, 'imported': coverage, 'stats': stats})


# --------------------------------------------------------------------------------------
# /candles
# --------------------------------------------------------------------------------------

@router.post("/candles")
def get_equity_candles(request_json: EquityCandlesRequestJson):
    """OHLCV series for one symbol, defaulting to its whole imported range. Rows are
    `[timestamp_ms, open, high, low, close, volume]`; a series over `_MAX_CANDLE_ROWS`
    is truncated to the most recent rows with `truncated: true`."""
    if request_json.exchange not in _SUPPORTED_EXCHANGES:
        return _invalid_request(f"exchange must be one of {_SUPPORTED_EXCHANGES}.")
    if request_json.timeframe not in _SUPPORTED_TIMEFRAMES:
        return _invalid_request(f"timeframe must be one of {_SUPPORTED_TIMEFRAMES}.")
    try:
        symbol = normalize_symbol(request_json.exchange, request_json.symbol)
    except exceptions.InvalidSymbol as e:
        return _invalid_request(str(e))

    coverage = _coverage(request_json.exchange, symbol)
    if coverage is None:
        return JSONResponse({'symbol': symbol, 'timeframe': request_json.timeframe, 'candles': [], 'truncated': False})

    start_date = request_json.start_date or coverage['start_date']
    finish_date = request_json.finish_date or coverage['end_date']
    if _parse_date(start_date) is None or _parse_date(finish_date) is None:
        return _invalid_request('start_date/finish_date must be in YYYY-MM-DD format.')
    if start_date > finish_date:
        return _invalid_request('start_date must not be after finish_date.')
    # Clamp to what's actually imported - a caller-supplied window outside it would
    # otherwise just silently return nothing.
    start_date = max(start_date, coverage['start_date'])
    finish_date = min(finish_date, coverage['end_date'])

    daily = _daily_candles(request_json.exchange, symbol, start_date, finish_date)
    if daily is None:
        candles = np.zeros((0, 6))
    elif request_json.timeframe == '1W':
        candles = _weekly_from_daily(request_json.exchange, daily)
    else:
        candles = daily

    truncated = len(candles) > _MAX_CANDLE_ROWS
    if truncated:
        candles = candles[-_MAX_CANDLE_ROWS:]

    # Reorder the DB's (ts, open, close, high, low, volume) into the OHLCV convention
    # the spec asks for: (ts, open, high, low, close, volume).
    rows = [[int(c[0]), c[1], c[3], c[4], c[2], c[5]] for c in candles]
    return JSONResponse({
        'symbol': symbol,
        'timeframe': request_json.timeframe,
        'candles': rows,
        'truncated': truncated,
    })
