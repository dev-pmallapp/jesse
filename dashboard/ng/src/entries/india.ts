// Single Vite entry for the whole India app - built to `jesse/static/ng/india.js` and
// dynamically `import()`-ed at runtime by the generated
// `jesse/static/_nuxt/india-page.js` wrapper (see jesse/dashboard_patches/
// india_page.template.js). `mount`/its return shape are a fixed contract with that
// wrapper file - keep both in sync if either changes.
import { createApp, ref, type App as VueApp, type Ref } from 'vue';
import AppRoot from '../App.vue';
import { matchPath, NG_NAVIGATE_KEY, NG_ROUTE_KEY, type NgRoute } from '../router';
import '../styles/ng.css';

const NG_CSS_LINK_ID = 'jesse-ng-css';

/** The wrapper that dynamically imports this module isn't itself processed by Vite, so
 * nothing auto-injects a `<link>` for this bundle's extracted stylesheet the way a
 * normal `<script type="module" src="...">` HTML entry would get for free - inject it
 * by hand, once (the id guard makes repeat mounts, e.g. navigating away from and back
 * to an India page, a no-op here). */
function ensureNgCss(): void {
  if (document.getElementById(NG_CSS_LINK_ID)) return;
  const link = document.createElement('link');
  link.id = NG_CSS_LINK_ID;
  link.rel = 'stylesheet';
  link.href = '/ng/ng.css';
  document.head.appendChild(link);
}

/** Upstream's real vue-router instance (a *different* Vue app's router - see
 * README.md "Why an isolated Vue app"). Typed loosely/structurally to just the methods
 * this module actually calls, since its concrete type lives in the upstream bundle, not
 * in this project. */
export interface NgMountContext {
  router: {
    currentRoute: { value: { path: string } };
    push: (path: string) => unknown;
    replace: (path: string) => unknown;
    afterEach: (cb: (to: { path: string }) => void) => () => void;
  };
}

export interface NgMountHandle {
  unmount(): void;
}

export function mount(el: HTMLElement, ctx: NgMountContext): NgMountHandle {
  ensureNgCss();

  const child = document.createElement('div');
  el.appendChild(child);

  // `routeRef` is a plain, locally-owned snapshot of "where are we" - never upstream's
  // own reactive route object. Upstream's router belongs to a different Vue app's
  // reactivity graph; reading a value out of it into our own ref (rather than holding a
  // live reference into it) is what keeps this app decoupled from that graph's own
  // internal shape, which can change across an upstream dashboard rebuild.
  const routeRef: Ref<NgRoute> = ref<NgRoute>({ name: '', path: '', params: {} });

  function applyPath(path: string): void {
    const matched = matchPath(path);
    if ('redirect' in matched) {
      // Replace (not push) so the bare `/india` URL never lands in browser history -
      // `afterEach` below fires again once this resolves, with the final, non-redirect
      // match.
      ctx.router.replace(matched.redirect);
      return;
    }
    routeRef.value = matched.route;
  }

  function navigate(path: string): void {
    ctx.router.push(path);
  }

  applyPath(ctx.router.currentRoute.value.path);

  const app: VueApp = createApp(AppRoot);
  app.provide(NG_ROUTE_KEY, routeRef);
  app.provide(NG_NAVIGATE_KEY, navigate);
  app.mount(child);

  const unsubscribe = ctx.router.afterEach((to) => applyPath(to.path));

  return {
    unmount() {
      unsubscribe();
      app.unmount();
      child.remove();
    },
  };
}
