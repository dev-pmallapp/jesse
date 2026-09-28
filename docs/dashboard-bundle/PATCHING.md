# Re-running the dashboard patch after an "Update frontend" commit

Background: `docs/dashboard-bundle/REVERSE_ENGINEERING.md` (the investigation that led
to this design) and `scripts/patch_dashboard.py` (the patcher itself, see its module
docstring for the anchor list and why each one is expected to survive a rebuild).

`jesse/static/` is a prebuilt, minified Nuxt/Vite bundle with no source in this repo.
Upstream "Update frontend" commits replace the **entire** directory: every chunk gets a
new content-hashed filename, and every local variable/export name inside every chunk is
independently re-picked by the minifier. What this script injects - the India app's
single SPA route (`patch_dashboard.ROUTES`) + its four sidebar nav items
(`patch_dashboard.NAV_ITEMS`) inside the entry chunk, and the hand-written host chunk
(`india-page.js`) that route points at - has to be re-applied after every such commit.

## Which tool owns what: this patcher vs. `dashboard/src/`

`dashboard/src/` (see `dashboard/README.md`) is a separate tool that keeps a readable
mirror of the Jesse-owned chunks of the compiled bundle, and it always mirrors the
entry chunk's **UNPATCHED** content - not whatever this script currently has inserted
into it. Its `scripts/dashboard_src.py status`/`deploy`/`extract` strip this script's
patch back out of the shipped entry chunk in memory (via `patch_dashboard.strip_patch`)
before ever hashing/comparing/reading it, so the patch never shows up there as a
spurious "shipped file changed". `deploy`/`revert` of the entry chunk through that
script both leave this patch re-applied afterward (calling `patch()` again), so `python
scripts/patch_dashboard.py --check` keeps passing no matter which tool last touched the
entry chunk. Generated `*-page.js` chunks are this script's alone - `dashboard/src/`
excludes them from its mirror/classification entirely.

## When to re-run

Any time `jesse/static/` changes as part of an "Update frontend" commit (check
`git log -- jesse/static` if unsure whether a given commit touched it).

## How to re-run

```bash
python scripts/patch_dashboard.py --check   # confirms the patch is missing/stale
python scripts/patch_dashboard.py           # applies it (idempotent - safe to re-run)
python scripts/patch_dashboard.py --check   # confirms it's now present
```

Then re-run the patch-specific tests (`tests/test_patch_dashboard.py`) and, if `node`
is available, a manual syntax smoke check on the generated host chunk:

```bash
pytest tests/test_patch_dashboard.py tests/test_universe_scan*.py
node --check jesse/static/_nuxt/india-page.js
```

Commit the resulting diff (the modified entry chunk + the regenerated `india-page.js`)
together with the "Update frontend" commit's own changes.

## If it fails

`patch_dashboard.py` is deliberately **content-anchored, not filename/position
-anchored** (see its module docstring) - it looks up its insertion points and its
mangled Vue export name by searching for stable literal substrings (a route's `path:`
string, a nav item's label, Vue's `__v_isVNode`/`__v_skip` marker properties, ...), so
it keeps working across a rebuild as long as the *shape* of the generated code doesn't
change, even though every filename and every one-letter variable name does.

If it raises `PatchError` (or `--check` fails after a run that should have succeeded),
one of those anchors no longer matches - which most likely means Nuxt/Vite/Vue's
compiler output shape changed (a toolchain upgrade), not just the usual hash/variable
reshuffle. To fix it:

1. Read the `PatchError` message - it names exactly which anchor failed and how many
   matches it found (0 = anchor text no longer appears at all; 2+ = anchor is no longer
   unique, e.g. a second route/nav item now coincidentally matches).
2. Grep the new `jesse/static/_nuxt/*.js` for the *semantic* thing the anchor was
   trying to find (e.g. `path:\`/significance-test\`` for the route anchor, `to:\`/significance-test\`` for the
   nav anchor, or the `__v_isVNode:!0,__v_skip:!0` object-literal shape for the Vue
   runtime chunk) and see what changed around it.
3. Update the corresponding constant/regex in `scripts/patch_dashboard.py` (e.g.
   `SIGNIFICANCE_TEST_ROUTE_RE`, `RULE_TEST_NAV_RE`, `CREATE_ELEMENT_VNODE_RE`) to
   match the new shape, keeping the same "search by stable content, not by name"
   principle.
4. Re-run `tests/test_patch_dashboard.py` - its `unpatched_static_dir` fixture derives
   a real, known-unpatched bundle by copying the *committed* (already-patched) bundle
   and then running `patch_dashboard.unpatch()` on the copy (the exact inverse of
   `patch()` - it strips the two marker-prefixed insertions back out and deletes the
   generated chunk), so it exercises the exact "patch a freshly rebuilt bundle"
   scenario without depending on git history (a shallow CI checkout has none) or on
   keeping a second, duplicate copy of the real entry chunk in the repo just to serve
   as a fixture.

## Before merging an "Update frontend" commit

If you want to hand upstream's rebuild a clean, unpatched `jesse/static/` to merge
against (rather than merging on top of our insertions and re-running the patcher
after), revert this branch's patch first:

```bash
python scripts/patch_dashboard.py --revert   # strips every route/nav insertion, deletes every generated chunk
```

`--revert` also strips insertions left by two earlier designs: the pre-India per-page
patcher (dev-pmallapp/jesse#90..#104, one `Page` per route+nav pair, recognized by
`OLD_PAGE_MARKERS` in `patch_dashboard.py`) and, before that, the single-page script
that predates dev-pmallapp/jesse#92 (recognized by its own, page-name-less marker,
`LEGACY_MARKER`) - so a bundle patched by either older design is still safely
revertible/upgradable by today's script.

Then merge, and re-run the "How to re-run" steps above once the merge lands.

If the Vue-runtime chunk's `createElementVNode` shape itself changes in a way
`CREATE_ELEMENT_VNODE_RE` can no longer match (e.g. a Vue major-version upgrade changes
the vnode marker properties), re-derive the new anchor the same way this design did
originally: grep the chunk for Vue's other, similarly-stable internal marker strings
(`__v_isRef`, `__v_isReactive`, `"m"`/`"bum"` lifecycle-hook literals, ...) - see
`REVERSE_ENGINEERING.md`ยง5 for the methodology - rather than falling back to a
mangled local/export letter, which won't survive the *next* rebuild either.

## Adding an India sub-page vs. adding a patcher route/nav item

As of dev-pmallapp/jesse#105, the India app (Stocks/Baskets/Scan/Portfolio and their own
sub-pages) is ONE SPA route (`patch_dashboard.ROUTES`, currently just `india`, matching
every `/india/*` URL) plus FOUR sidebar nav items (`patch_dashboard.NAV_ITEMS`) that all
point into that one route - dashboard/ng owns its own internal routing beneath it (see
`dashboard/ng/src/router.ts`). This means:

- **Adding a new India sub-page (e.g. a new stock report view) is a `dashboard/ng`-only
  change** - add the `.vue` file, register it in `router.ts`, and (if it needs its own
  top-level tab rather than living under an existing one) add it to `AppShell.vue` -
  see `dashboard/ng/README.md`'s own "Adding a new sub-page". This script doesn't need
  to change at all for that.
- **Adding a new top-level nav tab** (a fifth item next to Stocks/Baskets/Scan/
  Portfolio) touches this script: append a `NavEntry(name, label, to)` to `NAV_ITEMS` in
  `scripts/patch_dashboard.py`, add the matching tab to dashboard/ng's `AppShell.vue`
  and route to its `router.ts`, then run `python scripts/patch_dashboard.py`. Each
  `NavEntry` gets its own marker (`/*jesse-dashboard-patch:<name>*/`) so `--check`/
  `--revert` can report on and undo nav items independently; items are inserted, in
  `NAV_ITEMS`' order, right after the *last already-present* item (falling back to the
  Rule Test nav item anchor only when none are present yet) - so appending a new
  `NavEntry` and re-running the patcher on an already-patched bundle adds it after the
  existing ones, not before.
- **Adding a second host route** (a second SPA route outside `/india/*` entirely) means
  appending a `RouteEntry(...)` to `ROUTES` and writing its own wrapper template under
  `jesse/dashboard_patches/` the same way `india_page.template.js` does (see that file's
  own docstring) - a scenario this script's `ROUTES` registry supports but doesn't
  currently use (today it holds exactly one entry).

## Widening the India host component's own patch later

`jesse/dashboard_patches/india_page.template.js`'s only per-build dependency is a single
Vue export (`createElementVNode`, imported as `h`) - it intentionally avoids Vue's
reactivity system entirely (see that file's docstring for why a plain function-ref
mount/unmount handoff into dashboard/ng's own, separately-bundled Vue app needed nothing
else). If a future change to this host component needs actual Vue reactivity
(`ref`/`computed`/...) from the *upstream* bundle's Vue runtime (as opposed to
dashboard/ng's own bundled Vue, which already has full reactivity), resolve its export
alias the same way `resolve_create_element_vnode_alias()` does for `createElementVNode`:
find a content-stable shape in the Vue-runtime chunk's *source* (not a call-site pattern
in some other consumer chunk, which is far more fragile to regex against) - e.g. `ref`'s
implementation is `function ref(r){return isRef(r)?r:new RefImpl(r)}` almost verbatim
even after minification (only the identifiers are renamed), and `onMounted`/
`onBeforeUnmount` are `createHook(\`m\`)` / `createHook(\`bum\`)` - the lifecycle-stage
string literals themselves are stable Vue-internal constants that the minifier has no
reason to touch.
