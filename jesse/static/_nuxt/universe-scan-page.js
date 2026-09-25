/*jesse-universe-scan-patch*/
/*
 * Universe Scan page for the compiled Nuxt dashboard (dev-pmallapp/jesse#80/#90).
 *
 * This file is a SOURCE TEMPLATE, not the file that actually ships in
 * `jesse/static/_nuxt/`. `scripts/patch_dashboard.py` copies it into
 * `jesse/static/_nuxt/universe-scan-page.js`, substituting two placeholders:
 *   - `./CoKk4mC0.js`               -> the current build's Vue-runtime chunk filename
 *   - `_`  -> that chunk's current mangled export name for
 *                                      Vue's `createElementVNode` (`createBaseVNode`
 *                                      called with the "is element" fast path)
 * Every other identifier in this file is ours (never mangled), so this template needs
 * no other rebuild-specific substitution.
 *
 * Why only one Vue import: the component below has no reactive state at all - the
 * whole UI (progress, results table, sessions list, ...) is built and updated with
 * plain DOM calls, exactly like the previous standalone `jesse/universe_scan_page/`
 * page. The only thing Vue needs to do is (a) create the single, static root `<div>`
 * this component renders and (b) tell us when that div is attached to/detached from
 * the real DOM. Vue's "function ref" feature - `props.ref` may be a plain callback,
 * called with the element on mount and with `null` right before unmount - gives us
 * (b) for free, so we don't need `ref()`/`onMounted()`/`onBeforeUnmount()` at all.
 * That keeps this file's only dependency on the (per-build-mangled) Vue runtime chunk
 * down to a single export, which is the smallest possible surface for
 * `scripts/patch_dashboard.py` to have to re-resolve after an upstream
 * "Update frontend" rebuild renames every export letter (see
 * docs/dashboard-bundle/PATCHING.md).
 *
 * Auth: the dashboard's own fetch helper (`W`/`n` in `_nuxt/B8_r5oP7.js`, see
 * docs/dashboard-bundle/REVERSE_ENGINEERING.md ยง3) sets a raw (non-"Bearer ")
 * `Authorization` header from the `main` Pinia store's `authToken`, which
 * `pinia-plugin-persistedstate` persists to `localStorage["main"]` (the store's own id
 * is the default storage key - no `key:` override was found on that store's `persist`
 * config). We read that same localStorage entry directly instead of importing the
 * store module itself: the store composable's own export name is just as mangled as
 * everything else in this bundle, and pulling in `_nuxt/B8_r5oP7.js` (255 KB, the
 * single largest chunk) just to read one field would be a heavy, fragile dependency
 * for a page that only ever needs to read (never mutate reactively) the token. If this
 * localStorage key/shape ever changes, every other page's login would already be
 * broken, not just this one - so this assumption fails loud, not silent.
 */
import { _ as h } from './CoKk4mC0.js';

// ---------------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------------

// Pinia's default persistedstate storage key is the store's own id (see file header).
const MAIN_STORE_KEY = 'main';
const ROOT_CLASS = 'usx-page';
const STYLE_ELEMENT_ID = 'jesse-universe-scan-style';

// ---------------------------------------------------------------------------------
// Scoped styles - Tailwind utilities are purged out of the production CSS bundle for
// any class the compiled dashboard templates don't literally use, so this page can't
// safely assume arbitrary utility classes (e.g. `dark:bg-gray-800`) survived the purge
// (none did - the bundle has zero `dark:*` utilities; see docs/dashboard-bundle's
// patching notes). Instead we lean on Nuxt UI's own `--ui-*` design-token CSS custom
// properties (`--ui-bg`, `--ui-text`, `--ui-border`, ...), which the bundle *does*
// ship and which it already re-points for dark mode at the `<html class="dark">`
// level - so plain `var(--ui-bg)` etc. below gets correct light/dark theming for
// free, with zero `.dark` selectors of our own to maintain. Every rule is scoped
// under `.usx-page` so this sheet can never leak into/collide with the rest of the
// dashboard even though <style> itself has no DOM scoping.
// ---------------------------------------------------------------------------------
const STYLE_TEXT = `
.usx-page { font-size: 14px; color: var(--ui-text); }
.usx-page h1 { font-size: 20px; margin: 0; color: var(--ui-text-highlighted); }
.usx-page h2 { font-size: 15px; margin: 0 0 10px; color: var(--ui-text-highlighted); }
.usx-page h3 { font-size: 12px; margin: 16px 0 8px; color: var(--ui-text-muted); text-transform: uppercase; letter-spacing: .03em; }
.usx-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.usx-card { background: var(--ui-bg-elevated); border: 1px solid var(--ui-border); border-radius: var(--ui-radius, 8px); padding: 14px; margin-bottom: 14px; }
.usx-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px 16px; }
.usx-field { margin-bottom: 10px; }
.usx-field label { display: block; font-size: 12px; color: var(--ui-text-muted); margin-bottom: 3px; }
.usx-page input[type=text], .usx-page input[type=number], .usx-page input[type=date], .usx-page select, .usx-page textarea {
  width: 100%; padding: 7px 8px; border: 1px solid var(--ui-border); border-radius: 6px;
  background: var(--ui-bg); color: var(--ui-text); font-size: 13px;
}
.usx-page textarea { min-height: 60px; font-family: monospace; resize: vertical; }
.usx-checkbox-row { display: flex; align-items: center; gap: 6px; }
.usx-checkbox-row label { margin: 0; color: var(--ui-text); font-size: 13px; }
.usx-chip-list { display: flex; flex-wrap: wrap; gap: 6px 14px; max-height: 160px; overflow-y: auto;
  border: 1px solid var(--ui-border); border-radius: 6px; padding: 8px; background: var(--ui-bg); }
.usx-chip-list label { display: flex; align-items: center; gap: 5px; color: var(--ui-text); font-size: 13px; margin: 0; white-space: nowrap; }
.usx-page button {
  cursor: pointer; border: 1px solid var(--ui-border); background: var(--ui-bg-elevated); color: var(--ui-text);
  padding: 7px 14px; border-radius: 6px; font-size: 13px;
}
.usx-page button.usx-primary { background: var(--ui-primary); color: var(--ui-bg); border-color: var(--ui-primary); font-weight: 600; }
.usx-page button.usx-danger { background: var(--ui-error); color: var(--ui-bg); border-color: var(--ui-error); }
.usx-page button.usx-small { padding: 3px 9px; font-size: 12px; }
.usx-page button:disabled { opacity: .5; cursor: not-allowed; }
.usx-page button.usx-link { background: none; border: none; color: var(--ui-primary); padding: 0; text-decoration: underline; }
.usx-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.usx-spread { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.usx-muted { color: var(--ui-text-muted); }
.usx-error-text { color: var(--ui-error); font-size: 13px; margin-top: 6px; }
.usx-hidden { display: none !important; }
.usx-banner-warn {
  background: color-mix(in srgb, var(--ui-warning, var(--ui-error)) 15%, var(--ui-bg));
  color: var(--ui-text); border: 1px solid var(--ui-warning, var(--ui-error));
  border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; font-size: 13px;
}
.usx-progress-outer { background: var(--ui-bg); border: 1px solid var(--ui-border); border-radius: 6px; height: 16px; overflow: hidden; }
.usx-progress-inner { background: var(--ui-primary); height: 100%; transition: width .3s ease; }
.usx-table-wrap { overflow-x: auto; border: 1px solid var(--ui-border); border-radius: 6px; }
.usx-page table { border-collapse: collapse; width: 100%; min-width: 480px; }
.usx-page th, .usx-page td { padding: 6px 10px; border-bottom: 1px solid var(--ui-border); text-align: left; white-space: nowrap; font-size: 12.5px; }
.usx-page th { cursor: pointer; user-select: none; color: var(--ui-text-muted); position: sticky; top: 0; background: var(--ui-bg-elevated); }
.usx-page th.usx-sorted::after { content: ' \\2195'; }
.usx-page tbody tr:hover { background: var(--ui-bg-accented); }
.usx-page tr.usx-beat-bh { color: var(--ui-success, var(--ui-primary)); }
.usx-page tr.usx-row-error td { color: var(--ui-error); }
.usx-pill { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11px; border: 1px solid var(--ui-border); }
.usx-pill.usx-running { color: var(--ui-primary); border-color: var(--ui-primary); }
.usx-pill.usx-done { color: var(--ui-success, var(--ui-primary)); border-color: var(--ui-success, var(--ui-primary)); }
.usx-pill.usx-error, .usx-pill.usx-cancelled { color: var(--ui-error); border-color: var(--ui-error); }
.usx-toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 10px; }
.usx-toolbar input[type=text] { width: 220px; }
.usx-note { color: var(--ui-text-muted); font-size: 11px; margin-top: 20px; text-align: center; }
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ELEMENT_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = STYLE_TEXT;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------------
// Auth - see file header for why we read localStorage directly instead of importing
// the `main` Pinia store module.
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

// Mirrors what a real logout does (mainStore.setAuthToken('')) but from outside the
// store: blank the persisted token, then hard-navigate home. On next boot the app
// shell reads authToken==='' from the (now-fresh) store and renders its own Login
// gate itself (see docs/dashboard-bundle/REVERSE_ENGINEERING.md ยง on nuxt-root) -
// there is no separate `/login` route to push to, the gate is a v-if in the app shell.
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

// Only ever used for the fixed, hand-written skeleton below (no server/user data),
// so a plain innerHTML assignment is safe here. Every value that comes from the
// server or from user input further down is rendered via `.textContent`/`el()`
// (never string-concatenated into HTML) - the standalone page this replaces fixed a
// stored-XSS by making that distinction strict, and we keep it strict here too.
const SKELETON_HTML = `
  <div class="usx-topbar">
    <h1>Universe Scan</h1>
    <span class="usx-muted" id="usx-running-indicator"></span>
  </div>

  <div class="usx-card" id="usx-form-card">
    <div class="usx-spread">
      <h2>New scan</h2>
      <button class="usx-small" id="usx-refresh-options-btn" type="button">Reload options</button>
    </div>

    <div class="usx-grid">
      <div class="usx-field">
        <label for="usx-exchange">Exchange</label>
        <select id="usx-exchange">
          <option value="NSE">NSE</option>
          <option value="BSE">BSE</option>
        </select>
      </div>
      <div class="usx-field">
        <label for="usx-timeframe">Timeframe</label>
        <select id="usx-timeframe"></select>
      </div>
      <div class="usx-field">
        <label for="usx-warmup">Warm-up candles</label>
        <input type="number" id="usx-warmup" value="210" min="0">
      </div>
      <div class="usx-field">
        <label for="usx-balance">Starting balance</label>
        <input type="number" id="usx-balance" value="1000000" min="0">
      </div>
      <div class="usx-field">
        <label for="usx-fee">Fee (fraction, e.g. 0.001)</label>
        <input type="number" id="usx-fee" value="0.001" step="0.0001" min="0">
      </div>
      <div class="usx-field">
        <label for="usx-cpu">CPU cores (optimize phase)</label>
        <input type="number" id="usx-cpu" min="1" value="1">
      </div>
    </div>

    <div class="usx-grid">
      <div class="usx-field">
        <label for="usx-data-start">Data start (warm-up source)</label>
        <input type="date" id="usx-data-start">
      </div>
      <div class="usx-field">
        <label for="usx-train-start">Train start</label>
        <input type="date" id="usx-train-start">
      </div>
      <div class="usx-field">
        <label for="usx-train-finish">Train finish</label>
        <input type="date" id="usx-train-finish">
      </div>
      <div class="usx-field">
        <label for="usx-test-start">Test start</label>
        <input type="date" id="usx-test-start">
      </div>
      <div class="usx-field">
        <label for="usx-test-finish">Test finish</label>
        <input type="date" id="usx-test-finish">
      </div>
      <div class="usx-field">
        <label for="usx-min-train-days">Min train days</label>
        <input type="number" id="usx-min-train-days" value="365" min="1">
      </div>
    </div>

    <div class="usx-field">
      <label>Universes</label>
      <div class="usx-chip-list" id="usx-universe-list"></div>
    </div>

    <div class="usx-field">
      <label for="usx-symbols">Extra symbols (one per line or comma-separated - bare tickers OK, e.g. RELIANCE, TCS)</label>
      <textarea id="usx-symbols"></textarea>
    </div>

    <div class="usx-field">
      <div class="usx-spread">
        <label style="margin:0">Strategies</label>
        <span class="usx-row">
          <button class="usx-small" id="usx-strategies-all-btn" type="button">Select all</button>
          <button class="usx-small" id="usx-strategies-none-btn" type="button">Select none</button>
        </span>
      </div>
      <div class="usx-chip-list" id="usx-strategy-list"></div>
    </div>

    <div class="usx-grid">
      <div class="usx-field usx-checkbox-row">
        <input type="checkbox" id="usx-run-fixed" checked>
        <label for="usx-run-fixed">Run fixed (default hyperparameters)</label>
      </div>
      <div class="usx-field usx-checkbox-row">
        <input type="checkbox" id="usx-run-optimize">
        <label for="usx-run-optimize">Run optimize (per stock)</label>
      </div>
      <div class="usx-field usx-checkbox-row">
        <input type="checkbox" id="usx-import-candles">
        <label for="usx-import-candles">Import/refresh candles first</label>
      </div>
    </div>

    <div class="usx-grid">
      <div class="usx-field">
        <label for="usx-trials">Trials per hyperparameter</label>
        <input type="number" id="usx-trials" value="20" min="1">
      </div>
      <div class="usx-field">
        <label for="usx-optimal-total">Optimal total (trade-count normalisation)</label>
        <input type="number" id="usx-optimal-total" value="30" min="1">
      </div>
      <div class="usx-field">
        <label for="usx-objective">Objective function</label>
        <select id="usx-objective">
          <option value="sharpe">sharpe</option>
          <option value="calmar">calmar</option>
          <option value="sortino">sortino</option>
          <option value="omega">omega</option>
        </select>
      </div>
    </div>

    <div class="usx-row">
      <button class="usx-primary" id="usx-start-btn" type="button">Start scan</button>
      <span class="usx-error-text usx-hidden" id="usx-start-error"></span>
    </div>
  </div>

  <div class="usx-card usx-hidden" id="usx-progress-card">
    <div class="usx-spread">
      <h2>Progress - <span id="usx-progress-session-id" class="usx-muted"></span></h2>
      <button class="usx-danger usx-small" id="usx-cancel-btn" type="button">Cancel</button>
    </div>
    <div class="usx-progress-outer"><div class="usx-progress-inner" id="usx-progress-bar" style="width:0%"></div></div>
    <p class="usx-muted" id="usx-progress-text"></p>
  </div>

  <div class="usx-card usx-hidden" id="usx-results-card">
    <div class="usx-spread">
      <h2>Results - <span id="usx-results-session-id" class="usx-muted"></span></h2>
      <button class="usx-small" id="usx-download-csv-btn" type="button">Download rows CSV</button>
    </div>

    <div class="usx-banner-warn usx-hidden" id="usx-survivorship-banner"></div>

    <div id="usx-skipped-wrap" class="usx-hidden">
      <h3>Skipped symbols</h3>
      <div class="usx-table-wrap" style="margin-bottom:14px">
        <table><thead><tr><th>Symbol</th><th>Reason</th></tr></thead><tbody id="usx-skipped-body"></tbody></table>
      </div>
    </div>

    <div id="usx-summary-wrap"></div>

    <h3>Detail rows</h3>
    <div class="usx-toolbar">
      <select id="usx-filter-phase"><option value="">All phases</option></select>
      <select id="usx-filter-strategy"><option value="">All strategies</option></select>
      <input type="text" id="usx-filter-symbol" placeholder="Filter by symbol...">
    </div>
    <div class="usx-table-wrap">
      <table id="usx-rows-table">
        <thead><tr id="usx-rows-head"></tr></thead>
        <tbody id="usx-rows-body"></tbody>
      </table>
    </div>
  </div>

  <div class="usx-card">
    <div class="usx-spread">
      <h2>Past sessions</h2>
      <button class="usx-small" id="usx-refresh-sessions-btn" type="button">Refresh</button>
    </div>
    <div class="usx-table-wrap">
      <table>
        <thead><tr><th>Created</th><th>Status</th><th>Progress</th><th>Universes</th><th>Strategies</th><th>Rows</th><th>Actions</th></tr></thead>
        <tbody id="usx-sessions-body"></tbody>
      </table>
    </div>
  </div>

  <p class="usx-note">Universe scan is a research tool - past-window backtests, not a live trading recommendation.</p>
`;

const SUMMARY_COLUMNS = [
  ['strategy', 'Strategy'], ['stocks', 'Stocks'], ['trades', 'Trades'],
  ['win_rate_pct', 'Win %'], ['median_pnl_pct', 'Med PnL %'], ['median_bh_pct', 'Med B&H %'],
  ['beat_bh', 'Beat B&H'], ['median_sharpe', 'Med Sharpe'],
  ['median_train_pnl_pct', 'Train Med PnL %'], ['median_train_bh_pct', 'Train Med B&H %'],
  ['errors', 'Errors'],
];

const ROW_PRIORITY_COLUMNS = ['phase', 'strategy', 'symbol', 'train_start'];

// ---------------------------------------------------------------------------------
// Per-mount controller - built fresh in mountScanApp() and torn down in
// unmountScanApp(), so remounting the route (navigate away and back) never leaks a
// stale polling timer from a previous mount.
// ---------------------------------------------------------------------------------

function createController(root) {
  const q = function (id) { return root.querySelector('#' + id); };
  const state = { options: null, session: null, pollTimer: null, sortKey: null, sortDir: 1 };

  function setVal(id, v) { if (v !== undefined && v !== null) q(id).value = v; }

  function makeCheckboxLabel(value, text, checked) {
    const input = el('input', { type: 'checkbox', value: value });
    input.checked = !!checked;
    return el('label', null, [input, document.createTextNode(text)]);
  }

  function checkedValues(container) {
    return Array.prototype.map.call(container.querySelectorAll('input:checked'), function (c) { return c.value; });
  }

  function parseSymbols(text) {
    return text.split(/[\n,]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  // `usx-start-error` is the only error/alert area this page has, so every network
  // failure (not just a failed "Start scan") surfaces there rather than failing
  // silently - a fetch() rejection (offline, DNS, CORS, ...) never resolves the `.then`
  // above, so without a `.catch` these calls would just look like nothing happened.
  function showError(message) {
    const errEl = q('usx-start-error');
    errEl.textContent = message;
    errEl.classList.remove('usx-hidden');
  }

  // ------------------------------------------------------------- options --

  function loadOptions() {
    api('/universe-scan/options', { exchange: q('usx-exchange').value || 'NSE' }).then(function (r) {
      if (!r.ok) return;
      state.options = r.data;
      populateOptions(r.data);
    }).catch(function () {
      showError('Could not load scan options from the server.');
    });
  }

  function populateOptions(o) {
    const tf = q('usx-timeframe');
    tf.innerHTML = '';
    (o.timeframes || ['1D', '1W']).forEach(function (t) {
      tf.appendChild(el('option', { value: t, text: t }));
    });
    if (o.defaults && o.defaults.timeframe) tf.value = o.defaults.timeframe;

    const uList = q('usx-universe-list');
    uList.innerHTML = '';
    (o.universes || []).forEach(function (name) {
      const checked = o.defaults && (o.defaults.universes || []).indexOf(name) !== -1;
      uList.appendChild(makeCheckboxLabel(name, name, checked));
    });

    const sList = q('usx-strategy-list');
    sList.innerHTML = '';
    (o.strategies || []).forEach(function (name) {
      sList.appendChild(makeCheckboxLabel(name, name, false));
    });

    if (o.defaults) {
      const d = o.defaults;
      setVal('usx-data-start', d.data_start);
      setVal('usx-train-start', d.train_start);
      setVal('usx-train-finish', d.train_finish);
      setVal('usx-test-start', d.test_start);
      setVal('usx-test-finish', d.test_finish);
      setVal('usx-warmup', d.warm_up_candles);
      setVal('usx-balance', d.balance);
      setVal('usx-fee', d.fee);
      setVal('usx-trials', d.trials_per_hp);
      setVal('usx-optimal-total', d.optimal_total);
      setVal('usx-objective', d.objective_function);
      setVal('usx-min-train-days', d.min_train_days);
      setVal('usx-cpu', d.cpu_cores);
      q('usx-cpu').max = o.max_cpu_cores || 64;
      q('usx-run-fixed').checked = !!d.run_fixed;
      q('usx-run-optimize').checked = !!d.run_optimize;
      q('usx-import-candles').checked = !!d.import_candles;
    }
  }

  // --------------------------------------------------------------- start --

  function onStartClick() {
    const errEl = q('usx-start-error');
    errEl.classList.add('usx-hidden');
    const startBtn = q('usx-start-btn');
    // Guard against a double-click racing the server's own check-then-create lock
    // (storage.start_lock()) - not strictly required for correctness, but avoids
    // firing a second, guaranteed-409 request while the first is in flight.
    startBtn.disabled = true;

    const payload = {
      exchange: q('usx-exchange').value,
      universes: checkedValues(q('usx-universe-list')),
      symbols: parseSymbols(q('usx-symbols').value),
      strategies: checkedValues(q('usx-strategy-list')),
      timeframe: q('usx-timeframe').value,
      data_start: q('usx-data-start').value,
      train_start: q('usx-train-start').value,
      train_finish: q('usx-train-finish').value,
      test_start: q('usx-test-start').value,
      test_finish: q('usx-test-finish').value,
      warm_up_candles: parseInt(q('usx-warmup').value, 10),
      balance: parseFloat(q('usx-balance').value),
      fee: parseFloat(q('usx-fee').value),
      run_fixed: q('usx-run-fixed').checked,
      run_optimize: q('usx-run-optimize').checked,
      trials_per_hp: parseInt(q('usx-trials').value, 10),
      optimal_total: parseInt(q('usx-optimal-total').value, 10),
      objective_function: q('usx-objective').value,
      cpu_cores: parseInt(q('usx-cpu').value, 10) || null,
      import_candles: q('usx-import-candles').checked,
      min_train_days: parseInt(q('usx-min-train-days').value, 10),
    };

    api('/universe-scan/start', payload).then(function (r) {
      startBtn.disabled = false;
      if (!r.ok) {
        errEl.textContent = (r.data && r.data.message) || 'Failed to start scan.';
        errEl.classList.remove('usx-hidden');
        return;
      }
      openSession(r.data.id);
      loadSessionsList();
    }).catch(function () {
      startBtn.disabled = false;
      showError('Could not reach the server.');
    });
  }

  // ----------------------------------------------------------- progress --

  function stopPolling() {
    if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
  }

  function openSession(id) {
    stopPolling();
    fetchSession(id);
    state.pollTimer = setInterval(function () { fetchSession(id); }, 2000);
  }

  function fetchSession(id) {
    api('/universe-scan/session', { id: id }).then(function (r) {
      if (!r.ok) return;
      state.session = r.data;
      renderSession(r.data);
      if (r.data.status !== 'running') stopPolling();
    });
  }

  function onCancelClick() {
    if (!state.session) return;
    api('/universe-scan/cancel', { id: state.session.id }).catch(function () {
      showError('Could not cancel the scan. Please try again.');
    });
  }

  function renderSession(session) {
    const progressCard = q('usx-progress-card');
    const resultsCard = q('usx-results-card');
    const runningIndicator = q('usx-running-indicator');

    if (session.status === 'running') {
      progressCard.classList.remove('usx-hidden');
      // session.id is server/user-controlled (see UniverseScanStartRequestJson.id) -
      // build the pill via textContent, never HTML-string concatenation, so a
      // crafted id can't inject markup here.
      runningIndicator.textContent = '';
      const pill = el('span', { class: 'usx-pill usx-running' });
      pill.textContent = 'running: ' + session.id;
      runningIndicator.appendChild(pill);
      const p = session.progress || {};
      const pct = p.total ? Math.round(100 * p.done / p.total) : 0;
      q('usx-progress-bar').style.width = pct + '%';
      q('usx-progress-session-id').textContent = session.id;
      q('usx-progress-text').textContent =
        'phase: ' + (p.phase || '-') + '  |  ' + p.done + ' / ' + p.total +
        (p.current ? '  |  current: ' + p.current : '');
    } else {
      progressCard.classList.add('usx-hidden');
      runningIndicator.textContent = '';
    }

    resultsCard.classList.remove('usx-hidden');
    q('usx-results-session-id').textContent = session.id + ' (' + session.status + ')';
    renderSurvivorship(session);
    renderSkipped(session);
    renderSummary(session);
    renderFilters(session);
    renderRows(session);
  }

  function renderSurvivorship(session) {
    const bannerEl = q('usx-survivorship-banner');
    if (!session.survivorship_warning) { bannerEl.classList.add('usx-hidden'); return; }
    const msg = typeof session.survivorship_warning === 'string'
      ? session.survivorship_warning
      : "Survivorship bias warning: at least one universe was resolved using TODAY's index membership over a past window. " +
        'Absolute returns are inflated by construction - compare strategies against each stock\'s own buy & hold, not zero.';
    bannerEl.textContent = msg;
    bannerEl.classList.remove('usx-hidden');
  }

  function renderSkipped(session) {
    const wrap = q('usx-skipped-wrap');
    const body = q('usx-skipped-body');
    body.innerHTML = '';
    const skipped = session.skipped || [];
    if (!skipped.length) { wrap.classList.add('usx-hidden'); return; }
    wrap.classList.remove('usx-hidden');
    skipped.forEach(function (s) {
      body.appendChild(el('tr', null, [
        el('td', { text: s.symbol }),
        el('td', { text: s.reason }),
      ]));
    });
  }

  function renderSummary(session) {
    const wrap = q('usx-summary-wrap');
    wrap.innerHTML = '';
    const summary = session.summary || [];
    const byPhase = {};
    summary.forEach(function (r) { (byPhase[r.phase] = byPhase[r.phase] || []).push(r); });

    Object.keys(byPhase).sort().forEach(function (phase) {
      wrap.appendChild(el('h3', { text: phase.toUpperCase() + ' - per strategy (TEST window)' }));

      const tableWrap = el('div', { class: 'usx-table-wrap' });
      tableWrap.style.marginBottom = '14px';
      const table = document.createElement('table');
      const htr = document.createElement('tr');
      SUMMARY_COLUMNS.forEach(function (c) { htr.appendChild(el('th', { text: c[1] })); });
      table.appendChild(el('thead', null, [htr]));

      const tbody = document.createElement('tbody');
      byPhase[phase].forEach(function (row) {
        const tr = document.createElement('tr');
        // Highlight a strategy that beat buy & hold on most of its stocks.
        if (row.stocks && row.beat_bh > row.stocks / 2) tr.className = 'usx-beat-bh';
        SUMMARY_COLUMNS.forEach(function (c) {
          const v = row[c[0]];
          tr.appendChild(el('td', { text: (v === null || v === undefined) ? '-' : String(v) }));
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      wrap.appendChild(tableWrap);
    });
  }

  function uniqueSorted(arr) {
    const seen = {}; const out = [];
    arr.forEach(function (v) { if (v && !seen[v]) { seen[v] = true; out.push(v); } });
    return out.sort();
  }

  function fillSelectPreserving(id, values) {
    const select = q(id);
    const current = select.value;
    const allLabel = select.options[0];
    select.innerHTML = '';
    select.appendChild(allLabel);
    values.forEach(function (v) { select.appendChild(el('option', { value: v, text: v })); });
    if (values.indexOf(current) !== -1) select.value = current;
  }

  function renderFilters(session) {
    const rows = session.rows || [];
    fillSelectPreserving('usx-filter-phase', uniqueSorted(rows.map(function (r) { return r.phase; })));
    fillSelectPreserving('usx-filter-strategy', uniqueSorted(rows.map(function (r) { return r.strategy; })));
  }

  function filteredRows(session) {
    if (!session) return [];
    const phase = q('usx-filter-phase').value;
    const strategy = q('usx-filter-strategy').value;
    const symbolText = q('usx-filter-symbol').value.trim().toUpperCase();
    return (session.rows || []).filter(function (r) {
      if (phase && r.phase !== phase) return false;
      if (strategy && r.strategy !== strategy) return false;
      if (symbolText && (r.symbol || '').toUpperCase().indexOf(symbolText) === -1) return false;
      return true;
    });
  }

  function rowColumns(rows) {
    const keys = {};
    rows.forEach(function (r) { Object.keys(r).forEach(function (k) { keys[k] = true; }); });
    const rest = Object.keys(keys).filter(function (k) { return ROW_PRIORITY_COLUMNS.indexOf(k) === -1; }).sort();
    return ROW_PRIORITY_COLUMNS.filter(function (k) { return keys[k]; }).concat(rest);
  }

  function renderRows(session) {
    let rows = filteredRows(session);
    const columns = rowColumns(rows);

    if (state.sortKey && columns.indexOf(state.sortKey) !== -1) {
      const key = state.sortKey, dir = state.sortDir;
      rows = rows.slice().sort(function (a, b) {
        let av = a[key], bv = b[key];
        if (av === undefined) return 1; if (bv === undefined) return -1;
        if (typeof av === 'object') av = JSON.stringify(av);
        if (typeof bv === 'object') bv = JSON.stringify(bv);
        if (av < bv) return -1 * dir; if (av > bv) return 1 * dir; return 0;
      });
    }

    const head = q('usx-rows-head');
    head.innerHTML = '';
    columns.forEach(function (c) {
      const th = el('th', { text: c });
      if (c === state.sortKey) th.className = 'usx-sorted';
      th.addEventListener('click', function () {
        if (state.sortKey === c) state.sortDir *= -1; else { state.sortKey = c; state.sortDir = 1; }
        renderRows(state.session);
      });
      head.appendChild(th);
    });

    const body = q('usx-rows-body');
    body.innerHTML = '';
    rows.forEach(function (r) {
      const tr = document.createElement('tr');
      if (r.error) tr.className = 'usx-row-error';
      columns.forEach(function (c) {
        let v = r[c];
        if (v !== undefined && typeof v === 'object') v = JSON.stringify(v);
        tr.appendChild(el('td', { text: (v === undefined || v === null) ? '' : String(v) }));
      });
      body.appendChild(tr);
    });
  }

  function onDownloadCsvClick() {
    if (!state.session) return;
    const rows = state.session.rows || [];
    const columns = rowColumns(rows);
    const esc = function (v) {
      if (v === undefined || v === null) return '';
      // Numeric cells (e.g. a negative pnl_pct) must stay numbers, not get a
      // formula-injection guard quote prepended just for starting with '-'.
      const isNumber = typeof v === 'number';
      if (typeof v === 'object') v = JSON.stringify(v);
      v = String(v);
      // Excel/Sheets treat a cell starting with =, +, -, @, or a leading tab/CR as a
      // formula to execute on open - prefix with a single quote to force it to stay
      // literal text (CSV formula injection). Only applies to non-numeric cells.
      if (!isNumber && /^[=+\-@\t\r]/.test(v)) v = "'" + v;
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    const lines = [columns.join(',')];
    rows.forEach(function (r) { lines.push(columns.map(function (c) { return esc(r[c]); }).join(',')); });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'universe-scan-' + state.session.id + '.csv';
    a.click();
  }

  // -------------------------------------------------------- sessions list --

  function loadSessionsList() {
    api('/universe-scan/sessions', {}).then(function (r) {
      if (!r.ok) return;
      renderSessionsList(r.data.sessions || []);
    }).catch(function () {
      showError('Could not load past sessions from the server.');
    });
  }

  function fmtDate(iso) {
    if (!iso) return '-';
    try { return new Date(iso).toLocaleString(); } catch (e) { return iso; }
  }

  function renderSessionsList(sessions) {
    const body = q('usx-sessions-body');
    body.innerHTML = '';
    sessions.forEach(function (s) {
      const cfg = s.config_summary || {};
      const p = s.progress || {};
      const progressText = p.total ? (p.done + ' / ' + p.total + (p.phase ? ' (' + p.phase + ')' : '')) : '-';

      const pill = el('span', { class: 'usx-pill usx-' + s.status, text: s.status });
      const openBtn = el('button', { class: 'usx-link', type: 'button', text: 'Open' });
      openBtn.addEventListener('click', function () { openSession(s.id); });
      const delBtn = el('button', { class: 'usx-link', type: 'button', text: 'Delete' });
      delBtn.addEventListener('click', function () {
        if (!window.confirm('Delete session ' + s.id + '?')) return;
        api('/universe-scan/delete', { id: s.id }).then(function (r) {
          if (r.ok) loadSessionsList(); else window.alert((r.data && r.data.message) || 'Could not delete.');
        }).catch(function () {
          // A network-level failure (as opposed to the `r.ok === false` branch above,
          // a server-level failure) - alert() rather than the page-level error banner,
          // matching this same handler's own sibling failure path immediately above.
          window.alert('Could not delete session ' + s.id + ': could not reach the server.');
        });
      });

      body.appendChild(el('tr', null, [
        el('td', { text: fmtDate(s.created_at) }),
        el('td', null, [pill]),
        el('td', { text: progressText }),
        el('td', { text: (cfg.universes || []).join(', ') || '-' }),
        el('td', { text: (cfg.strategies || []).join(', ') || '-' }),
        el('td', { text: String(s.row_count) }),
        el('td', null, [openBtn, document.createTextNode(' | '), delBtn]),
      ]));
    });
  }

  // ------------------------------------------------------------------ wiring --

  function bind() {
    q('usx-refresh-options-btn').addEventListener('click', loadOptions);
    q('usx-exchange').addEventListener('change', loadOptions);
    q('usx-strategies-all-btn').addEventListener('click', function () {
      q('usx-strategy-list').querySelectorAll('input[type=checkbox]').forEach(function (c) { c.checked = true; });
    });
    q('usx-strategies-none-btn').addEventListener('click', function () {
      q('usx-strategy-list').querySelectorAll('input[type=checkbox]').forEach(function (c) { c.checked = false; });
    });
    q('usx-start-btn').addEventListener('click', onStartClick);
    q('usx-cancel-btn').addEventListener('click', onCancelClick);
    q('usx-download-csv-btn').addEventListener('click', onDownloadCsvClick);
    ['usx-filter-phase', 'usx-filter-strategy'].forEach(function (id) {
      q(id).addEventListener('change', function () { renderRows(state.session); });
    });
    q('usx-filter-symbol').addEventListener('input', function () { renderRows(state.session); });
    q('usx-refresh-sessions-btn').addEventListener('click', loadSessionsList);
  }

  function start() {
    bind();
    loadOptions();
    loadSessionsList();
  }

  return { start: start, stop: stopPolling };
}

// ---------------------------------------------------------------------------------
// Mount / unmount
// ---------------------------------------------------------------------------------

function mountScanApp(root) {
  ensureStyles();
  root.innerHTML = SKELETON_HTML;
  const controller = createController(root);
  root.__jesseUniverseScan = controller;
  controller.start();
}

function unmountScanApp(root) {
  if (root && root.__jesseUniverseScan) {
    root.__jesseUniverseScan.stop();
    root.__jesseUniverseScan = null;
  }
}

// Tracks the single currently-mounted root div so the ref callback's "unmount" call
// (which Vue invokes as `ref(null)`, with no element argument at all) still knows
// which controller to tear down. Only one instance of this page is ever mounted at a
// time (it's a route component), so module-scope state is safe here.
let mountedRoot = null;

export default {
  name: 'UniverseScanPage',
  render() {
    return h('div', {
      class: ROOT_CLASS,
      // Vue "function ref": called with the element on mount, and with `null` right
      // before this vnode is unmounted - our only lifecycle hook (see file header).
      ref: function (elOrNull) {
        if (elOrNull) {
          mountedRoot = elOrNull;
          mountScanApp(elOrNull);
        } else {
          unmountScanApp(mountedRoot);
          mountedRoot = null;
        }
      },
    });
  },
};
