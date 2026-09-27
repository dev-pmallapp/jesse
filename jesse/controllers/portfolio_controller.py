"""API for the Portfolio rebalance backtest tool (dev-pmallapp/jesse#91) - see
`jesse.research.portfolio_rebalance`'s module docstring for the simulation itself and
`jesse.services.portfolio_storage`'s for why saved runs are plain JSON files rather than
a DB model.

Unlike Universe Scan, a run here takes milliseconds (about 30 symbols x a few hundred
daily closes), so `/backtest` runs synchronously inside the request - no background
worker, no `process_manager`, no cancel machinery.

Error mapping: `PortfolioCandlesMissing` (raised when a symbol/benchmark has no
imported daily candles over the window) is the only case that gets a 422, carrying the
missing symbols so the caller can offer to import them. `PortfolioCandlesMissing` IS a
`ValueError` subclass (see `jesse.exceptions`), so it must be caught before the generic
`ValueError` branch below - every other bad-input case (bad dates, both/neither
universe+symbols, capital<=0, fee out of range, an unknown universe name, a malformed
symbol/benchmark ticker) is a 400.

India import boundary: this module's top level must never import
`jesse.services.historical_data.india.*` directly - `jesse/__init__.py` imports this
controller at module scope for every `import jesse` (see that package's boot-path
test, mirrored for this module by `tests/test_portfolio_controller.py`). Only
`jesse.services.historical_data.errors` (plain exception classes, no India import - see
`jesse.controllers.exchange_controller` for the same import at module scope) and
`jesse.services.symbol_input` (lazy-imports India only inside its own function bodies)
are safe here; `research`/India calls themselves stay inside each route's body.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from jesse import exceptions
from jesse import helpers as jh
from jesse.exceptions import PortfolioCandlesMissing
from jesse.services import portfolio_storage as storage
from jesse.services.auth import require_auth
from jesse.services.historical_data.errors import HistoricalDataRequestError
from jesse.services.web import (
    PortfolioBacktestRequestJson,
    PortfolioRunDeleteRequestJson,
    PortfolioRunRequestJson,
)

router = APIRouter(prefix="/portfolio", tags=["Portfolio"], dependencies=[Depends(require_auth)])

# Free-text benchmarks are also allowed (passed straight through to
# `portfolio_rebalance(benchmark=...)`, which normalizes them) - these are just the
# tickers worth pre-populating in the page's picker.
_BENCHMARK_CANDIDATES = ('NIFTY200', 'NIFTY', 'NIFTY200ALPHA30')


def _invalid_request(message: str) -> JSONResponse:
    return JSONResponse({'error': 'invalid_request', 'message': message}, status_code=400)


def _not_found(run_id: str) -> JSONResponse:
    return JSONResponse({'error': 'not_found', 'message': f'Run {run_id} not found.'}, status_code=404)


@router.post("/options")
def get_portfolio_options():
    """Form options + sensible defaults for the /portfolio page."""
    from jesse import research  # lazy: research.list_universes() only touches India lazily itself

    today = jh.timestamp_to_date(jh.today_to_timestamp())
    return JSONResponse({
        'exchanges': ['NSE', 'BSE'],
        'universes': list(research.list_universes()),
        'benchmarks': list(_BENCHMARK_CANDIDATES),
        'defaults': {
            'exchange': 'NSE',
            'universe': 'NIFTY200 ALPHA 30',
            'symbols': [],
            'start_date': '2025-01-01',
            'finish_date': today,
            'capital': 15_000,
            'rebalance_days': 15,
            'fee': 0.001,
            'benchmark': None,
        },
    })


@router.post("/backtest")
def run_portfolio_backtest(request_json: PortfolioBacktestRequestJson):
    """Run one equal-weight rebalance backtest synchronously and, unless `save=False`,
    persist it under a server-generated id."""
    from jesse import research  # lazy: portfolio_rebalance only touches India lazily itself

    has_universe = bool(request_json.universe)
    has_symbols = bool(request_json.symbols)
    if has_universe == has_symbols:
        # Catches both "neither" and "both", and (unlike `portfolio_rebalance`'s own
        # `is None` check) also `symbols: []` - an empty list is not a valid basket
        # either, and this gives a clearer message than the ValueError `simulate()`
        # would eventually raise for an empty price map.
        return _invalid_request('Pass exactly one of `universe` or a non-empty `symbols` list.')

    try:
        result = research.portfolio_rebalance(
            start_date=request_json.start_date,
            finish_date=request_json.finish_date,
            # Normalise the unused selector to None: `portfolio_rebalance` checks `is None`,
            # and the page (or /options' own defaults) may send `symbols: []` / `universe: ''`.
            symbols=request_json.symbols or None,
            universe=request_json.universe or None,
            exchange=request_json.exchange,
            capital=request_json.capital,
            rebalance_days=request_json.rebalance_days,
            fee=request_json.fee,
            benchmark=request_json.benchmark,
        )
    except PortfolioCandlesMissing as e:
        return JSONResponse({
            'error': 'missing_candles',
            'message': str(e),
            'missing_symbols': e.symbols,
            'exchange': e.exchange,
            'start_date': e.start_date,
            'finish_date': e.finish_date,
        }, status_code=422)
    except (ValueError, exceptions.InvalidSymbol, HistoricalDataRequestError) as e:
        # ValueError: bad dates (`date.fromisoformat` inside `_parse_date`),
        # both/neither universe+symbols (also caught above, but `portfolio_rebalance`
        # re-checks it), capital<=0, fee out of range, rebalance_days<1 (all raised
        # inside `simulate()`). InvalidSymbol: a malformed symbol/benchmark ticker
        # (`normalize_symbol`). HistoricalDataRequestError: an unknown universe name
        # (`jesse.services.historical_data.india.universes.universe`).
        return _invalid_request(str(e))

    # force_fresh=True: this is a save-time wall-clock stamp for a synchronous API
    # request, not a simulated backtest tick, so it must bypass jh.now()'s default
    # store.app.time path (which needs an initialized engine and would otherwise be
    # stale/unset outside one).
    created_at = jh.now(force_fresh=True)
    run_id = jh.generate_unique_id() if request_json.save else None
    if run_id is not None:
        storage.save_run(run_id, created_at, result)

    return JSONResponse({'id': run_id, 'created_at': created_at, 'result': result})


@router.post("/runs")
def list_portfolio_runs():
    """Every saved run's summary, newest first - the full result is only fetched one at
    a time via /run."""
    return JSONResponse({'runs': storage.list_run_summaries()})


@router.post("/run")
def get_portfolio_run(request_json: PortfolioRunRequestJson):
    if not storage.is_safe_run_id(request_json.id):
        return _not_found(request_json.id)

    record = storage.read_run(request_json.id)
    if record is None:
        return _not_found(request_json.id)

    return JSONResponse(record)


@router.post("/run/delete")
def delete_portfolio_run(request_json: PortfolioRunDeleteRequestJson):
    # Short-circuits on an unsafe id before `delete_run()` ever builds a path from it -
    # see `portfolio_storage.is_safe_run_id`'s docstring.
    if not storage.is_safe_run_id(request_json.id) or not storage.delete_run(request_json.id):
        return _not_found(request_json.id)

    return JSONResponse({'ok': True})
