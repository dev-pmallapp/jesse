import os
import warnings
from contextlib import asynccontextmanager
from urllib.parse import quote
from fastapi import Request
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from jesse.services.web import fastapi_app
import jesse.helpers as jh
from jesse.services.auth import InvalidAuthError, unauthorized_response

from jesse.services.e2e_database import reset_test_database_if_requested

reset_test_database_if_requested()

# import cli to register the routes. Do NOT remove this import.
from jesse.cli import cli


@fastapi_app.exception_handler(InvalidAuthError)
async def invalid_auth_exception_handler(_request, _exc):
    return unauthorized_response()


# to silent stupid pandas warnings
warnings.simplefilter(action='ignore', category=FutureWarning)

# get the jesse directory
JESSE_DIR = os.path.dirname(os.path.abspath(__file__))

# define lifespan (replaces deprecated @on_event("shutdown"))
@asynccontextmanager
async def lifespan(app):
    yield
    from jesse.services.db import database
    database.close_connection()
    from jesse.services.lsp import terminate_lsp_server
    terminate_lsp_server()

fastapi_app.router.lifespan_context = lifespan

# load homepage
@fastapi_app.get("/")
async def index():
    return FileResponse(f"{JESSE_DIR}/static/index.html")


# The India app (Stocks/Baskets/Scan/Portfolio - dev-pmallapp/jesse#80/#90/#92/#105) is
# a single page *inside* the dashboard SPA (see jesse/dashboard_patches/india_page.
# template.js, dashboard/ng/ and scripts/patch_dashboard.py), reached client-side via
# the sidebar nav items the patcher adds. Upstream's own vue-router runs in HASH mode
# (browser URLs look like `/#/india/stocks`, not `/india/stocks`) - confirmed in a real
# browser, not just from reading the bundle - so a plain path URL never reaches the
# SPA's router at all: it 200s (serving index.html, same shell as "/") with an empty
# hash, which the SPA reads as its default Home route, not India. A hard refresh or a
# direct deep link/bookmark to any /india/* path therefore needs a *redirect* into the
# hash fragment, not just a served shell - `{rest:path}` accepts any sub-path (`:path`
# converters, unlike the default string converter, also match `/`) so every
# dashboard/ng sub-route (`/india/stocks`, `/india/stock/NSE:RELIANCE`, ...) redirects
# to its `/#/india/...` twin; dashboard/ng's own internal router (see dashboard/ng/src/
# router.ts) then resolves which page that hash renders once the SPA has booted. The
# query string (e.g. `?q=x`) is carried over unchanged since it's already
# request-encoded; `rest` itself is re-quoted (keeping `/` and `:` literal - ticker
# paths like `stock/NSE:RELIANCE` need both) rather than trusted as-is, and the
# redirect target is always built as a literal `/#/india...` string (never an
# attacker-controlled scheme/host), so this can never become an open redirect.
# Registered here, before the StaticFiles mount, with no auth dependency: the SPA
# itself decides whether to show the page or its own login gate, based on the auth
# token it finds in localStorage.
@fastapi_app.get("/india")
@fastapi_app.get("/india/{rest:path}")
async def india_spa_page(request: Request, rest: str = ""):
    target = f"/#/india/{quote(rest, safe='/:')}" if rest else "/#/india"
    if request.url.query:
        target = f"{target}?{request.url.query}"
    return RedirectResponse(url=target, status_code=307)


# Pre-#105 bookmarks/links to the old standalone Universe Scan/Portfolio paths -
# redirect (307, preserving method) straight to their new India sub-page's hash route
# (not to plain `/india/...`, which would itself just redirect again via the handler
# above - see its comment on why a path URL can't reach the SPA directly).
@fastapi_app.get("/universe-scan")
async def universe_scan_redirect():
    return RedirectResponse(url="/#/india/scan", status_code=307)


@fastapi_app.get("/portfolio")
async def portfolio_redirect():
    return RedirectResponse(url="/#/india/portfolio", status_code=307)






# # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Routes
# # # # # # # # # # # # # # # # # # # # # # # # # # # #
from jesse.controllers.websocket_controller import router as websocket_router
from jesse.controllers.optimization_controller import router as optimization_router
from jesse.controllers.monte_carlo_controller import router as monte_carlo_router
from jesse.controllers.exchange_controller import router as exchange_router
from jesse.controllers.backtest_controller import router as backtest_router
from jesse.controllers.significance_test_controller import router as significance_test_router
from jesse.controllers.candles_controller import export_router as candles_export_router, router as candles_router
from jesse.controllers.strategy_controller import router as strategy_router
from jesse.controllers.auth_controller import router as auth_router
from jesse.controllers.config_controller import router as config_router
from jesse.controllers.notification_controller import router as notification_router
from jesse.controllers.system_controller import router as system_router
from jesse.controllers.file_controller import router as file_router
from jesse.controllers.lsp_controller import router as lsp_router
from jesse.controllers.closed_trade_controller import router as closed_trade_router
from jesse.controllers.order_controller import router as order_router
from jesse.controllers.tabs_controller import router as tabs_router
from jesse.controllers.period_templates_controller import router as period_templates_router
from jesse.controllers.route_templates_controller import router as route_templates_router
from jesse.controllers.ai_model_controller import router as ai_model_router
from jesse.controllers.universe_scan_controller import router as universe_scan_router
from jesse.controllers.portfolio_controller import router as portfolio_router
from jesse.controllers.equities_controller import router as equities_router
from jesse.controllers.baskets_controller import router as baskets_router
from jesse.services.env import is_test_env

# register routers
fastapi_app.include_router(websocket_router)
fastapi_app.include_router(optimization_router)
fastapi_app.include_router(monte_carlo_router)
fastapi_app.include_router(exchange_router)
fastapi_app.include_router(backtest_router)
fastapi_app.include_router(significance_test_router)
fastapi_app.include_router(candles_router)
fastapi_app.include_router(candles_export_router)
fastapi_app.include_router(strategy_router)
fastapi_app.include_router(auth_router)
fastapi_app.include_router(config_router)
fastapi_app.include_router(notification_router)
fastapi_app.include_router(system_router)
fastapi_app.include_router(file_router)
fastapi_app.include_router(lsp_router)
fastapi_app.include_router(closed_trade_router)
fastapi_app.include_router(order_router)
fastapi_app.include_router(tabs_router)
fastapi_app.include_router(period_templates_router)
fastapi_app.include_router(route_templates_router)
fastapi_app.include_router(ai_model_router)
fastapi_app.include_router(universe_scan_router)
fastapi_app.include_router(portfolio_router)
fastapi_app.include_router(equities_router)
fastapi_app.include_router(baskets_router)

if is_test_env():
    from jesse.controllers.e2e_controller import router as e2e_router
    fastapi_app.include_router(e2e_router)

# # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Live Trade Plugin
# # # # # # # # # # # # # # # # # # # # # # # # # # # #
if jh.has_live_trade_plugin():
    from jesse.controllers.live_controller import router as live_router
    fastapi_app.include_router(live_router)


# # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Static Files (Must be loaded at the end to prevent overlapping with API endpoints)
# # # # # # # # # # # # # # # # # # # # # # # # # # # #
fastapi_app.mount("/", StaticFiles(directory=f"{JESSE_DIR}/static"), name="static")
