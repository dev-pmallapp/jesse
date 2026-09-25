# Re-running the Universe Scan dashboard patch after an "Update frontend" commit

Background: `docs/dashboard-bundle/REVERSE_ENGINEERING.md` (the investigation that led
to this design) and `scripts/patch_dashboard.py` (the patcher itself, see its module
docstring for the anchor list and why each one is expected to survive a rebuild).

`jesse/static/` is a prebuilt, minified Nuxt/Vite bundle with no source in this repo.
Upstream "Update frontend" commits replace the **entire** directory: every chunk gets a
new content-hashed filename, and every local variable/export name inside every chunk is
independently re-picked by the minifier. Universe Scan's dashboard integration - the
route + sidebar entry inside the entry chunk, and the hand-written page chunk that
route points at - has to be re-applied after every such commit.

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
is available, a manual syntax smoke check:

```bash
pytest tests/test_patch_dashboard.py tests/test_universe_scan*.py
node --check jesse/static/_nuxt/universe-scan-page.js
```

Commit the resulting diff (the modified entry chunk + the new/regenerated
`universe-scan-page.js`) together with the "Update frontend" commit's own changes.

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
   `SIGNIFICANCE_TEST_ROUTE_ANCHOR`, `RULE_TEST_NAV_RE`, `CREATE_ELEMENT_VNODE_RE`) to
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
python scripts/patch_dashboard.py --revert   # strips the insertions, deletes the generated chunk
```

Then merge, and re-run the "How to re-run" steps above once the merge lands.

If the Vue-runtime chunk's `createElementVNode` shape itself changes in a way
`CREATE_ELEMENT_VNODE_RE` can no longer match (e.g. a Vue major-version upgrade changes
the vnode marker properties), re-derive the new anchor the same way this design did
originally: grep the chunk for Vue's other, similarly-stable internal marker strings
(`__v_isRef`, `__v_isReactive`, `"m"`/`"bum"` lifecycle-hook literals, ...) - see
`REVERSE_ENGINEERING.md`ยง5 for the methodology - rather than falling back to a
mangled local/export letter, which won't survive the *next* rebuild either.

## Widening the patch later

`jesse/dashboard_patches/universe_scan_page.template.js`'s only per-build dependency is
a single Vue export (`createElementVNode`, imported as `h`) - it intentionally avoids
Vue's reactivity system entirely (see that file's docstring for why a plain DOM-mounted
child, using a Vue "function ref" for its mount/unmount lifecycle, needed nothing else).
If a future change to this page needs actual Vue reactivity (`ref`/`computed`/...),
resolve its export alias the same way `resolve_create_element_vnode_alias()` does for
`createElementVNode`: find a content-stable shape in the Vue-runtime chunk's *source*
(not a call-site pattern in some other consumer chunk, which is far more fragile to
regex against) - e.g. `ref`'s implementation is `function ref(r){return isRef(r)?r:new
RefImpl(r)}` almost verbatim even after minification (only the identifiers are
renamed), and `onMounted`/`onBeforeUnmount` are `createHook(\`m\`)` /
`createHook(\`bum\`)` - the lifecycle-stage string literals themselves are stable
Vue-internal constants that the minifier has no reason to touch.
