# dashboard/src — editable source for the compiled dashboard

`jesse/static/` ships a prebuilt Nuxt 3 single-page app (dashboard-v1's `npm run generate`
output): `index.html`/`200.html` plus ~500 minified Vite chunks under `_nuxt/`. This repo has
no dashboard-v1 checkout and no source maps, so that bundle is normally opaque. `dashboard/src/`
is a **readable, no-build mirror** of the chunks that actually contain Jesse's own dashboard
code (as opposed to Vue/Nuxt/Nuxt-UI/reka-ui/Monaco vendor code) — edit the file here, `deploy`
it, and it overwrites the matching minified file in `jesse/static/_nuxt/` verbatim. No bundler,
no npm install, no dashboard-v1 checkout required to make a change.

This works because of how Vite's dynamic-import loader in the entry chunk resolves chunks: no
subresource integrity, no manifest/hash check, plain `import("./<name>.js")` by filename. A
hand-edited file with the same name loads exactly like the original build output, as long as
it's valid ESM with the same import specifiers and the same exported names other chunks expect
from it (`extract`'s export-name diff exists specifically to catch a broken case of this - see
"Known issue" below).

## How chunks are classified (APP vs VENDOR)

`scripts/dashboard_src.py`'s `classify_chunks()` marks a `_nuxt/*.js` chunk **APP** if it
contains any of:
- a literal call to a real Jesse backend endpoint (`` `/backtest` ``, `` `/significance-test` ``, …),
- a Pinia `defineStore(id, {state: ...})` call for one of Jesse's own stores (`main`, `candles`,
  `backtest`, `significanceTest`, …),
- a compiled Vue SFC's `__name:` string that isn't part of the `@nuxt/ui` (`U*`) or reka-ui
  headless-primitive catalog shipped in this bundle.

Everything else is **VENDOR**: the Vue 3 + vue-router + pinia runtime chunk, `@nuxt/ui`
components, reka-ui primitives, the Monaco editor bundle + its web workers
(`_nuxt/nuxt-monaco-editor/`), charting libraries, and Vite/Nuxt runtime glue. CSS (`*.css`),
fonts (`*.ttf`) and images (`*.svg`/`*.png`) under `_nuxt/` are out of scope entirely (not JS,
not mirrored). This is a conservative heuristic (default to VENDOR unless there's a concrete
Jesse-specific signal) — see `dashboard/src/INDEX.md` for the full, generated classification and
`scripts/dashboard_src.py`'s module docstring/comments for the exact rules.

## Finding the code for a page

1. Open `dashboard/src/INDEX.md`. It's a generated table: chunk filename → component names
   (`__name`) → Pinia store id → route path(s) that load it → a one-line description.
2. Look up the route path shown when you navigate to the page in the dashboard (e.g.
   `/backtest/history`), or the mode name (Backtest/Optimization/Monte Carlo/Rule
   Significance Test/Live).
3. Shared chunks (Pinia stores, small reusable components like `NumberInput`/`ConfirmModal`)
   list every route that transitively imports them — there's no 1:1 file:page mapping for those.

## Editing compiled output

These files are **compiled Vue render functions**, not `.vue` SFCs — there's no template
syntax to edit, only the JS the Vue compiler would have produced from one. Common idioms
(the *local* alias for each Vue API varies per compiled chunk - see `dashboard/src/INDEX.md`'s
"Vue runtime alias map" section for the runtime chunk's own, stable export names - but the
call *shapes* below recur everywhere):

- `(openBlock(), createElementBlock("div", {...}, [...]))` — a `v-if` branch producing a plain
  element. The `key: 0`/`key: 1` etc. after the tag name is vue-router/Vue's block key for that
  `v-if`/`v-else` branch, not app data.
- `(openBlock(), createBlock(SomeComponent, {key: 0, ...props}))` — same shape but for a
  component (`v-if` with a dynamic component).
- `withCtx(() => [...])` wraps a slot's render function — e.g.
  `{default: withCtx(() => [...]), header: withCtx(() => [...])}` is how `<template #header>` /
  default slot content compiles.
- `createTextVNode("some text", -1)` is hoisted static text (the `-1` patch flag means "never
  re-render this node"). `toDisplayString(x)` is `{{ x }}` interpolation.
- `n[17]||=a("h3",{...},"some heading",-1)` is Vue's cached-static-vnode optimization: `n` is
  the render function's per-instance cache array, only computed once.
- Props/attrs objects are plain JS objects; `class`/`style` strings are just strings (Tailwind
  utility classes, unchanged from source).

To change copy, a class name, a threshold, or a conditional, edit the relevant string/literal in
place — same as editing any other JS. To change control flow (add a branch, a new prop), follow
the existing patterns above rather than introducing new ones; **don't rename any identifier by
hand** (the local variable names are wakaru's best-effort recovery, not meaningful source names —
renaming them by hand risks silently breaking an import elsewhere without the tooling to catch
it. See "Known issue" below for a case where wakaru itself got this wrong).

## Editing, deploying, checking

```bash
# see what you've changed since the last extraction, and whether jesse/static moved under you
python scripts/dashboard_src.py status

# after editing a file under dashboard/src/_nuxt/:
python scripts/dashboard_src.py deploy               # deploys all edited files
python scripts/dashboard_src.py deploy Bmbr8zF3.js    # or just the one(s) you touched

# undo a bad deploy (restores jesse/static/_nuxt/<file> to the committed HEAD version)
python scripts/dashboard_src.py revert Bmbr8zF3.js
```

`deploy` refuses to copy a file over its shipped chunk unless all of the following hold:
1. `node --check` passes on the readable file (catches invalid JS).
2. Its export-name set (`export{a as B,...}`, `export default`, `export const/function/class`)
   equals that of the *original* shipped chunk — the exact bytes `extract` last ran wakaru/prettier
   on (read from `jesse/static/_nuxt/` if unchanged since, otherwise from the git HEAD blob),
   not whatever's currently on disk. This has **no `--force` override**: a mismatch means some
   other chunk's `import{X}from"./this.js"` would silently break, which is exactly the wakaru bug
   described in "Known issue" below — the fix is to re-run `extract` (see next section), not to
   force past this check.
3. The shipped chunk itself hasn't changed since the last `extract` (upstream "Update frontend"
   landed after you started editing) — pass `--force` to override *this* one specifically, once
   you've reconciled your edit against the new upstream file.

Then reload the dashboard in the browser (hard refresh to bypass any cached module) and check
the page. There's no build step, no dev server restart, and no `jesse run` restart needed —
`jesse/static/` is served as static files.

## Handling an upstream "Update frontend"

Whenever `jesse/static/_nuxt/*` is regenerated wholesale (every filename hash *and* every
per-chunk minified variable name changes independently on each dashboard-v1 build):

1. `python scripts/dashboard_src.py status` — see which of your `dashboard/src/` edits are now
   orphaned (the shipped file moved out from under them).
2. `python scripts/dashboard_src.py extract` — reclassifies every chunk from scratch and
   regenerates `dashboard/src/_nuxt/*`, `dashboard/src/INDEX.md`, and
   `dashboard/src/manifest.json`. Refuses to overwrite any readable file you've locally edited
   (compares its sha256 against `manifest.json`); pass `--force` to overwrite anyway once you've
   saved your diffs elsewhere.
3. Re-apply your edits by hand against the freshly extracted files (there's no reliable
   automated 3-way merge across a full identifier-renaming rebuild), then `deploy` again.

## Known issue: wakaru can silently drop an export (`B8_r5oP7.js`)

`extract` runs a per-chunk export-name check (compares `export{...}`/`export default`/`export
const|function|class` between the original chunk and the wakaru+prettier output) after every
unminify, because wakaru's variable-renaming pass isn't guaranteed to preserve the chunk's public
API. It caught exactly this on `B8_r5oP7.js` (main/backtest/candles/... Pinia stores): wakaru's
rename collided two distinct locals onto the same alias `W` and, in doing so, dropped this
chunk's public export `S` (a local literally named `W` in the source, distinct from the other
local also renamed to `W`) — deploying that output as-is would have silently removed whatever
store/composable other chunks import as `S` from this file.

Whenever this check fails on a chunk, `extract` automatically **falls back to a prettier-only
regeneration** for that one chunk instead of failing the whole run: it re-formats the original
minified source directly (no wakaru unminify pass, so no renaming, so no risk of an export
collision) and re-verifies the export-name match, which is guaranteed to hold since formatting is
semantics-preserving. The chunk stays fully deployable, just less readable (original one-letter
locals, not wakaru's best-effort recovered structure) until wakaru itself fixes the collision (or
it's reproduced and patched here). Each chunk's `dashboard/src/manifest.json` entry records which
mode produced it (`"mode": "wakaru"` or `"mode": "prettier-only"`, with a `"reason"` for the
latter), and `dashboard/src/INDEX.md`'s APP chunks table has a `Mode` column for the same. As of
this writing, `B8_r5oP7.js` is the only chunk that needed the fallback; every other APP chunk's
readable output was verified to export exactly the same names as the original, under wakaru
1.12.0. `deploy`'s export-name gate (see above) is the second, independent safety net in case a
future wakaru upgrade introduces a *different* collision that this extraction-time check happened
to miss (e.g. because it only compares against the chunk shipped at extraction time).

## Tools used (dev-only, not repo dependencies)

- `npx @wakaru/cli@latest` (tested against wakaru 1.12.0) — reconstructs idiomatic control flow
  from Rollup/esbuild-minified output (un-inlines the block-helper call patterns above) without
  a source map. It does not recover meaningful identifier names (no source map exists to recover
  them from), only structure.
- `npx prettier@latest` (tested against prettier 3.9.9) — final formatting pass.
- `node --check` — the only "does this still parse as valid ESM" gate `deploy`/`extract` run;
  it does not execute the module, so it can't catch runtime issues like the export-drop above.

Both are fetched on demand via `npx` when you run `extract`; they are intentionally not added to
`requirements.txt`/`package.json` — this whole workflow is a dev-time convenience layered on top
of a prebuilt bundle, not a build dependency of Jesse itself.
