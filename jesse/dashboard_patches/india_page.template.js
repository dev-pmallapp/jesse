/*jesse-dashboard-patch:india*/
/*
 * India (NSE/BSE) app host component for the compiled Nuxt dashboard
 * (dev-pmallapp/jesse#105) - the single SPA route (`/india/:rest(.*)*`, see
 * scripts/patch_dashboard.py's ROUTES) every India sub-page (Stocks/Baskets/Scan/
 * Portfolio and their own detail pages) resolves to. This file is a SOURCE TEMPLATE,
 * not the file that actually ships in `jesse/static/_nuxt/` -
 * `scripts/patch_dashboard.py` copies it to `jesse/static/_nuxt/india-page.js`,
 * substituting:
 *   - `__VUE_CHUNK__`               -> the current build's Vue-runtime chunk filename
 *   - `__VUE_createElementVNode__`  -> that chunk's current mangled export name for
 *                                      Vue's `createElementVNode`
 *   - `__NG_ENTRY__`                -> the built dashboard/ng entry to `import()`
 *   - `__PAGE_NAME__`               -> this component's vue-router route-record name
 *
 * Unlike the older single-purpose page templates this replaces (universe_scan_page/
 * portfolio_page - see git history), this component owns none of the actual India UI
 * itself: it only bridges (a) Vue's vnode-ref mount/unmount lifecycle and (b) the
 * upstream vue-router instance into dashboard/ng's own isolated Vue app - see
 * dashboard/ng/README.md for why that app is a second, separately-bundled Vue instance
 * rather than sharing this one's (per-build-mangled) runtime, and why it needs the real
 * router instance at all (it owns real sub-routes under /india/* and must read/push
 * real browser URLs through it, not just render statically).
 */
import { __VUE_createElementVNode__ as h } from '__VUE_CHUNK__';

const NG_ENTRY = '__NG_ENTRY__';

// Only one instance of this route component is ever mounted at a time (route
// components are singletons within vue-router) - module-scope state mirrors the same
// pattern the older single-page templates used. `mountToken` guards the async
// `import()`: if the route unmounts (or remounts, e.g. a fast back/forward navigation)
// before dashboard/ng's bundle finishes loading, a stale resolution must not call
// `mount()` on a detached element or clobber a newer mount's own unmount handle.
let unmountFn = null;
let mountToken = 0;

function teardown() {
  mountToken += 1; // invalidate any in-flight import() for the mount being torn down
  if (unmountFn) {
    try {
      unmountFn();
    } catch (e) {
      /* best effort - a broken unmount must not block the route from changing */
    }
    unmountFn = null;
  }
}

export default {
  name: '__PAGE_NAME__',
  render() {
    // Captured outside the ref callback below since that callback isn't a component
    // method - `this.$router` (vue-router's global-property injection) is only
    // reachable from render()'s own `this`, not from an arbitrary closure.
    const router = this.$router;
    return h('div', {
      class: 'ng-host',
      // Vue "function ref": called with the element on mount, and with `null` right
      // before this vnode is unmounted - see the older page templates' headers for the
      // general pattern this reuses.
      ref: function (elOrNull) {
        if (elOrNull) {
          teardown(); // defensive: a prior mount's teardown should already have run
          const el = elOrNull;
          const token = ++mountToken;
          import(NG_ENTRY)
            .then(function (mod) {
              if (token !== mountToken) return; // route changed again before this resolved
              const handle = mod.mount(el, { router: router });
              unmountFn = handle && handle.unmount;
            })
            .catch(function (err) {
              if (token !== mountToken) return;
              el.textContent =
                'NG page bundle missing - run `npm run build` in dashboard/ng, then ' +
                '`python scripts/patch_dashboard.py`. (' + ((err && err.message) || err) + ')';
            });
        } else {
          teardown();
        }
      },
    });
  },
};
