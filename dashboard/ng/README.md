# dashboard/ng — structured source for the India (NSE/BSE) dashboard pages

A Vite + Vue 3 + TypeScript + Tailwind CSS v4 project that replaces the hand-written DOM
templates previously injected by `jesse/dashboard_patches/{universe_scan,portfolio}_page.template.js`
with a real, structured, type-checked SPA-within-the-SPA. "ng" = **N**SE + BSE (this fork
is India/NSE/BSE-only - never read it as an Angular reference).

## Why this exists

`jesse/static/` ships a prebuilt, minified Nuxt/Vite bundle with no source in this repo
(see `docs/dashboard-bundle/PATCHING.md`). `scripts/patch_dashboard.py` content-anchors
its way into that bundle to add one route (`/india/:rest(.*)*`) and four sidebar nav
items, but the actual UI behind that route was, until now, hand-written vanilla-JS DOM
manipulation with no build step, no types, and no component reuse. This project is that
UI, built normally and dropped into `jesse/static/ng/` where it's served as plain static
files.

## Layout

```
dashboard/ng/
  package.json          build = "vue-tsc --noEmit && vite build"
  vite.config.ts         single entry (india), output -> jesse/static/ng/
  tsconfig.json
  src/
    entries/india.ts      mount(el, ctx) - the only thing the patcher's wrapper calls
    router.ts              tiny internal route matcher (NOT vue-router - see below)
    App.vue                 renders AppShell + whichever page router.ts matched
    layouts/AppShell.vue    heading + Stocks/Baskets/Scan/Portfolio tab bar
    pages/                  StocksPage, StockDetailPage, BasketsPage, BasketDetailPage,
                            ScanPage, PortfolioPage - step-2 owns porting the real UI in
    components/             AppCard, AppButton, FormField, DataTable, ProgressBar,
                            StatusPill, Banner, EquityChart (inline SVG, hover crosshair)
    api/client.ts           POST-JSON helper: auth header, 401 handling, error formatting
    utils/format.ts, csv.ts fmtINR/fmtPct/fmtNum/fmtDate/round2, csvEscape/downloadTextFile
    styles/ng.css           Tailwind v4, no preflight, `ng:` prefix - see below
```

## Build

```bash
cd dashboard/ng
npm install
npm run build            # vue-tsc --noEmit, then vite build -> ../../jesse/static/ng/
python ../../scripts/patch_dashboard.py   # (re-)inject the /india route + nav into jesse/static
```

`npm run typecheck` runs just the type check (no build) for quick iteration.

`typescript` is pinned to `5.9.3` (not the newer `7.x` native-compiler rewrite): as of
this writing `vue-tsc` still resolves `typescript/lib/tsc` directly, a subpath TS 7's
package no longer exports, so `vue-tsc --noEmit` hard-crashes under it. Bump the pin once
`vue-tsc` supports TS 7's new package layout.

## Conventions / non-obvious decisions

- **One Vite entry, one mounted Vue app (`entries/india.ts`).** The generated wrapper
  (`jesse/dashboard_patches/india_page.template.js`, which `scripts/patch_dashboard.py`
  turns into `jesse/static/_nuxt/india-page.js`) is the single route the patcher injects
  into the upstream bundle's router (`/india/:rest(.*)*`); it dynamically
  `import()`s `/ng/india.js` and calls `mount(el, { router: this.$router })`, handing us
  upstream's *real* vue-router instance. Everything under `/india/*` - Stocks, Baskets,
  Scan, Portfolio, and their sub-pages - is one Vue app instance with its own tiny
  internal router (`router.ts`), not six separate mount points.

- **Isolated Vue app, bundled Vue - never import vue-router.** This app bundles its own
  copy of Vue (`vue` is a devDependency, inlined into `india.js`) rather than sharing
  upstream's Vue runtime, because upstream's own Vue/Vue-Router exports are re-mangled on
  every rebuild (the same reason `scripts/patch_dashboard.py` content-anchors instead of
  hard-coding names - see `docs/dashboard-bundle/PATCHING.md`). Since we can't import
  upstream's vue-router either, `router.ts` is a tiny hand-rolled path matcher instead;
  navigation is driven through the real upstream router instance handed to `mount()`
  (`ctx.router.push`/`.replace`/`.afterEach`), so the browser URL/history stays correct
  and consistent with the rest of the dashboard - we just never install a *second*
  vue-router to do it.

- **Never pass upstream's reactive objects into our templates.** `entries/india.ts`
  copies the plain `{name, path, params}` shape out of `ctx.router.currentRoute`/
  `afterEach`'s `to` into our own `ref()` (see `NgRoute` in `router.ts`) rather than
  holding a live reference into upstream's reactivity graph - that graph belongs to a
  different Vue app instance and its internal shape isn't a contract we control.

- **Why no Tailwind preflight, and why the `ng:` class prefix.** `styles/ng.css` is
  injected into the *same page* as the upstream dashboard's own CSS - there's no
  iframe/shadow-DOM boundary. Tailwind's preflight (a global CSS reset) would silently
  restyle upstream's own components; the `ng:` prefix means every utility class this
  project emits is uniquely namespaced, so it can never collide with a class name
  upstream's own (unprefixed) Tailwind build already uses. Theme colors are mapped onto
  Nuxt UI's `--ui-*` custom properties (see `ng.css`'s `@theme` block) so pages track the
  dashboard's own light/dark mode with zero `.dark` overrides of our own.

- **The generated CSS file (`ng.css`) needs a manual `<link>`.** The wrapper that
  `import()`s `india.js` isn't itself a Vite-processed HTML entry, so nothing
  auto-injects a stylesheet `<link>` for it the way a normal `<script type="module"
  src="...">` page would get for free - `entries/india.ts`'s `ensureNgCss()` does it by
  hand, once (guarded by a fixed element id).

## Adding a new sub-page

Almost every future India page is an addition *inside* this project, not a
`scripts/patch_dashboard.py` change - the patcher only owns the single `/india/*` host
route and the four top-level nav items (Stocks/Baskets/Scan/Portfolio).

1. Add the `.vue` file under `src/pages/`.
2. Register it in `router.ts`'s `ROUTE_DEFS` (a `name`, a `/india/...` pattern, the
   component).
3. If it needs its own top-level nav item (rather than living under an existing tab, e.g.
   as a `:id` detail page), add it to `AppShell.vue`'s `tabs` array *and* to
   `scripts/patch_dashboard.py`'s `NAV_ITEMS` (see that script's own "Adding a nav item"
   note) - two places because the sidebar (outside `/india/*`) is owned by the patcher,
   while the in-app tab bar (inside `/india/*`) is owned by this project.
4. `npm run build` and re-run `python scripts/patch_dashboard.py`.
