"""
Story: default annualization to the exchange's registered value (commit d9a91573)
when a config omits `'annualization'` explicitly.

Two layers are covered:
1. The helpers themselves - `default_annualization_for_exchange` /
   `resolve_annualization_for_exchange` in `jesse.services.simulation_assumptions`.
2. Every call site that builds a config dict using those helpers (fitness,
   research.backtest, MonteCarloRunner, Optimize, SignificanceTestRunner). Heavy
   sites (ray/DB/network) are exercised without ever actually running a
   backtest/simulation: instances are built via `__new__` with only the
   attributes the method under test touches, and the downstream call (or
   `sync_publish`) is monkeypatched to capture its argument.
"""
from types import SimpleNamespace

import pytest

from jesse.enums import exchanges
from jesse.exceptions import InvalidConfig
from jesse.services.simulation_assumptions import (
    default_annualization_for_exchange,
    resolve_annualization_for_exchange,
)

UNREGISTERED_EXCHANGE = 'Some Unregistered Test Exchange'


# ---------------------------------------------------------------------------
# 1. jesse.services.simulation_assumptions helpers
# ---------------------------------------------------------------------------

@pytest.mark.parametrize('exchange_name', [exchanges.NSE, exchanges.BSE, exchanges.MASSIVE_STOCKS])
def test_default_annualization_for_252_day_exchanges(exchange_name):
    assert default_annualization_for_exchange(exchange_name) == 252


@pytest.mark.parametrize('exchange_name', [exchanges.BINANCE_SPOT, UNREGISTERED_EXCHANGE])
def test_default_annualization_for_365_day_and_unregistered_exchanges(exchange_name):
    assert default_annualization_for_exchange(exchange_name) == 365


def test_resolve_annualization_for_exchange_defaults_to_the_exchanges_registered_value():
    # Omitted 'annualization' -> NSE's registered 252, not the crypto-oriented 365.
    assert resolve_annualization_for_exchange({}, exchanges.NSE) == 252
    # Omitted 'annualization' on a crypto exchange still resolves to 365.
    assert resolve_annualization_for_exchange({}, exchanges.BINANCE_SPOT) == 365


def test_explicit_annualization_wins_over_the_exchange_default():
    # Explicit 365 on NSE (which defaults to 252) is honored.
    assert resolve_annualization_for_exchange({'annualization': 365}, exchanges.NSE) == 365
    # Explicit 252 on a crypto exchange (which defaults to 365) is honored.
    assert resolve_annualization_for_exchange({'annualization': 252}, exchanges.BINANCE_SPOT) == 252


@pytest.mark.parametrize('invalid_value', [360, 252.9, 'foo', True])
def test_resolve_annualization_for_exchange_still_rejects_invalid_values(invalid_value):
    with pytest.raises(InvalidConfig):
        resolve_annualization_for_exchange({'annualization': invalid_value}, exchanges.NSE)


# ---------------------------------------------------------------------------
# 2. Call sites
# ---------------------------------------------------------------------------

# --- jesse.research.backtest._format_config -------------------------------

def _minimal_research_config(exchange: str, **overrides) -> dict:
    config = {
        'starting_balance': 10_000,
        'fee': 0,
        'type': 'spot',
        'exchange': exchange,
        'warm_up_candles': 0,
    }
    config.update(overrides)
    return config


def test_research_backtest_format_config_defaults_to_exchange_annualization():
    from jesse.research.backtest import _format_config

    formatted = _format_config(_minimal_research_config(exchanges.NSE))
    assert formatted['exchanges'][exchanges.NSE]['annualization'] == 252


def test_research_backtest_format_config_keeps_explicit_annualization():
    from jesse.research.backtest import _format_config

    formatted = _format_config(_minimal_research_config(exchanges.NSE, annualization=365))
    assert formatted['exchanges'][exchanges.NSE]['annualization'] == 365


# --- jesse.modes.optimize_mode.fitness._formatted_inputs_for_isolated_backtest ---

def test_fitness_formatted_inputs_defaults_to_exchange_annualization():
    from jesse.modes.optimize_mode.fitness import _formatted_inputs_for_isolated_backtest

    user_config = {
        'exchange': {'balance': 10_000, 'fee': 0, 'type': 'spot'},
        'warm_up_candles': 0,
    }
    routes = [{'exchange': exchanges.NSE, 'strategy': 'Test', 'symbol': 'RELIANCE-INR', 'timeframe': '1D'}]

    inputs = _formatted_inputs_for_isolated_backtest(user_config, routes)
    assert inputs['annualization'] == 252


def test_fitness_formatted_inputs_keeps_explicit_annualization():
    from jesse.modes.optimize_mode.fitness import _formatted_inputs_for_isolated_backtest

    user_config = {
        'exchange': {'balance': 10_000, 'fee': 0, 'type': 'spot', 'annualization': 365},
        'warm_up_candles': 0,
    }
    routes = [{'exchange': exchanges.NSE, 'strategy': 'Test', 'symbol': 'RELIANCE-INR', 'timeframe': '1D'}]

    inputs = _formatted_inputs_for_isolated_backtest(user_config, routes)
    assert inputs['annualization'] == 365


# --- jesse.modes.monte_carlo_mode.MonteCarloRunner -------------------------
# Both call sites read only plain attributes (self.user_config / self.routes),
# so a bare `__new__` instance with just those two attributes set is enough -
# no ray/DB/network involved for `_research_config`. `_publish_general_info`
# additionally calls `sync_publish`, which is monkeypatched to capture instead
# of touching redis.

def _bare_monte_carlo_runner(user_config: dict, routes: list):
    from jesse.modes.monte_carlo_mode.MonteCarloRunner import MonteCarloRunner

    runner = MonteCarloRunner.__new__(MonteCarloRunner)
    runner.user_config = user_config
    runner.routes = routes
    return runner


def test_monte_carlo_research_config_defaults_to_exchange_annualization():
    runner = _bare_monte_carlo_runner(
        user_config={'exchange': {'type': 'spot'}, 'warm_up_candles': 0},
        routes=[{'exchange': exchanges.NSE, 'symbol': 'RELIANCE-INR', 'timeframe': '1D', 'strategy': 'Test'}],
    )
    assert runner._research_config()['annualization'] == 252


def test_monte_carlo_research_config_keeps_explicit_annualization():
    runner = _bare_monte_carlo_runner(
        user_config={'exchange': {'type': 'spot', 'annualization': 365}, 'warm_up_candles': 0},
        routes=[{'exchange': exchanges.NSE, 'symbol': 'RELIANCE-INR', 'timeframe': '1D', 'strategy': 'Test'}],
    )
    assert runner._research_config()['annualization'] == 365


def test_monte_carlo_publish_general_info_defaults_to_exchange_annualization(monkeypatch):
    # `jesse.modes.monte_carlo_mode` re-exports the *class* `MonteCarloRunner` under
    # the same name as its *submodule* `MonteCarloRunner.py`, and that attribute
    # shadows the submodule both for `monkeypatch.setattr`'s dotted-string form and
    # for a plain `import a.b.c as x` (which resolves via attribute access on the
    # parent package, landing on the class). Pull the actual submodule out of
    # `sys.modules` instead, where the import system always keeps the real module.
    import sys
    import jesse.modes.monte_carlo_mode.MonteCarloRunner  # noqa: F401 (ensures it's imported)
    monte_carlo_runner_module = sys.modules['jesse.modes.monte_carlo_mode.MonteCarloRunner']

    published = {}

    def fake_sync_publish(event, payload):
        published[event] = payload

    monkeypatch.setattr(monte_carlo_runner_module, 'sync_publish', fake_sync_publish)

    runner = _bare_monte_carlo_runner(
        user_config={'exchange': {'type': 'spot'}, 'warm_up_candles': 0},
        routes=[{'exchange': exchanges.NSE, 'symbol': 'RELIANCE-INR', 'timeframe': '1D', 'strategy': 'Test'}],
    )
    runner.start_time = 0
    runner.run_trades = False
    runner.run_candles = False
    runner.num_scenarios = 1
    runner.cpu_cores = 1

    runner._publish_general_info()

    assert published['general_info']['annualization'] == 252


# --- jesse.modes.optimize_mode.Optimize._process_trial_result --------------
# Not a small pure function: it also updates Optuna/best-trials bookkeeping.
# `_create_optuna_trial` is stubbed on the instance to skip Optuna entirely,
# `sync_publish` is monkeypatched to capture the built payload instead of
# touching redis, and `router.routes` (the global route registry the method
# reads `router.routes[0].exchange` from) is monkeypatched to a single fake
# route so no real router.initiate()/config setup is required. Score is kept
# at exactly 0.0001 so the (score > 0.0001) best-trials/DNA branch, which
# needs more bookkeeping attributes, is not entered.

class _StubProgressbar:
    def __init__(self):
        self.current = 1
        self.estimated_remaining_seconds = 0

    def update(self):
        pass


def _process_trial_result_general_info(exchange_config: dict, monkeypatch) -> dict:
    from jesse.modes.optimize_mode import Optimize
    from jesse.routes import router

    monkeypatch.setattr(router, 'routes', [SimpleNamespace(exchange=exchanges.NSE)])

    published = {}

    def fake_sync_publish(event, payload):
        published[event] = payload

    monkeypatch.setattr(Optimize, 'sync_publish', fake_sync_publish)

    optimizer = Optimize.Optimizer.__new__(Optimize.Optimizer)
    optimizer.completed_trials = 0
    optimizer.progressbar = _StubProgressbar()
    optimizer.start_time = 0
    optimizer.n_trials = 1
    optimizer.user_config = {'exchange': exchange_config}
    optimizer.cpu_cores = 1
    optimizer.best_trials = []
    # Skip real Optuna persistence entirely; only its return value is used.
    optimizer._create_optuna_trial = lambda *args, **kwargs: True

    result = {
        'trial_number': 1,
        'score': 0.0001,
        'params': {},
        'training_metrics': {},
        'testing_metrics': {},
    }
    optimizer._process_trial_result(result)

    return published['general_info']


def test_optimize_process_trial_result_defaults_to_exchange_annualization(monkeypatch):
    general_info = _process_trial_result_general_info({'type': 'spot'}, monkeypatch)
    assert general_info['annualization'] == 252


def test_optimize_process_trial_result_keeps_explicit_annualization(monkeypatch):
    general_info = _process_trial_result_general_info({'type': 'spot', 'annualization': 365}, monkeypatch)
    assert general_info['annualization'] == 365


# --- jesse.modes.significance_test_mode.SignificanceTestRunner._run_significance_test ---
# Also not a small pure function: it runs a full bootstrap significance test and
# writes DB/chart results after building the config. `rule_significance_test`
# (imported locally inside the method, from `jesse.research.rule_significance_testing`)
# is monkeypatched to capture its `config` kwarg and then abort via a sentinel
# exception, so nothing beyond config-building executes. `_raise_if_cancelled`
# is stubbed to a no-op to avoid a real redis round-trip through
# `is_process_active`.

class _StopAfterConfigCaptured(Exception):
    pass


def _significance_test_config(exchange_config: dict, monkeypatch) -> dict:
    import sys
    import jesse.research.rule_significance_testing as rule_significance_testing_module
    # Same module/class name-shadowing issue as MonteCarloRunner above: pull the real
    # submodule out of sys.modules rather than relying on package attribute access.
    import jesse.modes.significance_test_mode.SignificanceTestRunner  # noqa: F401
    significance_runner_module = sys.modules['jesse.modes.significance_test_mode.SignificanceTestRunner']
    from jesse.modes.significance_test_mode.SignificanceTestRunner import SignificanceTestRunner

    captured = {}

    def fake_rule_significance_test(**kwargs):
        captured['config'] = kwargs['config']
        raise _StopAfterConfigCaptured

    monkeypatch.setattr(
        rule_significance_testing_module, 'rule_significance_test', fake_rule_significance_test
    )
    monkeypatch.setattr(significance_runner_module, 'sync_publish', lambda *args, **kwargs: None)

    runner = SignificanceTestRunner.__new__(SignificanceTestRunner)
    runner.session_id = 'test-session'
    runner.user_config = {'exchange': exchange_config, 'warm_up_candles': 0}
    runner.routes = [{'exchange': exchanges.NSE, 'symbol': 'RELIANCE-INR', 'timeframe': '1D', 'strategy': 'Test'}]
    runner.data_routes = []
    runner.candles = {}
    runner.warmup_candles = {}
    runner.n_simulations = 1
    runner.random_seed = 42
    runner.theme = 'light'
    runner.start_time = 0
    runner._raise_if_cancelled = lambda: None

    with pytest.raises(_StopAfterConfigCaptured):
        runner._run_significance_test()

    return captured['config']


def test_significance_test_runner_defaults_to_exchange_annualization(monkeypatch):
    config = _significance_test_config({'type': 'spot'}, monkeypatch)
    assert config['annualization'] == 252


def test_significance_test_runner_keeps_explicit_annualization(monkeypatch):
    config = _significance_test_config({'type': 'spot', 'annualization': 365}, monkeypatch)
    assert config['annualization'] == 365


# --- Not covered directly (documented, not skipped silently) --------------
#
# jesse.research.monte_carlo.monte_carlo_trades._run_monte_carlo_simulation (~185)
# and jesse.research.rule_significance_testing.rule_significance.rule_significance_test
# (~225) both call `resolve_annualization_for_exchange(config, config['exchange'])`
# verbatim on a config dict that was *already built* by one of the sites above
# (research.backtest._format_config / SignificanceTestRunner._run_significance_test) -
# they don't build the dict themselves. Reaching them requires either a real Ray
# cluster (`monte_carlo_trades`) or a full bootstrap run (`rule_significance_test`),
# both already covered end-to-end by tests/test_research_monte_carlo.py and
# tests/test_rule_significance_testing.py. Re-deriving the same expression here
# would only duplicate the helper-level tests above without exercising new
# code, so it's skipped.
