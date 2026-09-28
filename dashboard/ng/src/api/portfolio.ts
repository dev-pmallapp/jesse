// Typed request/response contracts + calls for the Portfolio equal-weight rebalance
// backtest (`jesse/controllers/portfolio_controller.py`, result shape from
// `jesse/research/portfolio_rebalance.py`). Ported behaviour from
// `jesse/dashboard_patches/portfolio_page.template.js` - see that file's own comments
// for the reasoning behind client-side validation/CSV shape/etc., kept here verbatim
// where it still applies.
import { api, type ApiResult } from './client';
import { csvEscape, downloadTextFile } from '../utils/csv';
import { round2 } from '../utils/format';

// ---------------------------------------------------------------------------------
// Result shape (jesse/research/portfolio_rebalance.py)
// ---------------------------------------------------------------------------------

export interface EquityPoint {
  date: string;
  value: number;
  cash: number;
}

export interface Trade {
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  notional: number;
  fee: number;
  // DataTable's generic row type is constrained to `Record<string, unknown>` - a named
  // interface with only known properties isn't structurally assignable to that without
  // an explicit index signature (TS doesn't infer one for interfaces the way it does
  // for object literals), so every row type fed into it below carries one.
  [key: string]: unknown;
}

export interface Rebalance {
  date: string;
  value_before: number;
  trades: Trade[];
  cash_after: number;
}

// A holdings table row (`final_holdings`/`buy_and_hold_equal_weight.holdings` are plain
// `{symbol: qty}` maps) - sorted alphabetically, matching the old template's
// `renderHoldings`.
export interface HoldingRow {
  symbol: string;
  qty: number;
  [key: string]: unknown;
}

export function holdingRows(holdings: Record<string, number>): HoldingRow[] {
  return Object.entries(holdings)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([symbol, qty]) => ({ symbol, qty }));
}

// Base metrics every equity curve gets (`_curve_metrics`); the main `result.metrics`
// adds the rebalance-specific fields below via `PortfolioMetrics`.
export interface CurveMetrics {
  final_value: number;
  total_return_pct: number;
  cagr_pct: number;
  max_drawdown_pct: number;
  sharpe: number;
}

export interface PortfolioMetrics extends CurveMetrics {
  n_rebalances: number;
  total_fees: number;
  turnover: number;
  avg_cash_pct: number;
}

export interface BuyAndHold {
  equity_curve: EquityPoint[];
  holdings: Record<string, number>;
  metrics: CurveMetrics;
}

// `_benchmark_curve` returns `metrics: {}` (untyped empty object) when the benchmark
// series and the portfolio's own calendar never overlap - every field is optional here
// to match that edge case.
export interface BenchmarkCurve {
  symbol: string;
  equity_curve: EquityPoint[];
  metrics: Partial<CurveMetrics>;
}

export interface PortfolioConfig {
  exchange: string;
  universe: string | null;
  symbols: string[];
  start_date: string;
  finish_date: string;
  capital: number;
  rebalance_days: number;
  fee: number;
  benchmark: string | null;
}

export interface PortfolioBacktestResult {
  equity_curve: EquityPoint[];
  rebalances: Rebalance[];
  final_holdings: Record<string, number>;
  unaffordable: Record<string, number>;
  metrics: PortfolioMetrics;
  buy_and_hold_equal_weight: BuyAndHold;
  survivorship_warning: boolean;
  config: PortfolioConfig;
  benchmark?: BenchmarkCurve;
}

// ---------------------------------------------------------------------------------
// /portfolio/options
// ---------------------------------------------------------------------------------

export interface PortfolioOptions {
  exchanges: string[];
  universes: string[];
  benchmarks: string[];
  defaults: {
    exchange: string;
    universe: string;
    symbols: string[];
    start_date: string;
    finish_date: string;
    capital: number;
    rebalance_days: number;
    fee: number;
    benchmark: string | null;
  };
}

export function fetchPortfolioOptions(): Promise<ApiResult<PortfolioOptions>> {
  return api<PortfolioOptions>('/portfolio/options', {});
}

// ---------------------------------------------------------------------------------
// /portfolio/backtest
// ---------------------------------------------------------------------------------

export interface PortfolioBacktestRequest {
  exchange: string;
  universe: string | null;
  symbols: string[] | null;
  start_date: string;
  finish_date: string;
  capital: number;
  rebalance_days: number;
  fee: number;
  benchmark: string | null;
  save: boolean;
}

export interface PortfolioBacktestResponse {
  id: string | null;
  created_at: number;
  result: PortfolioBacktestResult;
}

export interface MissingCandlesResponse {
  error: 'missing_candles';
  message: string;
  missing_symbols: string[];
  exchange: string;
  start_date: string;
  finish_date: string;
}

export interface InvalidRequestResponse {
  error: 'invalid_request';
  message: string;
}

export function isMissingCandlesResponse(data: unknown): data is MissingCandlesResponse {
  return !!data && typeof data === 'object' && (data as { error?: unknown }).error === 'missing_candles';
}

export function runPortfolioBacktest(
  payload: PortfolioBacktestRequest,
): Promise<ApiResult<PortfolioBacktestResponse | MissingCandlesResponse | InvalidRequestResponse>> {
  return api('/portfolio/backtest', payload);
}

// The Basket|Stocks segmented target this page's form uses - `universe` carries the
// selected basket name (a `research.list_universes()` entry), `symbolsText` the raw
// textarea content for Stocks mode (parsed by `parseSymbolsInput` at submit time).
export type PortfolioBasketMode = 'basket' | 'stocks';

export interface PortfolioFormState {
  exchange: string;
  mode: PortfolioBasketMode;
  universe: string;
  symbolsText: string;
  start_date: string;
  finish_date: string;
  capital: number;
  rebalance_days: number;
  fee: number;
  benchmark: string;
  save: boolean;
}

// Spec allows comma, space, or newline separated bare tickers - collapse any run of
// whitespace or commas into one split point.
export function parseSymbolsInput(text: string): string[] {
  return text.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
}

export function buildBacktestPayload(form: PortfolioFormState): PortfolioBacktestRequest {
  return {
    exchange: form.exchange,
    universe: form.mode === 'basket' ? form.universe : null,
    symbols: form.mode === 'stocks' ? parseSymbolsInput(form.symbolsText) : null,
    start_date: form.start_date,
    finish_date: form.finish_date,
    capital: form.capital,
    rebalance_days: form.rebalance_days,
    fee: form.fee,
    benchmark: form.benchmark.trim() || null,
    save: form.save,
  };
}

// Client-side mirror of the server's own validation (the 400 `invalid_request` checks
// in `portfolio_controller`/`portfolio_rebalance.simulate`) - catches the common
// "empty/garbage number input" case before a request goes out, so the user sees a
// specific, actionable message instead of a generic "Backtest failed." from a 400 body.
export function validateBacktestPayload(payload: PortfolioBacktestRequest): string | null {
  if (payload.universe === null) {
    if (!payload.symbols || !payload.symbols.length) {
      return 'Enter at least one symbol, or switch to Basket mode.';
    }
  } else if (!payload.universe) {
    // An empty string - e.g. /portfolio/options hasn't loaded yet, or came back with an
    // empty universe list - would otherwise silently become `universe: ""` on the wire.
    return 'Choose a basket (reload options if the list is empty), or switch to Stocks mode.';
  }
  if (!Number.isFinite(payload.capital) || payload.capital <= 0) {
    return 'Capital must be a number greater than 0.';
  }
  if (!Number.isInteger(payload.rebalance_days) || payload.rebalance_days < 1) {
    return 'Rebalance every N days must be a whole number of at least 1.';
  }
  if (!Number.isFinite(payload.fee) || payload.fee < 0 || payload.fee >= 1) {
    return 'Fee must be a fraction from 0 up to (but not including) 1, e.g. 0.001.';
  }
  return null;
}

// ---------------------------------------------------------------------------------
// /portfolio/runs, /portfolio/run, /portfolio/run/delete
// ---------------------------------------------------------------------------------

export interface RunSummary {
  id: string;
  created_at: number;
  config: PortfolioConfig | null;
  metrics: PortfolioMetrics | null;
  // See Trade's index signature comment above - DataTable's generic row constraint.
  [key: string]: unknown;
}

export interface RunsListResponse {
  runs: RunSummary[];
}

export interface RunRecord {
  id: string;
  created_at: number;
  result: PortfolioBacktestResult;
}

export function fetchPortfolioRuns(): Promise<ApiResult<RunsListResponse>> {
  return api<RunsListResponse>('/portfolio/runs', {});
}

export function fetchPortfolioRun(id: string): Promise<ApiResult<RunRecord>> {
  return api<RunRecord>('/portfolio/run', { id });
}

export function deletePortfolioRun(id: string): Promise<ApiResult<{ ok?: boolean; message?: string }>> {
  return api<{ ok?: boolean; message?: string }>('/portfolio/run/delete', { id });
}

export function runLabel(config: PortfolioConfig | null): string {
  if (!config) return '-';
  if (config.universe) return config.universe;
  const n = config.symbols?.length ?? 0;
  return `${n} ${n === 1 ? 'symbol' : 'symbols'}`;
}

// ---------------------------------------------------------------------------------
// /baskets/list - only the fields this page needs (id -> canonical universe name), so
// a `?basket=<id>` deep link (see BasketsPage/BasketDetailPage) can preselect the same
// basket here without duplicating baskets_controller's full `/list` response shape.
// ---------------------------------------------------------------------------------

export interface BasketSummary {
  id: string;
  name: string;
}

export function fetchBasketsList(): Promise<ApiResult<{ baskets: BasketSummary[] }>> {
  return api<{ baskets: BasketSummary[] }>('/baskets/list', {});
}

// ---------------------------------------------------------------------------------
// Symbol display - mirrors `jesse.services.historical_data.india.symbols.to_exchange_ticker`
// (`BASE-INR` -> `BASE`, `_` -> `-`) so a trade/holding row can link to
// `/india/stock/<exchange>:<ticker>` without a round trip to the server just to
// reformat a symbol we already have.
// ---------------------------------------------------------------------------------

export function symbolToTicker(symbol: string): string {
  return symbol.replace(/-INR$/i, '').replace(/_/g, '-');
}

export function stockPath(exchange: string, symbol: string): string {
  return `/india/stock/${exchange}:${symbolToTicker(symbol)}`;
}

// ---------------------------------------------------------------------------------
// CSV builders - same columns as the old template's `buildEquityCsv`/`buildTradesCsv`
// (in turn matching `docs/examples/equal_weight_rebalance.py`), so a run exported from
// here matches the CLI script byte-for-byte in shape.
// ---------------------------------------------------------------------------------

export function buildEquityCsv(result: PortfolioBacktestResult): string {
  const bh = new Map<string, number>();
  for (const p of result.buy_and_hold_equal_weight?.equity_curve ?? []) bh.set(p.date, p.value);
  const lines = ['date,value,cash,buy_and_hold_value'];
  for (const p of result.equity_curve) {
    const bhVal = bh.get(p.date);
    lines.push(
      [csvEscape(p.date), round2(p.value), round2(p.cash), bhVal === undefined ? '' : round2(bhVal)].join(','),
    );
  }
  return lines.join('\n');
}

export function buildTradesCsv(result: PortfolioBacktestResult): string {
  const lines = ['date,symbol,side,qty,price,notional,fee'];
  for (const reb of result.rebalances) {
    for (const t of reb.trades) {
      lines.push(
        [csvEscape(reb.date), csvEscape(t.symbol), csvEscape(t.side), t.qty, t.price, round2(t.notional), round2(t.fee)].join(','),
      );
    }
  }
  return lines.join('\n');
}

export function downloadEquityCsv(result: PortfolioBacktestResult): void {
  downloadTextFile('portfolio-equity.csv', buildEquityCsv(result));
}

export function downloadTradesCsv(result: PortfolioBacktestResult): void {
  downloadTextFile('portfolio-trades.csv', buildTradesCsv(result));
}
