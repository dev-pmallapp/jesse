/*jesse-dashboard-patch:portfolio*/
/*
 * Portfolio page for the compiled Nuxt dashboard (dev-pmallapp/jesse#92).
 *
 * PLACEHOLDER: this page is intentionally a static no-op for now. It exists only so
 * the route/nav entry `scripts/patch_dashboard.py` adds has something real to point
 * at instead of a 404 - the equal-weight rebalance backtest (#93) and the rebalance
 * planner (#94) will replace this file's body (`mountPortfolioPage` below) with the
 * real UI once those land. Keep this file small until then.
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
 *
 * Auth: this placeholder makes no API calls, so unlike Universe Scan's page it has no
 * `getAuthToken()` / 401-redirect logic yet. When #93/#94 add real API calls here,
 * copy that logic (and its localStorage-token rationale) from
 * universe_scan_page.template.js's file header and `api()` helper verbatim rather than
 * reinventing it - the auth mechanics are identical for every page in this dashboard.
 */
import { _ as h } from './CoKk4mC0.js';

const ROOT_CLASS = 'pfl-page';
const STYLE_ELEMENT_ID = 'jesse-portfolio-style';

// Same Nuxt UI `--ui-*` design-token approach as Universe Scan's page (see that
// file's header) - purged Tailwind utility classes (e.g. `dark:*`) aren't safe to
// rely on in this bundle, but these CSS custom properties survive the purge and
// already track the dashboard's light/dark theme for free.
const STYLE_TEXT = `
.pfl-page { font-size: 14px; color: var(--ui-text); }
.pfl-page h1 { font-size: 20px; margin: 0 0 10px; color: var(--ui-text-highlighted); }
.pfl-page p { color: var(--ui-text-muted); }
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ELEMENT_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = STYLE_TEXT;
  document.head.appendChild(style);
}

function mountPortfolioPage(root) {
  ensureStyles();
  root.innerHTML = '';
  const h1 = document.createElement('h1');
  h1.textContent = 'Portfolio';
  const note = document.createElement('p');
  note.textContent = 'The equal-weight rebalance backtest (#93) and rebalance planner (#94) are coming soon.';
  root.appendChild(h1);
  root.appendChild(note);
}

function unmountPortfolioPage(root) {
  if (root) root.innerHTML = '';
}

// Tracks the single currently-mounted root div, same pattern (and same reasoning - see
// that file's comment above its own `mountedRoot`) as Universe Scan's page: only one
// instance of this page is ever mounted at a time (it's a route component), so
// module-scope state is safe here.
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
