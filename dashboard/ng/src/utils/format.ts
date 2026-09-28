// Formatting helpers ported from jesse/dashboard_patches/portfolio_page.template.js -
// pure, no DOM access, so they're easy to unit-test independent of the rest of the page.

// INR formatting per spec: Intl.NumberFormat('en-IN') groups in the lakh/crore style
// (1,00,000 not 100,000), matching every other rupee figure in this NSE/BSE-only fork.
const INR_FORMATTER = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function fmtINR(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return '₹' + INR_FORMATTER.format(n);
}

export function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return n.toFixed(2) + '%';
}

export function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return n.toFixed(2);
}

export function fmtDate(value: string | number | null | undefined): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

// Equity-curve dates are plain `YYYY-MM-DD` (no time/zone). Anchoring at UTC midnight
// keeps every series (portfolio/buy&hold/benchmark - all built off the same trading
// calendar) mapped to the same x pixel for the same date regardless of the browser's
// own local timezone.
export function parseDateMs(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00Z').getTime();
}

// Mirrors Python's `round(x, 2)` (banker's-rounding edge cases aside) closely enough for
// CSV export - `toFixed` would instead pad trailing zeros the reference script's
// `csv.writer` never emits for a plain float.
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Formats a ticker for display as `EXCHANGE:TICKER` (e.g. `NSE:RELIANCE`), mirroring
 * `jesse/services/historical_data/india/symbols.py`'s `to_exchange_ticker` (`_` decodes
 * back to `-`, e.g. `BAJAJ_AUTO-INR` -> `NSE:BAJAJ-AUTO`) client-side rather than with a
 * server round trip just to reformat a symbol already in hand. Handles three input
 * shapes so every call site can pass whatever it already has:
 *  - a Jesse internal symbol (`RELIANCE-INR`, `BAJAJ_AUTO-INR`) - the common case
 *  - an already `EXCHANGE:TICKER` symbol - passed through unchanged (never double-prefixed)
 *  - a bare exchange ticker (`RELIANCE`, no `-INR` suffix) - just prefixed with `exchange` */
export function displayTicker(symbol: string, exchange = 'NSE'): string {
  if (!symbol) return symbol;
  const trimmed = symbol.trim();
  if (trimmed.includes(':')) return trimmed;
  if (!/-INR$/i.test(trimmed)) return `${exchange}:${trimmed}`;
  const ticker = trimmed.replace(/-INR$/i, '').replace(/_/g, '-');
  return `${exchange}:${ticker}`;
}
