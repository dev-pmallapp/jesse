# Reverse-engineering `jesse/static` (Nuxt 3 SPA) for a "Universe Scan" dashboard page

Scope: read-only investigation of the prebuilt bundle in `jesse/static/` (506 chunks under
`_nuxt/`, no source available). Goal: figure out how to add "Universe Scan" as a first-class
page next to Optimization / Monte Carlo / Significance Test, using Significance Test as the
template. All file paths below are relative to `jesse/static/` unless stated otherwise.
Everything is evidence-based (chunk name + byte offset/snippet); anything I couldn't pin down
with certainty is flagged "uncertain".

Build facts (from `index.html`/`200.html`, byte-identical):
- Pure client-rendered SPA: `window.__NUXT__.config` has `app.baseURL:"/"`,
  `buildAssetsDir:"/_nuxt/"`, `buildId:"59f3d77d-..."`, and the embedded `__NUXT_DATA__` payload
  is `[{"prerenderedAt":1,"serverRendered":2},...,false]` (serverRendered = `false`). There is
  no server-side manifest fetch and no `builds/meta/*.json` (that's a Nitro/SSR artifact; this
  repo ships static-only output). `buildId` is not compared against anything at runtime.
- Entry point is an import map: `<script type="importmap">{"imports":{"#entry":"/_nuxt/rHIqefrb.js"}}`.
  `index.html`/`200.html`/`404.html` are all identical bootstrap shells (only asset hashes would
  differ across a rebuild).
- No Subresource Integrity: none of the `<link rel="modulepreload">`/`<link rel="stylesheet">`
  tags carry an `integrity=` attribute, and dynamic `import()` calls are plain ESM with no hash
  check (see §1). A hand-added, un-hashed chunk file will load exactly like a hashed one.

## 1. Router, `__vite__mapDeps`, and chunk resolution

The route table and the app's `Nav` layout component both live in the **entry chunk**
`_nuxt/rHIqefrb.js` (187 KB) — this is not a separate "router chunk"; Nuxt inlined the app
shell (`app.vue` equivalent, `Nav.vue`, the Pinia socket store, i18n-less bootstrap) into the
entry point because the shell is needed on every request.

Route-record format (`_a` array, found by searching for `path:\`/optimization\``):
```js
_a=[{name:`backtest-benchmark`,path:`/backtest/benchmark`,component:()=>Y(()=>import(`./coSIg_O3.js`),__vite__mapDeps([9,5,3,1,2,10,...]),import.meta.url)},
 ...
 {name:`significance-test`,path:`/significance-test`,component:()=>Y(()=>import(`./CZ3SG3_I2.js`),__vite__mapDeps([123,3,1,2,...]),import.meta.url)},
 {name:`significance-test-history`,path:`/significance-test/history`,component:()=>Y(()=>import(`./CZymKofZ2.js`),__vite__mapDeps([66,...]),import.meta.url)},
 {name:`significance-test-id`,path:`/significance-test/:id()`,component:()=>Y(()=>import(`./O1vzaDvk2.js`),__vite__mapDeps([98,...]),import.meta.url)},
 ...
 {name:`index`,path:`/`,component:()=>Y(()=>import(`./BLCaNkgi.js`),__vite__mapDeps([127,...]),import.meta.url)}];
```
This is a plain JS array literal assigned to `_a`, later passed as `routes: o` (with
`o = Fn.routes ? ... : _a`) into `vue-router`'s `createRouter({...routes:o})` inside a Nuxt
plugin named `nuxt:router` (`setup(e){...let l=ma({...Fn,...routes:o})...e.vueApp.use(l)}`,
same file, right after `_a`). Route names use vue-router's flattened
`<parent>-<child>` convention (`significance-test`, `significance-test-history`,
`significance-test-id`) — matching Nuxt's file-based `pages/significance-test/{index,history,[id]}.vue`.

`__vite__mapDeps` (defined at the very top of `rHIqefrb.js`):
```js
const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./D24BC_UT2.js","./Cd-sGgPF.js","./DytYwiiF.js","./CoKk4mC0.js","./B8_r5oP7.js",...])))=>i.map(i=>d[i]);
```
`m.f` is a single flat, deduplicated array of **every** chunk/CSS path referenced by *any*
dynamic import in the whole app (memoized on the function object itself, built once). Each
route's `__vite__mapDeps([9,5,3,1,2,10,...])` call is just "look up these indices in that flat
array" → the actual list of `<link rel="modulepreload">`/`<link rel="stylesheet">` URLs Vite
wants preloaded before/while importing that route's chunk (this is Vite's standard chunk
dependency-preloading output, not Jesse-specific). Index 0 of each per-route array is
consistently the chunk's own file (e.g. index `9` → `./coSIg_O3.js`, which is also the chunk
being `import()`-ed) — Vite includes the importee itself in its own preload list.

`Y` (used as `Y(()=>import(...), depsArray, import.meta.url)`) is imported as
`import{t as Y}from"./HclGiUj8.js"` — a 1.2 KB file whose export `n` (aliased `t`) is Vite's
standard `__vitePreload` helper:
```js
var e=function(e,t){return new URL(e,t).href}, t={}, n=function(n,r,i){
  let a=Promise.resolve();
  if(r&&r.length>0){ /* for each dep URL: resolve relative to `i` (import.meta.url of the
    IMPORTING chunk, i.e. rHIqefrb.js → "/_nuxt/"), inject <link rel="modulepreload"|"stylesheet">
    into <head> if not already present, await CSS loads */ }
  return a.then(...).then(e=>{ ...; return n().catch(o) }); // finally calls the import() callback
};
```
So relative import specifiers (`./X.js`, and the mapDeps entries) are always resolved against
`import.meta.url` of the **importing chunk**, passed explicitly as the 3rd arg — for a route
declared in `rHIqefrb.js`, that's `/_nuxt/rHIqefrb.js`, so `"./universe-scan.js"` resolves to
`/_nuxt/universe-scan.js`. There is **no hash/manifest validation** anywhere in this helper —
it just creates `<link>`/`import()` for whatever URL strings you give it. A hand-written,
un-hashed file dropped into `_nuxt/` and referenced by a literal string
(`import('./universe-scan.js')`) will load exactly like any Vite-hashed chunk, as long as:
- it's valid ESM and its own `import` specifiers point at real files in `_nuxt/` (hashed or not), and
- its `__vite__mapDeps` indices (if you reuse the helper) exist in `m.f`, or you skip mapDeps
  entirely and pass an empty deps array (`Y(()=>import('./universe-scan.js'),[],import.meta.url)`)
  — degrades to "no preloading", not a hard failure.

**Two ways to add a route:**
1. **Edit the entry chunk's `_a` array directly** (append a new route object + a new `m.f`
   entry for your chunk). This is what "looks like a real Nuxt page" to vue-router — it will
   show up in `router.getRoutes()`, support `router.resolve()`, nested layouts, etc. Downside:
   requires patching a large, auto-generated, minified file whose *variable names* change on
   every Nuxt rebuild (see §6).
2. **`router.addRoute()` from a runtime-injected plugin** (e.g. a `<script type="module">`
   appended to `index.html`/`200.html`/`404.html` that imports the Vue Router instance and
   calls `addRoute()` after the app mounts). This avoids touching the entry chunk's route
   array, but the entry chunk does not export the router instance or app instance anywhere
   accessible from outside its closure (`e.vueApp.use(l)` — `l` the router is local to the
   `nuxt:router` plugin's `setup()`; nothing hangs it off `window`). To use `addRoute()` you'd
   need the injected script to get a handle on the singleton router — feasible via
   `getCurrentInstance()`/`app.config.globalProperties` *inside* a real Vue/Nuxt plugin
   (registered like any other Nuxt plugin, discovered by Nuxt's plugin manifest at build
   time — but since we can't rerun the Nuxt build, an externally-injected `<script>` has no
   supported hook into the already-built `#entry` module graph other than importing it, which
   just re-runs `main.js`'s bootstrap a second time). **Practical conclusion: for this
   prebuilt-bundle-only fork, editing `_a` in `rHIqefrb.js` in place is the only actually
   workable option** — `addRoute` from a *sibling* script has no clean attachment point. (See
   §6 for how to do this patch idempotently across rebuilds.)

## 2. Navigation (sidebar) and home page cards

The sidebar/mode-switcher lives in the **same entry chunk**, as a component literally named
`Nav` (`Object.assign(P({__name:\`Nav\`,setup(e){...`), also in `rHIqefrb.js`. Nav items:
```js
let h=j(()=>{let e=[
  {name:`Home`,to:`/`,icon:Oo},
  {name:`Strategies`,to:`/strategies`,icon:nr},
  {name:`Import Candles`,to:`/candles/`,icon:Qn},
  {name:`Backtest`,to:`/backtest/`,icon:yo},
  {name:`Optimization`,to:`/optimization/`,icon:wo},
  {name:`Monte Carlo`,to:`/monte-carlo/`,icon:ho},
  {name:`Rule Test`,to:`/significance-test`,icon:_o}];
  return e.push({name:`Live`,to:`/live/`,icon:To}), e}),
g={Backtest:`backtest`,Optimization:`optimization`,"Monte Carlo":`monteCarlo`,"Rule Test":`significanceTest`,Live:`live`};
function _(e){
  if(e.name===`Strategies`) return r.navigationPath;         // r = strategies store
  let t=g[e.name];
  return t ? n.navigationPath(t) : e.to;                     // n = sessionNavigation store
}
```
(icon vars `Oo,nr,Qn,yo,wo,ho,_o,To` are per-build minified names, each bound to an imported
Nuxt-UI-Icon/heroicons component — **not string names**, so a new nav entry can't introduce a
brand-new `i-heroicons-*` icon without a fresh Nuxt build; it must reuse one of these
already-in-scope icon component variables, e.g. `icon:_o` — reusing the same icon component
reference for two nav rows is harmless in Vue). The label displayed is literally `Rule Test`
(not "Significance Test" — the UI copy diverges from the route/store name), each row is a
`router-link` (`ce=ee(\`router-link\`)`, i.e. `resolveComponent('router-link')`) whose `:to` is
computed via `_(item)` above.

`sessionNavigation` Pinia store (mode → "remember last session" map), `_nuxt/C96bnRGM.js`:
```js
var E={backtest:`/backtest/`,optimization:`/optimization/`,monteCarlo:`/monte-carlo/`,significanceTest:`/significance-test`,live:`/live/`},
    D={"backtest-id":`backtest`,"optimization-id":`optimization`,"monte-carlo-id":`monteCarlo`,"significance-test-id":`significanceTest`,"live-id":`live`};
k=_(`sessionNavigation`,{
  state:()=>({lastOpenedSessionIds:{backtest:null,optimization:null,monteCarlo:null,significanceTest:null,live:null}}),
  getters:{navigationPath:e=>t=>{let n=e.lastOpenedSessionIds[t];
      return O(n)?`${E[t].replace(/\/$/,``)}/${n}`:E[t]}},  // O(n) = is-UUID-shaped check
  persist:{storage:g.localStorage()},
  actions:{rememberRoute(e,t){...this.lastOpenedSessionIds[D[e]]=t}}
});
```
So clicking "Rule Test" in the sidebar takes you to `/significance-test/<last-session-uuid>` if
one is remembered (localStorage-persisted via `pinia-plugin-persistedstate`), else the plain
`/significance-test` form. Adding "Universe Scan" the same way needs: a new key in `E`/`D`
(e.g. `universeScan:\`/universe-scan/\``, `"universe-scan-id":\`universeScan\``) plus a nav row
`{name:\`Universe Scan\`,to:\`/universe-scan\`,icon:<reuse an existing icon var>}` and an entry
in the `g` name→store-key map — **all inside `rHIqefrb.js`** (Nav and this store are in
different chunks, `C96bnRGM.js` is a normal, addressable chunk so it's easier to patch than the
entry chunk, but the actual nav array is only in `rHIqefrb.js`). Minimal viable edit: skip the
"remember session" wiring entirely and just add `{name:\`Universe Scan\`,to:\`/universe-scan\`,icon:_o}`
to the array in `rHIqefrb.js` — `_(item)` falls back to `e.to` for any name not in `g`.

Home page (`_nuxt/BLCaNkgi.js`, route `index`, path `/`) renders one `UCard` per mode with a
24h/7-day/all-time usage summary:
```js
e(s,null,{header:p(()=>[a(`div`,Ve,[a(`div`,He,[e(i,{name:`i-heroicons-shield-check`,class:`w-5 h-5 text-pink-600 dark:text-pink-400`})]),
  n[16]||=a(`h3`,{...},`Rule Significance Tests`,-1)])]),
  default:p(()=>[a(`dl`,Ue,[a(`div`,We,[n[17]||=a(`dt`,{...},`24h`,-1),a(`dd`,...,f(r.value.significance_test.last_24h)?,1)]), ...])]),_:1})
```
(`s` = `UCard`, `i` = `UIcon`, `f`/local text-render helper = `toDisplayString`). A Universe
Scan home-page card would need a matching `{last_24h,last_7d,all_time}` summary field from
whatever bootstrap/summary endpoint populates `r.value` (uncertain which endpoint — this
summary object is populated store-side, not traced further here) plus a new `UCard` block
copy-pasted from the Monte Carlo/Significance Test one. Adding this card is optional relative
to just adding the route + nav item.

## 3. Significance Test mode, end to end

**Pages** (all three are separate lazy chunks, matching Nuxt's `pages/significance-test/`):
- `index.vue` → `_nuxt/CZ3SG3_I2.js` (13.3 KB) — settings form + "Run" button. Locked behind a
  plan check: `X=l(()=>Y.plan===\`free\`||Y.plan===\`guest\`)` renders a
  "Rule Significance Testing is a Premium Feature" upsell card (`href:"https://jesse.trade/pricing"`)
  instead of the form when true. Submit handler validates client-side
  (`if(!E.value.routes||E.value.routes.length!==1){y(\`error\`,\`Rule Significance Test requires exactly one trading route.\`);return}`)
  then calls the store's `start()` and pushes to `/significance-test/${id}`.
- `[id].vue` → `_nuxt/O1vzaDvk2.js` (20.7 KB) — the running/results view (progress card,
  distribution chart image, exception panel, duration/routes summary, "New session" button).
- `history.vue` → `_nuxt/CZymKofZ2.js` (13.3 KB) — paginated history list + "Purge" (bulk
  delete-by-filter) modal + per-row delete confirm modal.

**Pinia store** `significanceTest`, `_nuxt/gG0NvZLm2.js` (full file, 5.6 KB, reproduced above
in §-quotes already covers most of it). Key shape:
```js
state: { form:{id,start_date,finish_date,n_simulations,random_seed,exchange,routes:[{symbol,timeframe,strategy}],data_routes:[]},
         results:{showResults,executing,observed_mean,annualized_return,p_value,n_simulations,n_observations,
                   progressbar:{current,total,estimated_remaining_seconds}, info:[], exception:{error,traceback}, alert:{message,type}},
         status:`` }
actions: init(), getRunningSession(), saveState(), start(), cancel(), terminate(), loadSession(id),
         hydrateSession(session), getSessionData(id), updateSessionNotes(id,title,description),
         getStrategyCode(id), clearCurrentSession(), prepareNewSession(),
         generalInfoEvent/progressbarEvent/resultsEvent/exceptionEvent/terminationEvent/alertEvent (ws handlers),
         _resetResults() (also builds the POST body for start())
```

**HTTP helper** `n(url, opts)` (per-file alias; canonical definition is `W` in
`_nuxt/B8_r5oP7.js`):
```js
function Sc(e){ // build fetch options
  let {authenticated:t=!1, proxyToJesseTrade:n=!1, headers:r, ...i}=e, a=new Headers(r);
  if(t){ let e=X(); a.set(`Authorization`, e.authToken);           // X() = "main" pinia store
         if(n && e.jesseTradeBearer) a.set(`X-Jesse-Trade-Token`, e.jesseTradeBearer); }
  return {...i, headers:Object.fromEntries(a.entries())};
}
function Cc(e){ return xc(a().public.apiBaseUrl, e); }              // joins with runtime config apiBaseUrl ("/")
async function W(e,t={}){                                          // the `n`/`W` helper itself
  let n=ie(null), r=ie(null);                                      // ie = a ref-like wrapper (shallowRef, uncertain)
  try{ n.value = await qe(Cc(e), Sc(t)); }catch(e){ r.value=e }     // qe = ofetch's $fetch (uncertain, not traced further)
  return {data:n, error:r};
}
```
So `n(\`/significance-test\`,{method:\`POST\`,body:...,authenticated:true})` is a thin
`useFetch`-shaped wrapper (returns `{data, error}` refs, mimicking Nuxt's `useFetch` without
SSR) around `$fetch`, prefixing the URL with `runtimeConfig.public.apiBaseUrl` (`"/"` in
production → no-op) and — when `authenticated:true` — setting a **raw** `Authorization` header
to `mainStore.authToken` (not `Bearer <token>`; matches `require_auth`'s expectation, not
independently re-verified here). Every call site in the significance-test store/pages goes
through this same helper — e.g. `await n(\`/significance-test/running-session\`,{authenticated:true})`,
`await n(\`/significance-test/update-state\`,{method:\`POST\`,body:{id,state:{form,results:{alert}}},authenticated:true})`,
`await n(\`/significance-test\`,{method:\`POST\`,body:this._resetResults(),authenticated:true})`.

**Auth token**: held in the `main` Pinia store (`_nuxt/B8_r5oP7.js`, `var X=Ct(\`main\`,{state:()=>({...authToken:\`\`,...})...})`),
persisted to `localStorage` (`persist:{storage:In.localStorage(),pick:[\`authToken\`,...]}`),
set via `setAuthToken(e){this.authToken=e}` (called from the login flow, not traced further)
and read by `isAuthenticated(){return this.authToken!==\`\`}`.

**WebSocket**: a single global socket (Pinia store `socket`, in `rHIqefrb.js`), connected as
`new WebSocket(\`${wsUrl}?token=${mainStore.authToken}\`)` (production: `wss://<host>/ws`).
`handleMessage` parses `{event, id, data, is_compressed}` (gzip via `pako`-style inflate when
compressed) and dispatches through a static event→handler map built once by `su()`:
```js
u(`significance-test.general_info`, sigTestStore, sigTestStore.generalInfoEvent),
u(`significance-test.progressbar`,  sigTestStore, sigTestStore.progressbarEvent),
u(`significance-test.results`,      sigTestStore, sigTestStore.resultsEvent),
u(`significance-test.exception`,    sigTestStore, sigTestStore.exceptionEvent),
u(`significance-test.termination`,  sigTestStore, sigTestStore.terminationEvent),
u(`significance-test.alert`,        sigTestStore, sigTestStore.alertEvent),
```
where `u(eventName, store, handler) = s(eventName, (id,payload) => { if(!id || id===store.form.id) handler(id,payload) })`
— i.e. **session-scoped filtering**: if the ws message carries an `id` that doesn't match the
currently-open session's `form.id`, it's dropped (so multiple tabs / other sessions' events
don't leak into the wrong view). `backtest.*`/`live.*`/`papertrade.*` events use a different
wrapper `l`/`c` (tab-scoped / livetrade+papertrade fan-out) — not relevant to significance-test
or (by extension) universe-scan. This whole dispatch table (`su()`) is also defined inside
`rHIqefrb.js`, so wiring up real-time events for a new mode means editing the entry chunk again,
not just adding a page.

**Backend mapping** (`jesse/controllers/significance_test_controller.py`, prefixes match 1:1
with the store's URLs): `POST /significance-test` (start), `POST /significance-test/cancel`,
`POST /significance-test/terminate`, `POST /significance-test/update-state` (persists
`{form, results.alert}` so a page reload/`hydrateSession` can restore in-flight UI state),
`POST /significance-test/sessions` (list), `POST /significance-test/sessions/{id}` (fetch one),
`GET /significance-test/sessions/{id}/chart` (uses `require_auth_any` — a looser auth dependency,
presumably to let an `<img src="...">` tag load without custom headers), `POST
/significance-test/sessions/{id}/remove`, `POST /significance-test/sessions/{id}/notes`, `POST
/significance-test/sessions/{id}/strategy-code`, `POST /significance-test/purge-sessions`, `GET
/significance-test/running-session` (single-flight guard: is one already running, so a
freshly-loaded dashboard can auto-resume watching it).

**Progress/alerts/exceptions in the UI** ([id].vue, `O1vzaDvk2.js`): a `UCard{title:"Progress"}`
shown while `executing && !exception.error`, containing plain text
`Running simulations... (current/total)` plus (if `estimated_remaining_seconds>0`) a formatted
remaining-time string, and a `UProgress` (`"model-value":progressbar.current, max:progressbar.total,
size:"lg", color:"primary"`). Exceptions render via a **shared, mode-parameterized** component:
`{modelValue, title:exception.error, content:exception.traceback, mode:\`significance-test\`}`
(component alias `l` in that file — likely a generic "show stack trace" modal/panel reused by
every mode, keyed by a `mode` string prop; a Universe Scan page could reuse it with
`mode:\`universe-scan\`` provided the component doesn't hard-code allowed mode values —
**uncertain, not independently confirmed** since the component's own source wasn't isolated).
Alerts use a dismissible banner bound to `alert.message`/`alert.type` via
`"onUpdate:open":e=>M.value.alert.message=\`\`` (closing it just clears the message).

## 4. Reusable components

Confirmed via `__name:\`...\`` string search across chunks (each is its own lazy chunk, so
importing one from a new page pulls in just that + its own deps, same as significance-test does):

| Component | Chunk | Props seen in use |
|---|---|---|
| `UButton` | `_nuxt/CJNUlr67.js` (shared Nuxt UI chunk, also exports `UAvatar`, `UChip`, `UIcon`, `ULink`, `ULinkBase`) | `color`, `variant`, `size`, `icon`, `label`, `trailing`, `block`, `to`, `onClick` |
| `UCard` | `_nuxt/D1yN6wZY2.js` | `title`, `flush` (no padding on body), `flat`, `class`; slots `header`/`default`/`footer` |
| `UProgress` | `_nuxt/EoqKQiEy2.js` | `model-value`, `max`, `size`, `color` |
| `USelect` | `_nuxt/pQUz-uq3.js` | (not captured beyond import; standard `modelValue`/`items` expected) |
| `USelectMenu` | `_nuxt/Cf85K_3V.js` | used for exchange picker in significance-test settings (`ccMIPn_w.js`'s `SessionExchangeSettings`) |
| `UInput` | `_nuxt/2k_QeT3T.js` (also exports `UTooltip`) | `modelValue`, `type:"number"`, `min`, `class`, `size`, `placeholder`, `maxlength`, `autofocus` |
| `UFormField` | `_nuxt/BG8CfSEZ2.js` | title/description row wrapper — seen as `{title:"Warmup Candles", description:"..."}` around a `UInput` |
| `UCheckbox` | `_nuxt/DQUlB_uC.js` | — |
| `UTable` | `_nuxt/BWDSh1SW.js` | used by significance-test history for the sessions list (columns not traced) |
| `UAlert` | `_nuxt/uf1cV9ZP.js` | `color`, `variant:"soft"`, `icon`, `title`, `description` (e.g. the "Session stopped" placeholder card) |
| `UModal` | `_nuxt/OaeI3Ulg.js` | used for the "Delete session" / "Purge sessions" confirm dialogs (`modelValue`, `title`, `description`, `type:"info"`, `content` slot) |
| `USlideover` | `_nuxt/OfUAv67B2.js` | — |
| `UBadge` | `_nuxt/B4Wc4BFL2.js` | plan badge in Nav (`bg-primary-100 text-primary-800 ...` classes computed from plan tier) |
| `UPopover` | `_nuxt/DNB37k3h2.js` | — |
| `UForm` | `_nuxt/TtSlr_h_2.js` | — |
| `RadioGroups`, `RouteTemplatePicker`, `Routes`, `SessionAdvancedSettings`, `SessionExchangeSettings` | `_nuxt/ccMIPn_w.js` (app-specific, shared across backtest/optimize/monte-carlo/significance-test settings forms) | e.g. `SessionExchangeSettings` used as `{modelValue, "exchange-name":form.exchange, flat:true}` |

`_nuxt/B8_r5oP7.js` (255 KB, the single largest chunk) has **no** `__name:` components — it's
pure Pinia stores + composables (main/candles/backtest/optimize/monte-carlo/tabs/etc + the `Sc`/`Cc`/`W`
fetch helpers), i.e. the app's shared business logic, not UI.

Given this, a new Universe Scan page could realistically compose:
`UCard` (form sections) + `UFormField`+`UInput`/`USelect`/`USelectMenu`/`UCheckbox` (form
fields) + `SessionExchangeSettings`/`RouteTemplatePicker`/`Routes` (from `ccMIPn_w.js`, if the
scan's route/strategy/exchange inputs map cleanly onto those shared widgets — **uncertain**,
`universe_scan_controller.py`'s options are richer: universes, symbols, per-phase toggles,
trial counts, which don't obviously fit the existing `Routes`/`RouteTemplatePicker` shape built
for single-route backtest/optimize/significance-test forms) + `UProgress`/`UAlert` (progress
and errors) + `UTable` (sessions history, mirroring `CZymKofZ2.js`).

## 5. Vue runtime alias map (`_nuxt/CoKk4mC0.js`)

`CoKk4mC0.js` (84.8 KB) is Vue 3's runtime + vue-router + pinia + pinia-plugin-persistedstate,
re-exported under two-letter/short names (`export{Ca as $,De as $n,...}`, ~140 exports). Every
other chunk imports a subset with **its own, per-chunk-minified local alias**
(`import{D as e,E as t,Ht as n,...}from"./CoKk4mC0.js"`), so the same runtime function has a
different one-letter name in nearly every file — only the export names on the right of `as` in
`CoKk4mC0.js`'s own `export{}` statement are stable across the whole bundle. Mapped below by
cross-referencing several chunks' compiled-template call shapes against their own import lines
(confidence noted; nothing here is from a source map — none exists):

| Vue API | `CoKk4mC0.js` export name | Evidence |
|---|---|---|
| `openBlock` | `mt` | `(d(),m(l,{key:0}))` v-if pattern in 3+ files, `d` always traces back to export `mt` |
| `createElementBlock` | `b` | `d(),s(\`div\`,M,[...])` — `s`→`b` in `CZ3SG3_I2.js`, `CZymKofZ2.js`, `KhqzbbC32.js` |
| `createBlock` | `v` | `(d(),m(l,{key:0}))` — `m`→`v` in `CZ3SG3_I2.js`; confirmed by the classic `(openBlock(), createBlock(Comp,{key}))` v-if-with-key shape |
| `createVNode` | `D` | component calls with `(type, props, null, patchFlag, dynamicProps)`, e.g. `e(i,{modelValue:...},null,8,[\`modelValue\`])` |
| `createElementVNode` | `_` | plain-tag calls `o(\`div\`,F,[...])` / `a(\`span\`,z,d(t),1)` (element, not component) |
| `createTextVNode` | `E` | `t(\` Manage Strategies \`,-1)` — hoisted static text pattern (`,-1` = hoisted flag) |
| `createCommentVNode` | `y` | `g(\`\`,!0)` — the standard `v-if=false` placeholder (`createCommentVNode("",true)`) |
| `toDisplayString` | `nr` | `a(\`span\`,z,d(t),1)` interpolation pattern, patch flag `1`=TEXT |
| `withCtx` | `qt` | `{default:p(()=>[...])}` slot-function wrapper, universal across every SFC chunk |
| `resolveComponent` | `St` | `ce=ee(\`router-link\`)` in `Nav`'s render — only used for the one *globally-registered*, not locally-imported, component |
| `ref` | `vn` | long chains of `let a=V(!1)`, `M=g([])`, `N=g(!1)` etc. — always a bare-value wrapper immediately used as `.value` |
| `computed` | `g` | `l=j(()=>t.hasLivePluginInstalled)`, `h=j(()=>{...return e})` — getter-only reactive wrapper |
| `onMounted` | `ct` | `O(()=>{document.documentElement.classList.add(...)})` at `app.vue`'s setup tail |
| `unref` | `On` | `i(N)` used to read a possibly-ref value inline, e.g. `title:m(i(ee).remainingTimeText(...))` |
| `isRef` | `un` | `m(N)?N.value=e:null` — the compiler's `isRef(x)?x.value=$event:null` v-model-on-ref-variable guard |
| `Fragment` | `o` | root-level `E(L,null,[...])` = `createElementBlock(Fragment,null,[...])` in `Nav`'s render |
| `defineComponent` | `k` | `P({__name:\`Nav\`,setup...})` / `u({__name:\`SignificanceTestSettings\`,props:...,setup...})` — the `{__name,...,setup}` object-wrapper pattern used by every compiled SFC |

Not confidently isolated in this pass (would need more triangulation than the effort here
justified): `h` (programmatic `createElement`) — compiled templates avoid it in favor of the
block helpers above, so it may simply not be imported by any of the chunks inspected;
`defineAsyncComponent`, `Teleport`, `Suspense` symbols — not searched for.

## 6. Risks of hand-patching a generated bundle

- **Upstream "Update frontend" regenerates `jesse/static` wholesale.** Every hash
  (`rHIqefrb.js`, `CoKk4mC0.js`, ..., all 506 files) changes, *and* every minified local alias
  inside every chunk is independently re-picked by esbuild/Rollup on each build — the mapping
  tables in §5 and the exact variable names in §1/§2's snippets (`_a`, `Y`, `h`, `g`, icon vars
  `Oo/nr/Qn/...`) are **not stable across rebuilds**, only the *shape* of the generated code is
  (same Vue/Nuxt compiler, same source `.vue` files upstream, so the same `{name:\`X\`,to:\`Y\`,icon:Z}`
  literal shape and the same `path:\`/optimization\`` string keys will reappear, just renamed
  around them). Any patch keyed on hashed filenames or on today's one-letter variable names
  will silently stop matching (or, worse, corrupt unrelated code if a name collides) the moment
  `jesse/static` is replaced.
- **Robust approach: an idempotent, content-anchored patch script**
  (`scripts/patch_dashboard.py`, run as part of the "Update frontend" step, not committed as a
  diff against `jesse/static`):
  1. Locate the entry chunk **by content**, not name: search all `_nuxt/*.js` files for a
     route array containing the literal substring `path:\`/significance-test\`` (or any other
     stable route path from the base app) — whichever file matches is "the" entry/router chunk
     for that build, whatever it's called this time.
  2. Within that file, anchor route-table insertion on the literal
     `{name:\`significance-test\`,path:\`/significance-test\`,` prefix (regex, not full-object
     match, since the trailing `component:()=>...` chunk name changes) and insert a new route
     object right after it, pointing at a **hand-written, permanently-named** chunk (e.g.
     `_nuxt/universe-scan.js` — never hashed, so the script never needs to guess a name for its
     own file).
  3. For the `Nav` array, anchor on the literal `{name:\`Rule Test\`,to:\`/significance-test\`,icon:`
     string, capture the icon variable name that follows with a regex group
     (`icon:([A-Za-z0-9_$]+)\}`), and splice in
     `{name:\`Universe Scan\`,to:\`/universe-scan\`,icon:<captured group>}` reusing that same
     icon variable (no new icon import needed — Vue happily renders one icon component in two
     unrelated vnodes).
  4. For `__vite__mapDeps`'s backing array (`m.f`), append the new chunk's path once (content
     match on the array's opening `m.f=[` inside the same file found in step 1) and reference
     that new index from the new route's `__vite__mapDeps([...])` call — or, simpler and safer,
     have the hand-written chunk **not** go through `__vite__mapDeps`/`Y` at all
     (`component:()=>import('./universe-scan.js')`, no preloading) since it doesn't need Vite's
     dependency-preload optimization to function correctly, only to load slightly faster.
  5. Make every insertion **idempotent**: before inserting, check whether the target string
     (e.g. `to:\`/universe-scan\`` or `path:\`/universe-scan\``) is already present in the file
     and skip if so, so re-running the script after a second "Update frontend" doesn't
     duplicate entries or fail because the previous run's names moved.
  6. Copy the hand-written page chunk(s) into `_nuxt/` verbatim (these are the only files this
     script *adds*; everything else is a byte-level text edit of files Nuxt just regenerated).
- **`router.addRoute()` via a runtime `<script type="module">` in `index.html`/`200.html`**:
  cleaner in the abstract (no text-patching of generated JS at all), but as shown in §1 there is
  no exported handle to the live `Router`/`App` instance from outside the entry chunk's own
  closures — Nuxt's plugin system (which *does* get such handles) only runs code that's part of
  the build's own plugin manifest, which we can't add to post-hoc. A workaround (mutate
  `window.__NUXT__`/monkey-patch `history.pushState` to fake client-only navigation, or reach
  into Vue devtools' global hook to grab the app instance) would be far more fragile than
  patching the route array, and wouldn't get you the sidebar entry at all (the `Nav` array is a
  local closure variable, not reachable via `addRoute`). **Recommendation: don't use
  `addRoute`; patch `_a` and the `Nav` array by content-anchor as above.**
- **No SRI/manifest to break**: as noted up top, there's nothing checking chunk hashes or a
  `builds/meta` manifest at runtime, so the *loading* mechanism itself imposes no additional
  risk beyond "did the text patch match" — failure mode is a broken/missing menu item or route,
  not a hard crash of the whole SPA (assuming the patch script bails out cleanly when its
  anchors don't match, e.g. asserting the count of replacements made).

## 7. Recommendation

**Route path**: use `/universe-scan/scan` (or similar, e.g. `/universe-scan/new`) for the SPA
form/results pages, **not bare `/universe-scan`** — that exact path is already a real FastAPI
`GET` route (`jesse/__init__.py:51-53`, registered before the `StaticFiles` mount) that returns
`jesse/universe_scan_page/index.html` directly, byte-for-byte, on every request (including a
client-side `history.pushState` navigation followed by a hard refresh, or any deep link/bookmark
to `/universe-scan`). If a new SPA route were also registered at exactly `/universe-scan`:
in-app `router-link` navigation would work fine (pure client-side, never hits the server), but
a hard refresh or deep link to `/universe-scan` would **silently serve the old standalone page**
instead of the SPA shell — worse than a 404, since it looks superficially like it "worked" but
shows stale UI with no dashboard nav/theme. This is a strict blocker to flag before
implementation; it doesn't affect the `/universe-scan/*` POST API endpoints themselves (method +
full-path matching means `POST /universe-scan/start` etc. are unaffected either way), only the
GET page path. Concretely: either (a) pick a different SPA path prefix as above and eventually
retire/redirect the standalone page, or (b) delete the standalone-page GET route and its
`universe_scan_page/index.html` once the SPA page ships, freeing up `/universe-scan` for the
SPA's index route (mirroring `/significance-test`'s own bare-path index route) — (b) is cleaner
long-term but is a user-facing/decision call, not something to do silently as part of a
"reverse engineering" pass.

**Files to add** (hand-written, permanently-named so `scripts/patch_dashboard.py` never has to
guess a hash): `jesse/static/_nuxt/universe-scan.js` (settings form + start, mirrors
`CZ3SG3_I2.js`), `jesse/static/_nuxt/universe-scan-id.js` (running/results view, mirrors
`O1vzaDvk2.js`), `jesse/static/_nuxt/universe-scan-history.js` (sessions list, mirrors
`CZymKofZ2.js`), and a small `jesse/static/_nuxt/universe-scan-store.js` Pinia store (mirrors
`gG0NvZLm2.js`) — all plain ESM importing the existing shared chunks by their *current* hashed
names at patch-apply time (the patch script should resolve those names dynamically by content-
search, same as for the entry chunk, rather than hardcoding today's hashes, since e.g.
`CoKk4mC0.js`/`B8_r5oP7.js`/`CJNUlr67.js` will also be renamed on the next "Update frontend").

**Files to patch** (by `scripts/patch_dashboard.py`, content-anchored per §6): the entry chunk
(found by `path:\`/significance-test\`` search) — insert one route object into `_a` for each of
the three new pages, and one nav item into the `Nav` component's array; optionally
`C96bnRGM.js`-equivalent (found by `navigationPath` search) to add a `universeScan` key to the
session-navigation store's `E`/`D` maps if "remember last session" parity is wanted.

**Backend**: the existing POST-only API (`options/start/sessions/session/cancel/delete`) can
stay as-is functionally — a new SPA page can call it through the same `n()`/`W()` fetch helper
pattern with `authenticated:true`, no backend changes required for a basic working page. To
match the *other* modes' UX more closely (live progress bar instead of polling, exception
modal, alert banner, "resume watching a running scan on page reload") would additionally need:
1. A `GET /universe-scan/running-session`-style endpoint (mirrors significance-test's) so a
   freshly loaded page can detect and re-attach to an in-flight scan instead of only showing it
   in the `/sessions` list.
2. WebSocket progress events broadcast under a new `universe-scan.*` namespace
   (`universe-scan.progressbar`, `.general_info`, `.exception`, `.termination`, `.alert`,
   and whatever result-summary event fits the scan's row-based output) from
   `jesse/modes/universe_scan_mode/`'s worker process, using whatever notify/publish mechanism
   `significance_test`'s mode module already uses (not traced in this pass — out of scope,
   this report only covers the dashboard bundle) — plus registering those event names in the
   entry chunk's `su()` dispatch table (§3), since that table is hardcoded per-mode and not
   data-driven.
3. An `update-state`-style endpoint if the new page wants reload-survives-mid-session UI state
   (form values, last alert) persisted server-side like significance-test does.
These are optional, additive changes; the scan's current file-based session model
(`storage.py`) doesn't need to change shape for any of the above — only the controller needs new
endpoints and the mode's worker needs to also publish websocket events on top of writing to the
session file it already writes to.

## 8. Implementation note (post-report addendum)

The design actually shipped (dev-pmallapp/jesse#90, `scripts/patch_dashboard.py` +
`jesse/dashboard_patches/`) resolved the ยง7 blocker with option (b): the standalone
`jesse/universe_scan_page/` was removed, `GET /universe-scan` now serves
`jesse/static/index.html` (the same SPA shell as `GET /`), and the SPA route added to
the entry chunk uses the bare `/universe-scan` path - matching how every other mode's
own index route works. See `docs/dashboard-bundle/PATCHING.md` for how to re-run the
patcher after a future "Update frontend" commit, and the template file's own docstring
for why its Vue-runtime dependency was narrowed to a single export
(`createElementVNode`) rather than the `defineComponent`/`ref`/`onMounted`/
`onBeforeUnmount` set originally sketched in ยง5 - this page has no reactive state at
all (everything is plain DOM, same as the standalone page it replaced), so a Vue
"function ref" alone (called with the element on mount, `null` on unmount) is enough
for its whole lifecycle.

**Uncertain / not verified in this pass** (flagged per instructions, would need either a live
running dashboard or a source map to confirm):
- Whether the shared exception component (`mode:\`significance-test\`` prop, §3) accepts
  arbitrary mode strings or hard-codes a known set — if the latter, it'd need its own chunk
  patched too, not just reused.
- Which endpoint populates `BLCaNkgi.js`'s home-page `{last_24h,last_7d,all_time}` summaries per
  mode (would need a Universe Scan equivalent for full parity, but is unnecessary for a
  minimum-viable integration).
- Exact behavior of Starlette's `StaticFiles` mount at `/` regarding SPA deep-link refreshes for
  *existing* modes (e.g. hard-refreshing `/optimization`) — no `html=True` fallback or custom
  404→200.html handler was found in `jesse/__init__.py`, so this may already 404 today for every
  mode's deep routes on hard refresh; if so it's a pre-existing, unrelated behavior and not
  something Universe Scan's addition would change (only the literal `/universe-scan` collision
  in §7's opening paragraph is new/specific to this feature).
