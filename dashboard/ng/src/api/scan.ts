// Typed client for the universe-scan research tool
// (`jesse/controllers/universe_scan_controller.py`) - ports
// `jesse/dashboard_patches/universe_scan_page.template.js`'s behaviour into this app's
// Scan page. Field names mirror the backend's JSON contract exactly (snake_case) so a
// payload built here needs no renaming before it hits the wire; UI-facing shapes
// (`ScanFormState`, `ScanRankedRow`) are camelCase and kept separate.
import { api, type ApiResult } from './client';
import { displayTicker } from '../utils/format';

// ---------------------------------------------------------------------------------
// Server contract types (see universe_scan_controller.py / services/web.py's
// UniverseScan*RequestJson models / modes/universe_scan_mode/{storage,helpers}.py)
// ---------------------------------------------------------------------------------

export interface ScanDefaults {
  exchange: string;
  universes: string[];
  timeframe: string;
  data_start: string;
  train_start: string;
  train_finish: string;
  test_start: string;
  test_finish: string;
  warm_up_candles: number;
  balance: number;
  fee: number;
  run_fixed: boolean;
  run_optimize: boolean;
  trials_per_hp: number;
  optimal_total: number;
  objective_function: string;
  cpu_cores: number;
  import_candles: boolean;
  min_train_days: number;
}

export interface ScanOptions {
  universes: string[];
  strategies: string[];
  timeframes: string[];
  max_cpu_cores: number;
  defaults: ScanDefaults;
}

export interface ScanStartRequest {
  id?: string;
  exchange: string;
  universes: string[];
  symbols: string[];
  strategies: string[];
  timeframe: string;
  data_start: string;
  train_start: string;
  train_finish: string;
  test_start: string;
  test_finish: string;
  warm_up_candles: number;
  balance: number;
  fee: number;
  run_fixed: boolean;
  run_optimize: boolean;
  trials_per_hp: number;
  optimal_total: number;
  objective_function: string;
  // null lets the controller default it to ~75% of this machine's cores.
  cpu_cores: number | null;
  import_candles: boolean;
  min_train_days: number;
}

export interface ScanStartResponse {
  id: string;
}

export interface ScanProgress {
  phase: string | null;
  done: number;
  total: number;
  current: string | null;
}

export interface ScanSkipped {
  symbol: string;
  reason: string;
}

// One row of `summarize()`'s per (phase, strategy) roll-up over the TEST window.
export interface ScanSummaryRow {
  phase: string;
  strategy: string;
  stocks: number;
  trades: number;
  win_rate_pct: number;
  median_pnl_pct: number | null;
  median_bh_pct: number | null;
  beat_bh: number;
  median_sharpe: number | null;
  median_train_pnl_pct: number | null;
  median_train_bh_pct: number | null;
  errors: number;
}

// One row of `build_row()`'s per (phase, strategy, symbol) result. An `error` row
// omits every metric field entirely (see that function's docstring) rather than
// zeroing them, so callers must branch on `error` before reading train_*/test_* -
// a missing field here means "not run", not "ran and scored zero".
export interface ScanRow {
  phase: string;
  strategy: string;
  symbol: string;
  train_start?: string;
  params?: Record<string, unknown>;
  error?: string;
  train_trades?: number;
  train_win_rate?: number;
  train_pnl_pct?: number;
  train_max_dd?: number;
  train_sharpe?: number;
  train_bh_pct?: number;
  test_trades?: number;
  test_win_rate?: number;
  test_pnl_pct?: number;
  test_max_dd?: number;
  test_sharpe?: number;
  test_bh_pct?: number;
}

export interface ScanSession {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'running' | 'done' | 'error' | 'cancelled';
  config: ScanStartRequest;
  progress: ScanProgress;
  skipped: ScanSkipped[];
  // True, a warning string, or false/absent - `_session_summary` never sends this, only
  // the full `/session` payload does (see the template's renderSurvivorship).
  survivorship_warning?: boolean | string;
  summary: ScanSummaryRow[];
  rows: ScanRow[];
  error: string | null;
}

export interface ScanSessionSummary {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  progress: ScanProgress;
  row_count: number;
  config_summary: {
    exchange?: string;
    universes?: string[];
    symbols?: string[];
    strategies?: string[];
    run_fixed?: boolean;
    run_optimize?: boolean;
  };
}

export interface Basket {
  id: string;
  name: string;
  kind: string;
  benchmark: string;
  snapshot_date: string | null;
  member_count: number | null;
}

// ---------------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------------

export function fetchScanOptions(exchange: string): Promise<ApiResult<ScanOptions>> {
  return api<ScanOptions>('/universe-scan/options', { exchange });
}

// Called directly (not via a shared api/ module) purely for nicer basket names/member
// counts in the target picker - baskets_controller.list_baskets() is otherwise owned
// by whichever agent builds the Baskets page.
export function fetchBaskets(): Promise<ApiResult<{ baskets: Basket[] }>> {
  return api<{ baskets: Basket[] }>('/baskets/list', {});
}

export function startScan(payload: ScanStartRequest): Promise<ApiResult<ScanStartResponse>> {
  return api<ScanStartResponse>('/universe-scan/start', payload);
}

export function fetchSessions(): Promise<ApiResult<{ sessions: ScanSessionSummary[] }>> {
  return api<{ sessions: ScanSessionSummary[] }>('/universe-scan/sessions', {});
}

export function fetchSession(id: string): Promise<ApiResult<ScanSession>> {
  return api<ScanSession>('/universe-scan/session', { id });
}

export function cancelScan(id: string): Promise<ApiResult<{ message: string }>> {
  return api('/universe-scan/cancel', { id });
}

export function deleteScan(id: string): Promise<ApiResult<{ message: string }>> {
  return api('/universe-scan/delete', { id });
}

// ---------------------------------------------------------------------------------
// Form state - UI-only shape (camelCase), translated to/from ScanStartRequest at the
// edges so the rest of the page never has to juggle the two naming conventions.
// ---------------------------------------------------------------------------------

export interface ScanFormState {
  mode: 'basket' | 'stocks';
  exchange: string;
  selectedUniverses: string[];
  symbolsText: string;
  selectedStrategies: string[];
  timeframe: string;
  data_start: string;
  train_start: string;
  train_finish: string;
  test_start: string;
  test_finish: string;
  warm_up_candles: number;
  balance: number;
  fee: number;
  run_fixed: boolean;
  run_optimize: boolean;
  trials_per_hp: number;
  optimal_total: number;
  objective_function: string;
  cpu_cores: number | null;
  import_candles: boolean;
  min_train_days: number;
}

export function defaultFormState(): ScanFormState {
  return {
    mode: 'basket',
    exchange: 'NSE',
    selectedUniverses: [],
    symbolsText: '',
    selectedStrategies: [],
    timeframe: '1D',
    data_start: '',
    train_start: '',
    train_finish: '',
    test_start: '',
    test_finish: '',
    warm_up_candles: 210,
    balance: 1_000_000,
    fee: 0.001,
    run_fixed: true,
    run_optimize: false,
    trials_per_hp: 20,
    optimal_total: 30,
    objective_function: 'sharpe',
    cpu_cores: null,
    import_candles: false,
    min_train_days: 365,
  };
}

/** Applies `/options`'s server defaults onto an existing form (mutating it in place) -
 * mirrors the old template's `populateOptions`. Never touches `mode`/`selectedUniverses`
 * beyond seeding the initial universe checklist, so a basket preselected from the
 * `?basket=` query string (applied after this) isn't clobbered by a later options reload. */
export function applyDefaults(form: ScanFormState, options: ScanOptions): void {
  const d = options.defaults;
  form.selectedUniverses = [...(d.universes ?? [])];
  form.timeframe = d.timeframe ?? form.timeframe;
  form.data_start = d.data_start ?? form.data_start;
  form.train_start = d.train_start ?? form.train_start;
  form.train_finish = d.train_finish ?? form.train_finish;
  form.test_start = d.test_start ?? form.test_start;
  form.test_finish = d.test_finish ?? form.test_finish;
  form.warm_up_candles = d.warm_up_candles ?? form.warm_up_candles;
  form.balance = d.balance ?? form.balance;
  form.fee = d.fee ?? form.fee;
  form.run_fixed = !!d.run_fixed;
  form.run_optimize = !!d.run_optimize;
  form.trials_per_hp = d.trials_per_hp ?? form.trials_per_hp;
  form.optimal_total = d.optimal_total ?? form.optimal_total;
  form.objective_function = d.objective_function ?? form.objective_function;
  form.cpu_cores = d.cpu_cores ?? form.cpu_cores;
  form.import_candles = !!d.import_candles;
  form.min_train_days = d.min_train_days ?? form.min_train_days;
}

/** Same split as the old template's `parseSymbols` - one ticker per line, or
 * comma-separated, bare tickers OK (`normalize_symbol` on the server resolves them). */
export function parseSymbolsText(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildStartRequest(form: ScanFormState): ScanStartRequest {
  return {
    exchange: form.exchange,
    // Segmented target picker: exactly one of universes/symbols is populated, even
    // though the backend itself is happy to union both (resolve_symbols()) - keeps the
    // "Basket" vs "Stocks" choice unambiguous instead of silently combining leftover
    // text from the mode the user isn't currently looking at.
    universes: form.mode === 'basket' ? form.selectedUniverses : [],
    symbols: form.mode === 'stocks' ? parseSymbolsText(form.symbolsText) : [],
    strategies: form.selectedStrategies,
    timeframe: form.timeframe,
    data_start: form.data_start,
    train_start: form.train_start,
    train_finish: form.train_finish,
    test_start: form.test_start,
    test_finish: form.test_finish,
    warm_up_candles: form.warm_up_candles,
    balance: form.balance,
    fee: form.fee,
    run_fixed: form.run_fixed,
    run_optimize: form.run_optimize,
    trials_per_hp: form.trials_per_hp,
    optimal_total: form.optimal_total,
    objective_function: form.objective_function,
    cpu_cores: form.cpu_cores,
    import_candles: form.import_candles,
    min_train_days: form.min_train_days,
  };
}

/** Client-side mirror of `/start`'s own validation (see universe_scan_controller.py) -
 * catches the common "forgot to pick something" cases before a round trip; the server
 * remains the source of truth for date-order/id/cpu_cores checks, surfaced via
 * `formatServerErrorMessage` on a 400 response. */
export function validateStartForm(form: ScanFormState): string | null {
  if (form.mode === 'basket' && form.selectedUniverses.length === 0) {
    return 'Select at least one basket.';
  }
  if (form.mode === 'stocks' && parseSymbolsText(form.symbolsText).length === 0) {
    return 'Add at least one stock symbol.';
  }
  if (form.selectedStrategies.length === 0) {
    return 'Select at least one strategy.';
  }
  if (!form.run_fixed && !form.run_optimize) {
    return 'Select fixed, optimize, or both.';
  }
  return null;
}

// ---------------------------------------------------------------------------------
// Ranked results - flattens session.rows (per phase/strategy/symbol) into the
// per-stock shape the results table ranks on. The index signature lets this feed
// DataTable's `T extends Record<string, unknown>` generic directly.
// ---------------------------------------------------------------------------------

export interface ScanRankedRow {
  [key: string]: unknown;
  phase: string;
  strategy: string;
  symbol: string;
  ticker: string;
  trades: number | null;
  winRate: number | null;
  pnlPct: number | null;
  bhPct: number | null;
  beatsBh: boolean;
  sharpe: number | null;
  maxDd: number | null;
  error: string | null;
}

/** Ranks by TEST return (`pnlPct`) descending by default - "run a strategy on every
 * stock and rank the results" - while DataTable's own column-click sort still lets a
 * user re-rank by sharpe/drawdown/trades/win rate. An error row (no metrics) always
 * sorts to the bottom via the `-Infinity` fallback. */
export function toRankedRows(session: ScanSession): ScanRankedRow[] {
  const exchange = session.config?.exchange ?? 'NSE';
  const rows = session.rows.map((r): ScanRankedRow => {
    const ticker = displayTicker(r.symbol, exchange);
    if (r.error) {
      return {
        phase: r.phase, strategy: r.strategy, symbol: r.symbol, ticker,
        trades: null, winRate: null, pnlPct: null, bhPct: null, beatsBh: false,
        sharpe: null, maxDd: null, error: r.error,
      };
    }
    const pnlPct = r.test_pnl_pct ?? null;
    const bhPct = r.test_bh_pct ?? null;
    return {
      phase: r.phase, strategy: r.strategy, symbol: r.symbol, ticker,
      trades: r.test_trades ?? null, winRate: r.test_win_rate ?? null,
      pnlPct, bhPct,
      beatsBh: pnlPct !== null && bhPct !== null && pnlPct > bhPct,
      sharpe: r.test_sharpe ?? null, maxDd: r.test_max_dd ?? null,
      error: null,
    };
  });
  return rows.sort((a, b) => (b.pnlPct ?? -Infinity) - (a.pnlPct ?? -Infinity));
}
