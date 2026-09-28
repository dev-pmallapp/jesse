// Typed request/response shapes + thin call wrappers for the `/equities/*` routes - see
// jesse/controllers/equities_controller.py for the authoritative field list/behavior.
// Kept deliberately dumb (no caching, no state) - pages own their own loading/error refs.
import { api, type ApiResult } from './client';

export type Exchange = 'NSE' | 'BSE';

export interface ImportedRange {
  start_date: string;
  end_date: string;
}

export interface EquitySearchResult {
  ticker: string; // e.g. "NSE:RELIANCE"
  symbol: string;
  exchange: Exchange;
  company: string | null;
  industry: string | null;
  series: string | null;
  isin: string | null;
  imported: ImportedRange | null;
}

export interface EquitySearchResponse {
  results: EquitySearchResult[];
  // False when every exchange's catalog fetch failed server-side - results are then
  // limited to already-imported symbols (see _search_imported_only in the controller).
  catalog_available: boolean;
}

export function searchEquities(
  query: string,
  exchange: Exchange | null,
  limit = 20,
): Promise<ApiResult<EquitySearchResponse>> {
  return api<EquitySearchResponse>('/equities/search', { query, exchange, limit });
}

// Keys mirror the controller's fixed lookback set (1 month through 5 years) - null means
// the imported history doesn't reach back that far yet.
export interface EquityReturns {
  '1m': number | null;
  '3m': number | null;
  '6m': number | null;
  '1y': number | null;
  '3y': number | null;
  '5y': number | null;
}

export interface MaxDrawdown {
  pct: number;
  peak_date: string;
  trough_date: string;
}

export interface EquityStats {
  last_close: number;
  last_date: string;
  returns: EquityReturns;
  cagr_pct: number | null;
  week_52_high: number;
  week_52_low: number;
  volatility_pct: number | null;
  max_drawdown: MaxDrawdown;
  avg_volume_20d: number;
}

export interface EquityStockResponse {
  ticker: string;
  symbol: string;
  exchange: Exchange;
  company: string | null;
  industry: string | null;
  series: string | null;
  isin: string | null;
  catalog_available: boolean;
  baskets: string[]; // basket NAMEs, not ids - see BasketsPage/basket_id mapping
  imported: ImportedRange | null;
  stats: EquityStats | null;
}

export function getEquityStock(symbol: string, exchange: Exchange): Promise<ApiResult<EquityStockResponse>> {
  return api<EquityStockResponse>('/equities/stock', { symbol, exchange });
}

// [timestamp_ms, open, high, low, close, volume] - see the controller's own reordering
// comment (DB storage order differs from this OHLCV convention).
export type EquityCandleRow = [number, number, number, number, number, number];

export type CandleTimeframe = '1D' | '1W';

export interface EquityCandlesResponse {
  symbol: string;
  timeframe: CandleTimeframe;
  candles: EquityCandleRow[];
  truncated: boolean;
}

export function getEquityCandles(
  symbol: string,
  exchange: Exchange,
  timeframe: CandleTimeframe,
): Promise<ApiResult<EquityCandlesResponse>> {
  // No start_date/finish_date: defaults to the whole imported range server-side: the
  // range selector in PriceChart.vue filters that full series client-side instead of
  // refetching per range, so only the 1D/1W toggle needs a network round-trip.
  return api<EquityCandlesResponse>('/equities/candles', { symbol, exchange, timeframe });
}
