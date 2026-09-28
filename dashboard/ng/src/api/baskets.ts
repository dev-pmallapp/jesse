// Typed client for `jesse/controllers/baskets_controller.py` - see that module's
// docstring for the full `kind: 'index' | 'mf'` rationale (only 'index' is populated
// today; 'mf' is reserved so BasketsPage/BasketDetailPage already render correctly once
// mutual-fund baskets land, with no shape change needed).
import { api, formatServerErrorMessage } from './client';

export type BasketKind = 'index' | 'mf';

export interface BasketSummary {
  id: string;
  name: string;
  kind: BasketKind;
  benchmark: string;
  // Both null together when this universe has never been snapshotted to disk yet.
  snapshot_date: string | null;
  member_count: number | null;
}

export interface BasketListResponse {
  baskets: BasketSummary[];
}

export interface BasketMemberImported {
  start_date: string;
  end_date: string;
}

export interface BasketMember {
  ticker: string;
  symbol: string;
  company: string;
  industry: string | null;
  series: string | null;
  isin: string | null;
  // null when the member has no imported 1D candles at all.
  imported: BasketMemberImported | null;
  last_close: number | null;
  return_1y: number | null;
  // Not sent by the API yet - every current basket is equal-weight. Reserved for
  // mutual-fund baskets, whose holdings carry a real portfolio weight; prefer this over
  // the computed equal-weight share once it shows up.
  weight?: number | null;
}

export interface BasketIndustryCount {
  industry: string;
  count: number;
}

export interface BasketCoverage {
  imported: number;
  missing: number;
  missing_tickers: string[];
}

export interface BasketDetail {
  id: string;
  name: string;
  kind: BasketKind;
  as_of: string;
  snapshot_date: string;
  // True when no snapshot exists at/before `as_of`, so `research.universe()` fell back
  // to today's live membership - the detail page must warn this carries survivorship
  // bias for a historical `as_of`.
  used_current_members: boolean;
  benchmark: string;
  members: BasketMember[];
  coverage: BasketCoverage;
  industries: BasketIndustryCount[];
}

export interface GetBasketParams {
  id: string;
  as_of?: string;
  refresh?: boolean;
}

/** Distinguishes a 404 (unknown basket id) from a 502 (upstream provider unavailable) so
 * BasketDetailPage can show different Banner copy/retry affordance for each rather than
 * one generic error message. */
export class BasketApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function listBaskets(): Promise<BasketListResponse> {
  const res = await api<BasketListResponse>('/baskets/list', {});
  if (!res.ok) {
    throw new BasketApiError(formatServerErrorMessage(res.data) || `Request failed (${res.status})`, res.status);
  }
  return res.data;
}

export async function getBasket(params: GetBasketParams): Promise<BasketDetail> {
  const res = await api<BasketDetail>('/baskets/get', params);
  if (!res.ok) {
    throw new BasketApiError(formatServerErrorMessage(res.data) || `Request failed (${res.status})`, res.status);
  }
  return res.data;
}
