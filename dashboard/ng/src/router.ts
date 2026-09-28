// A tiny, hand-rolled route matcher for the India app's own sub-pages
// (/india/stocks, /india/stock/:symbol, ...) - deliberately NOT vue-router.
//
// Why not vue-router: this app is mounted as a *second*, isolated Vue instance inside a
// route component of the upstream dashboard's own Vue app (see
// jesse/dashboard_patches/india_page.template.js and this project's README "Why an
// isolated Vue app"). The upstream app already owns a real vue-router instance for the
// whole SPA (all of `/india/*` resolves to one wrapper route there - see
// scripts/patch_dashboard.py's ROUTES); installing a second vue-router in a nested Vue
// app has no supported way to receive that instance's navigation events, and pulling in
// vue-router as a dependency just to match six flat path patterns is a lot of surface
// for very little benefit. Instead, `entries/india.ts` drives navigation through the
// upstream router directly (`ctx.router.push`/`.replace`/`.afterEach`) and this module
// only turns "what's the current path" into "which of our own pages is that".
import { inject, type Component, type InjectionKey, type Ref } from 'vue';
import StocksPage from './pages/StocksPage.vue';
import StockDetailPage from './pages/StockDetailPage.vue';
import BasketsPage from './pages/BasketsPage.vue';
import BasketDetailPage from './pages/BasketDetailPage.vue';
import ScanPage from './pages/ScanPage.vue';
import PortfolioPage from './pages/PortfolioPage.vue';

export interface NgRoute {
  name: string;
  path: string;
  params: Record<string, string>;
  // Query string as plain strings (repeated keys: last one wins) - e.g. `?basket=` lets
  // basket pages deep-link into Scan/Portfolio with that basket preselected.
  query: Record<string, string>;
}

export type MatchResult = { redirect: string } | { route: NgRoute };

interface RouteDef {
  name: string;
  segments: string[]; // e.g. ['india', 'stock', ':symbol']
  component: Component;
}

function compile(pattern: string): string[] {
  return pattern.split('/').filter(Boolean);
}

const ROUTE_DEFS: RouteDef[] = [
  { name: 'stocks', segments: compile('/india/stocks'), component: StocksPage },
  { name: 'stock-detail', segments: compile('/india/stock/:symbol'), component: StockDetailPage },
  { name: 'baskets', segments: compile('/india/baskets'), component: BasketsPage },
  { name: 'basket-detail', segments: compile('/india/basket/:id'), component: BasketDetailPage },
  { name: 'scan', segments: compile('/india/scan'), component: ScanPage },
  { name: 'portfolio', segments: compile('/india/portfolio'), component: PortfolioPage },
];

function matchSegments(defSegments: string[], pathSegments: string[]): Record<string, string> | null {
  if (defSegments.length !== pathSegments.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < defSegments.length; i++) {
    const defSeg = defSegments[i];
    if (defSeg.startsWith(':')) {
      params[defSeg.slice(1)] = decodeURIComponent(pathSegments[i]);
    } else if (defSeg !== pathSegments[i]) {
      return null;
    }
  }
  return params;
}

/** Matches a full browser path (as read from upstream's `router.currentRoute.value.path`
 * / `afterEach`'s `to.path`) against our own six India sub-routes. The bare `/india`
 * index (and its trailing-slash form) is a redirect, not a page, matching the patcher's
 * single injected `/india/:rest(.*)*` route - upstream's router owns the URL, we only
 * ever tell it where a redirect should land (see entries/india.ts). Unmatched paths
 * under /india/* resolve to a `not-found` route name with no component. */
export function matchPath(path: string): MatchResult {
  const [beforeHash] = path.split('#');
  const [raw, search = ''] = beforeHash.split('?');
  const query = Object.fromEntries(new URLSearchParams(search));
  if (raw === '/india' || raw === '/india/') {
    return { redirect: '/india/stocks' };
  }
  const segments = raw.split('/').filter(Boolean);
  for (const def of ROUTE_DEFS) {
    const params = matchSegments(def.segments, segments);
    if (params) return { route: { name: def.name, path: raw, params, query } };
  }
  return { route: { name: 'not-found', path: raw, params: {}, query } };
}

export function pageComponentFor(name: string): Component | null {
  return ROUTE_DEFS.find((def) => def.name === name)?.component ?? null;
}

// ---------------------------------------------------------------------------------
// provide/inject wiring - installed once in entries/india.ts's mount(), consumed by
// AppShell.vue (for the active tab) and any page that needs to read/change the route.
// `NgRoute` is a plain, locally-owned snapshot (see entries/india.ts's own comment on
// why), never a reference into upstream's own router state.
// ---------------------------------------------------------------------------------

export const NG_ROUTE_KEY: InjectionKey<Ref<NgRoute>> = Symbol('ng-route');
export const NG_NAVIGATE_KEY: InjectionKey<(path: string) => void> = Symbol('ng-navigate');

export function useNgRoute(): Ref<NgRoute> {
  const route = inject(NG_ROUTE_KEY);
  if (!route) throw new Error('useNgRoute() called outside the India app');
  return route;
}

export function useNgNavigate(): (path: string) => void {
  const navigate = inject(NG_NAVIGATE_KEY);
  if (!navigate) throw new Error('useNgNavigate() called outside the India app');
  return navigate;
}
