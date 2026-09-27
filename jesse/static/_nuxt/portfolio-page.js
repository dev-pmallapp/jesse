/*jesse-dashboard-patch:portfolio*/
/*
 * Portfolio page for the compiled Nuxt dashboard (dev-pmallapp/jesse#93).
 *
 * Backtest tab: runs `research.portfolio_rebalance()` (an equal-weight basket,
 * rebalanced every N days) against the API contract added by #91
 * (`/portfolio/options|backtest|runs|run|run/delete`) and renders the result -
 * metrics, an inline-SVG equity chart, rebalances/holdings tables and CSV exports.
 * The Rebalance planner (#94) is out of scope here; its tab exists (disabled) only
 * so that story can slot its own panel in next to this one without touching this
 * file's tab-bar markup again.
 *
 * Same mechanics as `jesse/dashboard_patches/universe_scan_page.template.js` (see
 * that file's header for the full rationale, only summarized here): this is a SOURCE
 * TEMPLATE, not the file that ships in `jesse/static/_nuxt/` -
 * `scripts/patch_dashboard.py` copies it there as `portfolio-page.js`, substituting:
 *   - `./CoKk4mC0.js`               -> the current build's Vue-runtime chunk filename
 *   - `_`  -> that chunk's current mangled export name for
 *                                      Vue's `createElementVNode`
 * and the exported component uses the same Vue "function ref" trick (called with the
 * element on mount, `null` right before unmount) as its only lifecycle hook, so this
 * file's only per-build dependency stays a single Vue export, same as Universe Scan's.
 * Like Universe Scan, this page has no reactive state - the whole UI is plain DOM
 * calls, so no other Vue import is needed.
 *
 * Auth: `getAuthToken`/`redirectToLogin`/`api` below are copied verbatim from
 * `universe_scan_page.template.js` - see that file's header for why we read the
 * `main` Pinia store's persisted token directly out of `localStorage` instead of
 * importing the (per-build-mangled) store module.
 */
import { _ as h } from './CoKk4mC0.js';

// ---------------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------------

const MAIN_STORE_KEY = 'main';
const ROOT_CLASS = 'pfl-page';
const STYLE_ELEMENT_ID = 'jesse-portfolio-style';

// ---------------------------------------------------------------------------------
// Scoped styles - same Nuxt UI `--ui-*` design-token approach as Universe Scan's page
// (see that file's header): purged Tailwind utility classes aren't safe to rely on in
// this bundle, but these CSS custom properties survive the purge and already track
// the dashboard's light/dark theme for free. Every rule is scoped under `.pfl-page`.
// ---------------------------------------------------------------------------------
const STYLE_TEXT = `
.pfl-page { font-size: 14px; color: var(--ui-text); }
.pfl-page h1 { font-size: 20px; margin: 0; color: var(--ui-text-highlighted); }
.pfl-page h2 { font-size: 15px; margin: 0 0 10px; color: var(--ui-text-highlighted); }
.pfl-page h3 { font-size: 12px; margin: 16px 0 8px; color: var(--ui-text-muted); text-transform: uppercase; letter-spacing: .03em; }
.pfl-page .pf-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.pfl-page .pf-tabs { display: flex; gap: 6px; margin-bottom: 14px; border-bottom: 1px solid var(--ui-border); }
.pfl-page .pf-tab {
  border: none; border-bottom: 2px solid transparent; background: none; color: var(--ui-text-muted);
  padding: 8px 4px; border-radius: 0; font-size: 13px; margin-bottom: -1px;
}
.pfl-page .pf-tab-active { color: var(--ui-text-highlighted); border-bottom-color: var(--ui-primary); font-weight: 600; }
.pfl-page .pf-tab:disabled { opacity: .55; cursor: not-allowed; }
.pfl-page .pf-card { background: var(--ui-bg-elevated); border: 1px solid var(--ui-border); border-radius: var(--ui-radius, 8px); padding: 14px; margin-bottom: 14px; }
.pfl-page .pf-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px 16px; }
.pfl-page .pf-field { margin-bottom: 10px; }
.pfl-page .pf-field label { display: block; font-size: 12px; color: var(--ui-text-muted); margin-bottom: 3px; }
.pfl-page input[type=text], .pfl-page input[type=number], .pfl-page input[type=date], .pfl-page select, .pfl-page textarea {
  width: 100%; padding: 7px 8px; border: 1px solid var(--ui-border); border-radius: 6px;
  background: var(--ui-bg); color: var(--ui-text); font-size: 13px;
}
.pfl-page textarea { min-height: 56px; font-family: monospace; resize: vertical; }
.pfl-page .pf-checkbox-row { display: flex; align-items: center; gap: 6px; }
.pfl-page .pf-checkbox-row label { margin: 0; color: var(--ui-text); font-size: 13px; }
.pfl-page .pf-radio-label { display: inline-flex; align-items: center; gap: 5px; margin: 0 16px 0 0; font-size: 13px; color: var(--ui-text); }
.pfl-page button {
  cursor: pointer; border: 1px solid var(--ui-border); background: var(--ui-bg-elevated); color: var(--ui-text);
  padding: 7px 14px; border-radius: 6px; font-size: 13px;
}
.pfl-page button.pf-primary { background: var(--ui-primary); color: var(--ui-bg); border-color: var(--ui-primary); font-weight: 600; }
.pfl-page button.pf-small { padding: 3px 9px; font-size: 12px; }
.pfl-page button:disabled { opacity: .5; cursor: not-allowed; }
.pfl-page button.pf-link { background: none; border: none; color: var(--ui-primary); padding: 0; text-decoration: underline; }
.pfl-page .pf-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pfl-page .pf-spread { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.pfl-page .pf-muted { color: var(--ui-text-muted); }
.pfl-page .pf-error-text { color: var(--ui-error); font-size: 13px; }
.pfl-page .pf-hidden { display: none !important; }
.pfl-page .pf-banner-warn {
  background: color-mix(in srgb, var(--ui-warning, var(--ui-error)) 15%, var(--ui-bg));
  color: var(--ui-text); border: 1px solid var(--ui-warning, var(--ui-error));
  border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; font-size: 13px;
}
.pfl-page .pf-table-wrap { overflow-x: auto; border: 1px solid var(--ui-border); border-radius: 6px; }
.pfl-page table { border-collapse: collapse; width: 100%; min-width: 420px; }
.pfl-page th, .pfl-page td { padding: 6px 10px; border-bottom: 1px solid var(--ui-border); text-align: left; white-space: nowrap; font-size: 12.5px; }
.pfl-page th { color: var(--ui-text-muted); position: sticky; top: 0; background: var(--ui-bg-elevated); }
.pfl-page .pf-clickable-row { cursor: pointer; }
.pfl-page .pf-clickable-row:hover { background: var(--ui-bg-accented); }
.pfl-page .pf-expand-toggle { display: inline-block; width: 14px; color: var(--ui-text-muted); }
.pfl-page .pf-detail-row td { background: var(--ui-bg); padding: 6px 10px 10px 26px; }
.pfl-page .pf-trades-table { min-width: 380px; }
.pfl-page .pf-trades-table th, .pfl-page .pf-trades-table td { border-bottom: 1px solid var(--ui-border); font-size: 12px; }
.pfl-page .pf-chart-wrap { position: relative; margin-bottom: 6px; }
.pfl-page .pf-chart-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 6px; font-size: 12px; color: var(--ui-text-muted); }
.pfl-page .pf-legend-item { display: inline-flex; align-items: center; gap: 5px; }
.pfl-page .pf-legend-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.pfl-page .pf-chart-tooltip {
  position: absolute; top: 4px; transform: translateX(-50%); background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border); border-radius: 6px; padding: 4px 8px; font-size: 11px;
  color: var(--ui-text); pointer-events: none; white-space: nowrap; box-shadow: 0 1px 4px rgba(0,0,0,.15);
}
.pfl-page .pf-spinner {
  display: inline-block; width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid var(--ui-border); border-top-color: var(--ui-primary);
  animation: pf-spin .7s linear infinite;
}
@keyframes pf-spin { to { transform: rotate(360deg); } }
.pfl-page .pf-note { color: var(--ui-text-muted); font-size: 11px; margin-top: 20px; text-align: center; }
.pfl-page .pf-note-small { font-size: 11px; margin-top: 6px; }
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ELEMENT_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = STYLE_TEXT;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------------
// Auth - copied verbatim from universe_scan_page.template.js (see that file's header
// for the full rationale: reading the `main` Pinia store's persisted token directly
// out of localStorage rather than importing the per-build-mangled store module).
// ---------------------------------------------------------------------------------

function getAuthToken() {
  try {
    const raw = window.localStorage.getItem(MAIN_STORE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return (parsed && parsed.authToken) || '';
  } catch (e) {
    return '';
  }
}

function redirectToLogin() {
  try {
    const raw = window.localStorage.getItem(MAIN_STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.authToken = '';
    window.localStorage.setItem(MAIN_STORE_KEY, JSON.stringify(parsed));
  } catch (e) {
    try { window.localStorage.removeItem(MAIN_STORE_KEY); } catch (e2) { /* best effort */ }
  }
  window.location.href = '/';
}

function api(path, body) {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
    body: JSON.stringify(body || {}),
  }).then(function (res) {
    if (res.status === 401) {
      redirectToLogin();
      throw new Error('unauthorized');
    }
    return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data }; });
  });
}

// ---------------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------------

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
  }
  (children || []).forEach(function (c) { node.appendChild(c); });
  return node;
}

// Used any time a server-provided string (a benchmark symbol, a date) is spliced into
// an HTML string that ends up going through `.innerHTML` (the inline SVG chart below)
// rather than `.textContent`/`el()` - everywhere else on this page uses the latter,
// which needs no escaping at all, matching Universe Scan's strict textContent-only
// policy for untrusted data.
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// ---------------------------------------------------------------------------------
// Formatting helpers - pure, no DOM access, so they're the easiest part of this file
// to smoke-test outside a browser (see the task notes for how this was exercised).
// ---------------------------------------------------------------------------------

// INR formatting per spec: Intl.NumberFormat('en-IN') groups in the lakh/crore style
// (1,00,000 not 100,000), which is what every other rupee figure in this fork uses.
const INR_FORMATTER = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function fmtINR(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return '₹' + INR_FORMATTER.format(n);
}

function fmtPct(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return n.toFixed(2) + '%';
}

function fmtNum(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return n.toFixed(2);
}

function fmtDate(ms) {
  if (!ms) return '-';
  try { return new Date(ms).toLocaleString(); } catch (e) { return String(ms); }
}

// Equity-curve dates are plain `YYYY-MM-DD` (no time/zone). Anchoring at UTC midnight
// keeps every series (portfolio/buy&hold/benchmark - all built off the same trading
// calendar) mapped to the same x pixel for the same date regardless of the browser's
// own local timezone.
function parseDateMs(dateStr) {
  return new Date(dateStr + 'T00:00:00Z').getTime();
}

// Mirrors Python's `round(x, 2)` (banker's-rounding edge cases aside) closely enough
// for CSV export - `toFixed` would instead pad trailing zeros the reference script's
// `csv.writer` never emits for a plain float.
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function parseSymbolsInput(text) {
  // Spec allows comma, space, or newline separated bare tickers (looser than
  // Universe Scan's comma/newline-only textarea) - collapse any run of whitespace
  // or commas into one split point.
  return text.split(/[\s,]+/).map(function (s) { return s.trim(); }).filter(Boolean);
}

// ---------------------------------------------------------------------------------
// CSV builders - same columns as docs/examples/equal_weight_rebalance.py so a run
// exported from here matches the CLI script byte-for-byte in shape.
// ---------------------------------------------------------------------------------

function csvEscape(v) {
  if (v === undefined || v === null) return '';
  const isNumber = typeof v === 'number';
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  // Excel/Sheets formula-injection guard, same as Universe Scan's CSV export: a cell
  // starting with =, +, -, @ or a leading tab/CR is treated as a formula on open.
  if (!isNumber && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function buildEquityCsv(result) {
  const bh = {};
  ((result.buy_and_hold_equal_weight || {}).equity_curve || []).forEach(function (p) { bh[p.date] = p.value; });
  const lines = ['date,value,cash,buy_and_hold_value'];
  (result.equity_curve || []).forEach(function (p) {
    const bhVal = bh[p.date];
    lines.push([
      csvEscape(p.date), round2(p.value), round2(p.cash),
      bhVal === undefined ? '' : round2(bhVal),
    ].join(','));
  });
  return lines.join('\n');
}

function buildTradesCsv(result) {
  const lines = ['date,symbol,side,qty,price,notional,fee'];
  (result.rebalances || []).forEach(function (reb) {
    (reb.trades || []).forEach(function (t) {
      lines.push([
        csvEscape(reb.date), csvEscape(t.symbol), csvEscape(t.side), t.qty, t.price,
        round2(t.notional), round2(t.fee),
      ].join(','));
    });
  });
  return lines.join('\n');
}

function downloadTextFile(filename, text, mime) {
  const blob = new Blob([text], { type: mime || 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ---------------------------------------------------------------------------------
// Inline SVG equity chart - deliberately not the bundle's lightweight-charts (its
// export names are re-mangled on every rebuild, the same reason this whole patching
// approach exists). Pure function: given series + pixel dimensions it returns an HTML
// string plus the pixel-mapping functions the caller needs to wire up hover/tooltip
// interactivity afterwards - no DOM access here, so this is straightforward to
// exercise with a fake result outside a browser.
// ---------------------------------------------------------------------------------

function buildEquityChart(seriesList, opts) {
  opts = opts || {};
  const width = opts.width || 760;
  const height = opts.height || 260;
  const padL = 60, padR = 16, padT = 16, padB = 28;
  const plotW = Math.max(width - padL - padR, 1);
  const plotH = Math.max(height - padT - padB, 1);

  const allT = [];
  const allV = [];
  seriesList.forEach(function (s) {
    s.points.forEach(function (p) { allT.push(p.t); allV.push(p.v); });
  });
  const tMin = Math.min.apply(null, allT);
  const tMax = Math.max.apply(null, allT);
  const vMinRaw = Math.min.apply(null, allV);
  const vMaxRaw = Math.max.apply(null, allV);
  // 5% headroom so a line touching the series' own min/max doesn't render flush
  // against the axis; the `|| 1` fallback guards a perfectly flat series (e.g. a
  // single-point curve) from collapsing the y scale into a divide-by-zero.
  const vPad = (vMaxRaw - vMinRaw) * 0.05 || Math.abs(vMaxRaw) * 0.05 || 1;
  const vMin = vMinRaw - vPad;
  const vMax = vMaxRaw + vPad;

  function xPix(t) { return padL + (tMax === tMin ? plotW / 2 : (t - tMin) / (tMax - tMin) * plotW); }
  function yPix(v) { return padT + plotH - (v - vMin) / (vMax - vMin) * plotH; }

  const colorFallback = ['var(--ui-primary, #3b82f6)', 'var(--ui-text-muted, #9ca3af)', 'var(--ui-warning, #f59e0b)'];
  const polylines = seriesList.map(function (s, i) {
    const color = s.color || colorFallback[i % colorFallback.length];
    const pts = s.points.map(function (p) { return xPix(p.t).toFixed(1) + ',' + yPix(p.v).toFixed(1); }).join(' ');
    return '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2" data-series="' + i + '"/>';
  }).join('');

  const ticks = (opts.tickDatesMs || []).map(function (t) {
    const x = xPix(t).toFixed(1);
    return '<line x1="' + x + '" y1="' + (padT + plotH) + '" x2="' + x + '" y2="' + (padT + plotH + 5)
      + '" stroke="var(--ui-text-muted, #9ca3af)" stroke-width="1"/>';
  }).join('');

  function fmtAxisDate(t) { return new Date(t).toISOString().slice(0, 10); }
  // Axis labels and the legend both interpolate server-provided strings (dates, a
  // benchmark symbol) into an HTML string set via `.innerHTML` by the caller - escape
  // every one of them here, at the point they're built, rather than trusting callers
  // to remember to.
  const xStart = escapeHtml(fmtAxisDate(tMin));
  const xMid = escapeHtml(fmtAxisDate((tMin + tMax) / 2));
  const xEnd = escapeHtml(fmtAxisDate(tMax));
  const yTop = escapeHtml(fmtINR(vMaxRaw));
  const yBottom = escapeHtml(fmtINR(vMinRaw));

  const legend = seriesList.map(function (s, i) {
    const color = s.color || colorFallback[i % colorFallback.length];
    return '<span class="pf-legend-item"><span class="pf-legend-dot" style="background:' + color + '"></span>'
      + escapeHtml(s.label) + '</span>';
  }).join('');

  const axisColor = 'var(--ui-border, #4b5563)';
  const textColor = 'var(--ui-text-muted, #9ca3af)';
  const svg = ''
    + '<svg id="pf-chart-svg" viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="' + height
    + '" preserveAspectRatio="xMidYMid meet">'
    + '<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (padT + plotH) + '" stroke="' + axisColor + '"/>'
    + '<line x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (padL + plotW) + '" y2="' + (padT + plotH) + '" stroke="' + axisColor + '"/>'
    + '<text x="2" y="' + (padT + 4) + '" font-size="10" fill="' + textColor + '">' + yTop + '</text>'
    + '<text x="2" y="' + (padT + plotH) + '" font-size="10" fill="' + textColor + '">' + yBottom + '</text>'
    + '<text x="' + padL + '" y="' + (height - 6) + '" font-size="10" fill="' + textColor + '">' + xStart + '</text>'
    + '<text x="' + (padL + plotW / 2) + '" y="' + (height - 6) + '" font-size="10" text-anchor="middle" fill="' + textColor + '">' + xMid + '</text>'
    + '<text x="' + (padL + plotW) + '" y="' + (height - 6) + '" font-size="10" text-anchor="end" fill="' + textColor + '">' + xEnd + '</text>'
    + ticks
    + polylines
    + '<g id="pf-chart-crosshair" style="display:none">'
    + '<line id="pf-chart-crosshair-line" x1="0" y1="' + padT + '" x2="0" y2="' + (padT + plotH) + '" stroke="' + textColor + '" stroke-dasharray="3,3"/>'
    + '</g>'
    + '<rect id="pf-chart-overlay" x="' + padL + '" y="' + padT + '" width="' + plotW + '" height="' + plotH + '" fill="transparent"/>'
    + '</svg>';

  return {
    html: '<div class="pf-chart-legend">' + legend + '</div>' + svg,
    xPix: xPix,
    yPix: yPix,
    width: width,
    height: height,
    tMin: tMin,
    tMax: tMax,
  };
}

function wireChartInteractivity(container, seriesList, chart) {
  const svg = container.querySelector('#pf-chart-svg');
  const overlay = container.querySelector('#pf-chart-overlay');
  const crosshairGroup = container.querySelector('#pf-chart-crosshair');
  const crosshairLine = container.querySelector('#pf-chart-crosshair-line');
  if (!svg || !overlay) return;

  let tooltip = container.querySelector('.pf-chart-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'pf-chart-tooltip pf-hidden';
    container.appendChild(tooltip);
  }

  function nearestPoint(points, targetT) {
    let best = points[0];
    let bestDiff = Infinity;
    points.forEach(function (p) {
      const diff = Math.abs(p.t - targetT);
      if (diff < bestDiff) { bestDiff = diff; best = p; }
    });
    return best;
  }

  overlay.addEventListener('mousemove', function (evt) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    // The svg scales responsively (width:100%) while its internal coordinate system
    // stays fixed at `chart.width` (the viewBox) - convert the mouse's on-screen
    // pixel back into that fixed coordinate space before comparing it to `xPix(...)`.
    const scaleX = chart.width / rect.width;
    const mouseX = (evt.clientX - rect.left) * scaleX;
    const primaryPoints = seriesList[0].points;
    if (!primaryPoints.length) return;

    let nearestByX = primaryPoints[0];
    let bestDiff = Infinity;
    primaryPoints.forEach(function (p) {
      const diff = Math.abs(chart.xPix(p.t) - mouseX);
      if (diff < bestDiff) { bestDiff = diff; nearestByX = p; }
    });

    const x = chart.xPix(nearestByX.t);
    crosshairGroup.style.display = '';
    crosshairLine.setAttribute('x1', x);
    crosshairLine.setAttribute('x2', x);

    // `.textContent` (never `.innerHTML`) for the tooltip body, so the series labels
    // it includes (a benchmark symbol) need no separate escaping here.
    const parts = [new Date(nearestByX.t).toISOString().slice(0, 10)];
    seriesList.forEach(function (s) {
      const p = nearestPoint(s.points, nearestByX.t);
      parts.push(s.label + ': ' + fmtINR(p.v));
    });
    tooltip.textContent = parts.join('   ');
    tooltip.classList.remove('pf-hidden');
    tooltip.style.left = Math.min(Math.max(evt.clientX - rect.left, 0), rect.width - 4) + 'px';
  });

  overlay.addEventListener('mouseleave', function () {
    crosshairGroup.style.display = 'none';
    tooltip.classList.add('pf-hidden');
  });
}

// ---------------------------------------------------------------------------------
// Static skeleton - fixed, hand-written markup with no server/user data, so a plain
// innerHTML assignment is safe here (same distinction Universe Scan's page makes:
// every value that comes from the server or from user input further down is rendered
// via `.textContent`/`el()`, or - for the one exception, the SVG chart - escaped
// first; see `escapeHtml` above).
// ---------------------------------------------------------------------------------
const SKELETON_HTML = `
  <div class="pf-topbar">
    <h1>Portfolio</h1>
  </div>

  <div class="pf-tabs">
    <button type="button" class="pf-tab pf-tab-active" id="pf-tab-backtest">Backtest</button>
    <button type="button" class="pf-tab" id="pf-tab-rebalance" disabled title="Coming soon - dev-pmallapp/jesse#94">
      Rebalance planner <span class="pf-muted">(coming soon)</span>
    </button>
  </div>

  <div id="pf-panel-backtest">
    <div class="pf-card" id="pf-form-card">
      <div class="pf-spread">
        <h2>New backtest</h2>
        <button class="pf-small" id="pf-refresh-options-btn" type="button">Reload options</button>
      </div>

      <div class="pf-grid">
        <div class="pf-field">
          <label for="pf-exchange">Exchange</label>
          <select id="pf-exchange"></select>
        </div>
        <div class="pf-field">
          <label for="pf-start-date">Start date</label>
          <input type="date" id="pf-start-date">
        </div>
        <div class="pf-field">
          <label for="pf-finish-date">Finish date</label>
          <input type="date" id="pf-finish-date">
        </div>
        <div class="pf-field">
          <label for="pf-capital">Capital</label>
          <input type="number" id="pf-capital" min="0" step="1">
        </div>
        <div class="pf-field">
          <label for="pf-rebalance-days">Rebalance every N days</label>
          <input type="number" id="pf-rebalance-days" min="1" step="1">
        </div>
        <div class="pf-field">
          <label for="pf-fee">Fee (fraction, e.g. 0.001)</label>
          <input type="number" id="pf-fee" min="0" step="0.0001">
        </div>
        <div class="pf-field">
          <label for="pf-benchmark">Benchmark (optional)</label>
          <input type="text" id="pf-benchmark" list="pf-benchmark-list" placeholder="e.g. NIFTY200">
          <datalist id="pf-benchmark-list"></datalist>
        </div>
      </div>

      <div class="pf-field">
        <label>Basket</label>
        <div class="pf-row" style="margin-bottom:8px">
          <label class="pf-radio-label"><input type="radio" name="pf-basket-mode" id="pf-mode-universe" value="universe" checked> Universe</label>
          <label class="pf-radio-label"><input type="radio" name="pf-basket-mode" id="pf-mode-symbols" value="symbols"> Symbols</label>
        </div>
        <div id="pf-universe-wrap" class="pf-field">
          <select id="pf-universe"></select>
        </div>
        <div id="pf-symbols-wrap" class="pf-field pf-hidden">
          <textarea id="pf-symbols" placeholder="RELIANCE, TCS, INFY ..."></textarea>
        </div>
      </div>

      <div class="pf-field pf-checkbox-row">
        <input type="checkbox" id="pf-save-run" checked>
        <label for="pf-save-run">Save this run</label>
      </div>

      <div class="pf-row">
        <button class="pf-primary" id="pf-run-btn" type="button">Run backtest</button>
        <span id="pf-run-spinner" class="pf-spinner pf-hidden"></span>
        <span class="pf-error-text pf-hidden" id="pf-run-error"></span>
      </div>
    </div>

    <div class="pf-card pf-hidden" id="pf-missing-candles-card">
      <h2>Missing candles</h2>
      <p id="pf-missing-candles-message"></p>
      <ul id="pf-missing-candles-list"></ul>
      <p class="pf-muted">Import the missing candles first, then re-run: use <strong>Import Candles</strong>, or
        Universe Scan's <strong>"Import/refresh candles first"</strong> option.</p>
    </div>

    <div class="pf-card pf-hidden" id="pf-results-card">
      <div class="pf-spread">
        <h2>Result</h2>
        <span class="pf-row">
          <button class="pf-small" id="pf-download-equity-btn" type="button">Download equity.csv</button>
          <button class="pf-small" id="pf-download-trades-btn" type="button">Download trades.csv</button>
        </span>
      </div>

      <div class="pf-banner-warn pf-hidden" id="pf-survivorship-banner"></div>

      <div class="pf-table-wrap" style="margin-bottom:14px">
        <table>
          <thead><tr><th></th><th>Final value</th><th>Return %</th><th>CAGR %</th><th>Max DD %</th><th>Sharpe</th></tr></thead>
          <tbody id="pf-metrics-body"></tbody>
        </table>
      </div>
      <p class="pf-muted" id="pf-extra-stats"></p>

      <h3>Equity curve</h3>
      <div id="pf-chart-wrap" class="pf-chart-wrap"></div>

      <div id="pf-unaffordable-wrap" class="pf-hidden">
        <h3>Never held (1 share &gt; target)</h3>
        <ul id="pf-unaffordable-list"></ul>
      </div>

      <h3>Rebalances</h3>
      <div class="pf-table-wrap" style="margin-bottom:14px">
        <table>
          <thead><tr><th></th><th>Date</th><th>Value before</th><th># trades</th><th>Cash after</th></tr></thead>
          <tbody id="pf-rebalances-body"></tbody>
        </table>
      </div>

      <h3>Final holdings</h3>
      <div class="pf-table-wrap">
        <table>
          <thead><tr><th>Symbol</th><th>Qty</th></tr></thead>
          <tbody id="pf-holdings-body"></tbody>
        </table>
      </div>
      <p class="pf-muted pf-note-small">Per-symbol value/weight aren't shown - the API result has no per-symbol closing prices to compute them from.</p>
    </div>
  </div>

  <div id="pf-panel-rebalance" class="pf-hidden">
    <div class="pf-card">
      <h2>Rebalance planner</h2>
      <p class="pf-muted">Coming soon - dev-pmallapp/jesse#94.</p>
    </div>
  </div>

  <div class="pf-card">
    <div class="pf-spread">
      <h2>Saved runs</h2>
      <button class="pf-small" id="pf-refresh-runs-btn" type="button">Refresh</button>
    </div>
    <div class="pf-table-wrap">
      <table>
        <thead><tr><th>Created</th><th>Basket</th><th>Return %</th><th>Actions</th></tr></thead>
        <tbody id="pf-runs-body"></tbody>
      </table>
    </div>
  </div>

  <p class="pf-note">Equal-weight rebalance backtest is a research tool - past-window results, not a live trading recommendation.</p>
`;

// ---------------------------------------------------------------------------------
// Per-mount controller - built fresh in mountPortfolioPage() and torn down in
// unmountPortfolioPage(), matching Universe Scan's pattern so a remounted route never
// leaks state from a previous mount (this page has no polling timer to stop, but
// keeping the same `{start, stop}` shape keeps both pages' mount/unmount code
// identical for whoever maintains them next).
// ---------------------------------------------------------------------------------

function createController(root) {
  const q = function (id) { return root.querySelector('#' + id); };
  const state = { options: null, currentResult: null, currentRunId: null };

  // `pf-run-error` is this page's only error/alert area (mirrors Universe Scan's
  // `usx-start-error`), so every network failure - not just a failed run - surfaces
  // there instead of failing silently.
  function showRunError(message) {
    const errEl = q('pf-run-error');
    errEl.textContent = message;
    errEl.classList.remove('pf-hidden');
  }

  function clearRunError() {
    q('pf-run-error').classList.add('pf-hidden');
  }

  // ------------------------------------------------------------- options --

  function applyFormValues(cfg) {
    if (!cfg) return;
    if (cfg.exchange) q('pf-exchange').value = cfg.exchange;
    if (cfg.start_date) q('pf-start-date').value = cfg.start_date;
    if (cfg.finish_date) q('pf-finish-date').value = cfg.finish_date;
    if (cfg.capital !== undefined && cfg.capital !== null) q('pf-capital').value = cfg.capital;
    if (cfg.rebalance_days !== undefined && cfg.rebalance_days !== null) q('pf-rebalance-days').value = cfg.rebalance_days;
    if (cfg.fee !== undefined && cfg.fee !== null) q('pf-fee').value = cfg.fee;
    q('pf-benchmark').value = cfg.benchmark || '';
    if (cfg.universe) {
      q('pf-mode-universe').checked = true;
      q('pf-mode-symbols').checked = false;
      q('pf-universe').value = cfg.universe;
    } else if (cfg.symbols && cfg.symbols.length) {
      q('pf-mode-symbols').checked = true;
      q('pf-mode-universe').checked = false;
      q('pf-symbols').value = cfg.symbols.join(', ');
    }
    updateBasketModeVisibility();
  }

  function updateBasketModeVisibility() {
    const isSymbols = q('pf-mode-symbols').checked;
    q('pf-universe-wrap').classList.toggle('pf-hidden', isSymbols);
    q('pf-symbols-wrap').classList.toggle('pf-hidden', !isSymbols);
  }

  function populateOptions(o) {
    const exSel = q('pf-exchange');
    exSel.innerHTML = '';
    (o.exchanges || ['NSE', 'BSE']).forEach(function (ex) { exSel.appendChild(el('option', { value: ex, text: ex })); });

    const uSel = q('pf-universe');
    uSel.innerHTML = '';
    (o.universes || []).forEach(function (name) { uSel.appendChild(el('option', { value: name, text: name })); });

    const benchList = q('pf-benchmark-list');
    benchList.innerHTML = '';
    (o.benchmarks || []).forEach(function (name) { benchList.appendChild(el('option', { value: name })); });

    applyFormValues(o.defaults || {});
  }

  function loadOptions() {
    api('/portfolio/options', {}).then(function (r) {
      if (!r.ok) { showRunError('Could not load backtest options from the server.'); return; }
      state.options = r.data;
      populateOptions(r.data);
    }).catch(function () {
      showRunError('Could not reach the server.');
    });
  }

  // ---------------------------------------------------------------- run --

  function currentBasketMode() { return q('pf-mode-symbols').checked ? 'symbols' : 'universe'; }

  function buildPayload() {
    const payload = {
      exchange: q('pf-exchange').value,
      universe: null,
      symbols: null,
      start_date: q('pf-start-date').value,
      finish_date: q('pf-finish-date').value,
      capital: parseFloat(q('pf-capital').value),
      rebalance_days: parseInt(q('pf-rebalance-days').value, 10),
      fee: parseFloat(q('pf-fee').value),
      benchmark: q('pf-benchmark').value.trim() || null,
      save: q('pf-save-run').checked,
    };
    if (currentBasketMode() === 'symbols') {
      payload.symbols = parseSymbolsInput(q('pf-symbols').value);
    } else {
      payload.universe = q('pf-universe').value;
    }
    return payload;
  }

  function setRunning(isRunning) {
    q('pf-run-btn').disabled = isRunning;
    q('pf-run-spinner').classList.toggle('pf-hidden', !isRunning);
  }

  function onRunClick() {
    clearRunError();
    q('pf-missing-candles-card').classList.add('pf-hidden');
    const payload = buildPayload();
    if (payload.universe === null && (!payload.symbols || !payload.symbols.length)) {
      showRunError('Enter at least one symbol, or switch to Universe mode.');
      return;
    }

    setRunning(true);
    api('/portfolio/backtest', payload).then(function (r) {
      setRunning(false);
      if (r.ok) {
        state.currentResult = r.data.result;
        state.currentRunId = r.data.id;
        renderResult(r.data.result);
        loadRunsList();
        return;
      }
      if (r.status === 422 && r.data && r.data.error === 'missing_candles') {
        renderMissingCandles(r.data);
        return;
      }
      showRunError((r.data && r.data.message) || 'Backtest failed.');
    }).catch(function () {
      setRunning(false);
      showRunError('Could not reach the server.');
    });
  }

  function renderMissingCandles(data) {
    q('pf-results-card').classList.add('pf-hidden');
    const card = q('pf-missing-candles-card');
    q('pf-missing-candles-message').textContent = data.message || 'Some symbols are missing candles for this window.';
    const list = q('pf-missing-candles-list');
    list.innerHTML = '';
    (data.missing_symbols || []).forEach(function (s) { list.appendChild(el('li', { text: s })); });
    card.classList.remove('pf-hidden');
  }

  // ------------------------------------------------------------- result --

  function metricsRow(label, m) {
    return el('tr', null, [
      el('td', { text: label }),
      el('td', { text: fmtINR(m.final_value) }),
      el('td', { text: fmtPct(m.total_return_pct) }),
      el('td', { text: fmtPct(m.cagr_pct) }),
      el('td', { text: fmtPct(m.max_drawdown_pct) }),
      el('td', { text: fmtNum(m.sharpe) }),
    ]);
  }

  function renderMetrics(result) {
    const body = q('pf-metrics-body');
    body.innerHTML = '';
    body.appendChild(metricsRow('Rebalanced', result.metrics));
    body.appendChild(metricsRow('Equal-weight buy & hold', result.buy_and_hold_equal_weight.metrics));
    if (result.benchmark && result.benchmark.metrics) {
      body.appendChild(metricsRow('Benchmark (' + result.benchmark.symbol + ')', result.benchmark.metrics));
    }

    const m = result.metrics;
    q('pf-extra-stats').textContent =
      'rebalances ' + m.n_rebalances + '   |   total fees ' + fmtINR(m.total_fees) +
      '   |   turnover ' + fmtNum(m.turnover) + 'x   |   avg cash ' + fmtNum(m.avg_cash_pct) + '%';
  }

  function pointFromCurve(p) { return { t: parseDateMs(p.date), v: p.value }; }

  function renderEquityChart(result) {
    const container = q('pf-chart-wrap');
    const series = [
      { label: 'Rebalanced', color: 'var(--ui-primary, #3b82f6)', points: (result.equity_curve || []).map(pointFromCurve) },
      {
        label: 'Equal-weight buy & hold', color: 'var(--ui-text-muted, #9ca3af)',
        points: ((result.buy_and_hold_equal_weight || {}).equity_curve || []).map(pointFromCurve),
      },
    ];
    if (result.benchmark && result.benchmark.equity_curve && result.benchmark.equity_curve.length) {
      series.push({
        label: 'Benchmark (' + result.benchmark.symbol + ')', color: 'var(--ui-warning, #f59e0b)',
        points: result.benchmark.equity_curve.map(pointFromCurve),
      });
    }
    const tickDatesMs = (result.rebalances || []).map(function (r) { return parseDateMs(r.date); });
    const chart = buildEquityChart(series, { width: 760, height: 260, tickDatesMs: tickDatesMs });
    container.innerHTML = chart.html;
    wireChartInteractivity(container, series, chart);
  }

  function renderUnaffordable(result) {
    const unaffordable = result.unaffordable || {};
    const wrap = q('pf-unaffordable-wrap');
    const list = q('pf-unaffordable-list');
    list.innerHTML = '';
    const symbols = Object.keys(unaffordable);
    if (!symbols.length) { wrap.classList.add('pf-hidden'); return; }
    wrap.classList.remove('pf-hidden');
    symbols.sort().forEach(function (s) {
      list.appendChild(el('li', { text: s + ' (' + fmtINR(unaffordable[s]) + ')' }));
    });
  }

  function renderRebalances(rebalances) {
    const body = q('pf-rebalances-body');
    body.innerHTML = '';
    (rebalances || []).forEach(function (reb) {
      const toggle = el('span', { class: 'pf-expand-toggle', text: '▶' });
      const detailBody = document.createElement('tbody');
      (reb.trades || []).forEach(function (t) {
        detailBody.appendChild(el('tr', null, [
          el('td', { text: t.symbol }),
          el('td', { text: t.side }),
          el('td', { text: String(t.qty) }),
          el('td', { text: fmtINR(t.price) }),
          el('td', { text: fmtINR(t.notional) }),
          el('td', { text: fmtINR(t.fee) }),
        ]));
      });
      const detailTable = el('table', { class: 'pf-trades-table' }, [
        el('thead', null, [
          el('tr', null, ['Symbol', 'Side', 'Qty', 'Price', 'Notional', 'Fee'].map(function (h) { return el('th', { text: h }); })),
        ]),
      ]);
      detailTable.appendChild(detailBody);
      const detailTr = el('tr', { class: 'pf-detail-row pf-hidden' }, [el('td', { colspan: '5' }, [detailTable])]);

      const summaryTr = el('tr', { class: 'pf-clickable-row' }, [
        el('td', null, [toggle]),
        el('td', { text: reb.date }),
        el('td', { text: fmtINR(reb.value_before) }),
        el('td', { text: String((reb.trades || []).length) }),
        el('td', { text: fmtINR(reb.cash_after) }),
      ]);
      summaryTr.addEventListener('click', function () {
        const willShow = detailTr.classList.contains('pf-hidden');
        detailTr.classList.toggle('pf-hidden');
        toggle.textContent = willShow ? '▼' : '▶';
      });

      body.appendChild(summaryTr);
      body.appendChild(detailTr);
    });
  }

  function renderHoldings(holdings) {
    const body = q('pf-holdings-body');
    body.innerHTML = '';
    Object.keys(holdings || {}).sort().forEach(function (symbol) {
      body.appendChild(el('tr', null, [
        el('td', { text: symbol }),
        el('td', { text: String(holdings[symbol]) }),
      ]));
    });
  }

  function renderResult(result) {
    q('pf-missing-candles-card').classList.add('pf-hidden');
    q('pf-results-card').classList.remove('pf-hidden');

    const banner = q('pf-survivorship-banner');
    if (result.survivorship_warning) {
      banner.textContent =
        "Survivorship bias warning: this universe was resolved using TODAY's index membership over a past window - " +
        'absolute returns are inflated by construction. Compare against buy & hold, not zero.';
      banner.classList.remove('pf-hidden');
    } else {
      banner.classList.add('pf-hidden');
    }

    renderMetrics(result);
    renderEquityChart(result);
    renderUnaffordable(result);
    renderRebalances(result.rebalances);
    renderHoldings(result.final_holdings);
  }

  // ------------------------------------------------------------ CSV export --

  function onDownloadEquityCsv() {
    if (!state.currentResult) return;
    downloadTextFile('portfolio-equity.csv', buildEquityCsv(state.currentResult));
  }

  function onDownloadTradesCsv() {
    if (!state.currentResult) return;
    downloadTextFile('portfolio-trades.csv', buildTradesCsv(state.currentResult));
  }

  // -------------------------------------------------------- saved runs --

  function runLabel(cfg) {
    if (cfg.universe) return cfg.universe;
    const n = (cfg.symbols || []).length;
    return n + (n === 1 ? ' symbol' : ' symbols');
  }

  function loadRunsList() {
    api('/portfolio/runs', {}).then(function (r) {
      if (!r.ok) return;
      renderRunsList(r.data.runs || []);
    }).catch(function () {
      showRunError('Could not load saved runs from the server.');
    });
  }

  function renderRunsList(runs) {
    const body = q('pf-runs-body');
    body.innerHTML = '';
    runs.forEach(function (run) {
      const cfg = run.config || {};
      const m = run.metrics || {};
      const loadBtn = el('button', { class: 'pf-link', type: 'button', text: 'Load' });
      loadBtn.addEventListener('click', function () { onLoadRun(run.id); });
      const delBtn = el('button', { class: 'pf-link', type: 'button', text: 'Delete' });
      delBtn.addEventListener('click', function () { onDeleteRun(run.id); });

      body.appendChild(el('tr', null, [
        el('td', { text: fmtDate(run.created_at) }),
        el('td', { text: runLabel(cfg) }),
        el('td', { text: fmtPct(m.total_return_pct) }),
        el('td', null, [loadBtn, document.createTextNode(' | '), delBtn]),
      ]));
    });
  }

  function onLoadRun(id) {
    api('/portfolio/run', { id: id }).then(function (r) {
      if (!r.ok) { window.alert((r.data && r.data.message) || 'Could not load run.'); return; }
      state.currentResult = r.data.result;
      state.currentRunId = r.data.id;
      renderResult(r.data.result);
      applyFormValues((r.data.result && r.data.result.config) || {});
    }).catch(function () {
      window.alert('Could not reach the server.');
    });
  }

  function onDeleteRun(id) {
    if (!window.confirm('Delete this saved run?')) return;
    api('/portfolio/run/delete', { id: id }).then(function (r) {
      if (r.ok) loadRunsList();
      else window.alert((r.data && r.data.message) || 'Could not delete.');
    }).catch(function () {
      // A network-level failure, as opposed to the `r.ok === false` branch above (a
      // server-level failure) - alert() rather than the page-level error banner,
      // matching Universe Scan's own equivalent handler.
      window.alert('Could not delete run: could not reach the server.');
    });
  }

  // ------------------------------------------------------------------ wiring --

  function bind() {
    q('pf-refresh-options-btn').addEventListener('click', loadOptions);
    q('pf-mode-universe').addEventListener('change', updateBasketModeVisibility);
    q('pf-mode-symbols').addEventListener('change', updateBasketModeVisibility);
    q('pf-run-btn').addEventListener('click', onRunClick);
    q('pf-download-equity-btn').addEventListener('click', onDownloadEquityCsv);
    q('pf-download-trades-btn').addEventListener('click', onDownloadTradesCsv);
    q('pf-refresh-runs-btn').addEventListener('click', loadRunsList);
    // The Rebalance planner tab is `disabled` (see SKELETON_HTML) - #94 wires its own
    // click handler and panel toggle when it lands; nothing to bind here yet.
  }

  function start() {
    bind();
    updateBasketModeVisibility();
    loadOptions();
    loadRunsList();
  }

  return { start: start, stop: function () {} };
}

// ---------------------------------------------------------------------------------
// Mount / unmount
// ---------------------------------------------------------------------------------

function mountPortfolioPage(root) {
  ensureStyles();
  root.innerHTML = SKELETON_HTML;
  const controller = createController(root);
  root.__jessePortfolioPage = controller;
  controller.start();
}

function unmountPortfolioPage(root) {
  if (root && root.__jessePortfolioPage) {
    root.__jessePortfolioPage.stop();
    root.__jessePortfolioPage = null;
  }
}

// Tracks the single currently-mounted root div, same pattern as Universe Scan's page:
// only one instance of this page is ever mounted at a time (it's a route component),
// so module-scope state is safe here.
let mountedRoot = null;

export default {
  name: 'PortfolioPage',
  render() {
    return h('div', {
      class: ROOT_CLASS,
      // Vue "function ref": called with the element on mount, and with `null` right
      // before this vnode is unmounted - our only lifecycle hook (see file header).
      ref: function (elOrNull) {
        if (elOrNull) {
          mountedRoot = elOrNull;
          mountPortfolioPage(elOrNull);
        } else {
          unmountPortfolioPage(mountedRoot);
          mountedRoot = null;
        }
      },
    });
  },
};
