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
