#!/usr/bin/env python3
"""Patches the prebuilt Nuxt dashboard bundle (`jesse/static/`) to add the India (NSE/
BSE) app to the dashboard's own router/sidebar, instead of shipping it as a separate
standalone HTML page (see `jesse/dashboard_patches/india_page.template.js`'s docstring,
`dashboard/ng/README.md` and `docs/dashboard-bundle/REVERSE_ENGINEERING.md` for the full
background).

Why a patch script and not a plain diff against `jesse/static`: that directory is a
prebuilt, minified Vite/Nuxt bundle with no source in this repo. Upstream "Update
frontend" commits regenerate it *wholesale* - every chunk filename is a fresh content
hash, and every local variable/export name inside every chunk is independently
re-picked by the minifier on each build. A patch keyed on today's hashed filenames or
today's one-letter variable names would silently stop matching (or, worse, corrupt
unrelated code on a name collision) the moment `jesse/static` is next replaced.

So every edit this script makes is **content-anchored**: it locates its insertion
points and its mangled-name lookups by searching for literal, semantically-load-bearing
substrings that the same Vue/Nuxt/Vite toolchain will keep re-emitting build after
build (a route's `path:` string, a nav item's label, Vue's internal `__v_isVNode`
marker property, ...) - never by hard-coding a filename or a single-letter identifier.
If a future bundle no longer contains one of those anchors, this script raises loudly
(`PatchError`) instead of silently no-oping or guessing - see docs/dashboard-bundle/
PATCHING.md for the re-run procedure after an "Update frontend" commit.

Shape (dev-pmallapp/jesse#105): unlike the earlier per-page design (one `Page` = one
route + one nav item + one generated chunk, for each of Universe Scan/Portfolio), the
whole India app is now ONE SPA route (`ROUTES`, a single catch-all `/india/:rest(.*)*`
that dashboard/ng's own internal router - see dashboard/ng/src/router.ts - resolves
client-side) plus FOUR sidebar nav items (`NAV_ITEMS`: Stocks/Baskets/Scan/Portfolio,
all pointing into that one route). `ROUTES`/`NAV_ITEMS` stay small registries (not
single constants) so a second host route or a fifth nav item could be added later the
same way; but adding a *page* almost always means adding it inside dashboard/ng instead
(see that project's own README "Adding a new sub-page") - this script's own registries
rarely change. To add a new top-level nav tab (not just a sub-page under an existing
one): append a `NavEntry` here, add the matching tab to dashboard/ng's
`src/layouts/AppShell.vue` and a route to `src/router.ts`, then re-run this script.

Usage:
    python scripts/patch_dashboard.py [--static-dir jesse/static] [--check | --revert]

`--check` verifies the route + every nav item is present and up to date without writing
anything; it exits non-zero if anything is missing, stale, or an anchor can't be
resolved, printing what failed. Re-running without `--check` is idempotent (a no-op,
byte-identical result, if the bundle is already patched for the current template +
resolved aliases).

`--revert` undoes the patch in place (strips every marker-prefixed insertion - including
ones left by the pre-India per-page patcher and the even older pre-dev-pmallapp/
jesse#92 single-page script - from the entry chunk, and deletes every generated page
chunk, current and obsolete) - handy right before merging an upstream "Update frontend"
commit, so that rebuild lands on a clean, unpatched bundle instead of merging on top of
our insertions.
"""
import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_STATIC_DIR = REPO_ROOT / 'jesse' / 'static'
TEMPLATES_DIR = REPO_ROOT / 'jesse' / 'dashboard_patches'


@dataclass(frozen=True)
class RouteEntry:
    """One vue-router route record this script injects into the entry chunk's route
    table. Today there is exactly one (`india`, matching every `/india/*` URL) - the
    dashboard/ng app owns its own sub-routing beneath it (see dashboard/ng/src/
    router.ts), so this script never needs a route per India sub-page. `name` doubles
    as the vue-router route name and the key used to derive this route's own marker
    (see `marker_for` below) - keep it kebab-case and unique across `ROUTES`.
    `chunk_name` is never hashed (unlike every Vite-generated chunk): this script's own
    output for this route always lands at this exact, permanent filename.
    """
    name: str
    path: str
    chunk_name: str
    template: str          # source template under jesse/dashboard_patches/
    ng_entry: str           # dashboard/ng build output this chunk import()s, e.g. '/ng/india.js'
    component_name: str      # generated chunk's own Vue component `name:` (devtools label)


@dataclass(frozen=True)
class NavEntry:
    """One sidebar nav item this script injects into the Nav component's item array.
    Unlike `RouteEntry` there's no generated chunk here - every nav item just links into
    the single `india` route above, which vue-router's own `:rest(.*)*` catch-all then
    matches regardless of which India sub-path it points at. `name` is this nav item's
    own marker key (kebab-case, unique across `NAV_ITEMS`) - distinct from `label`
    (the sidebar's visible text) since the label alone isn't a safe marker key (not
    guaranteed unique/identifier-safe).
    """
    name: str
    label: str
    to: str


# The one route dashboard/ng's whole India app resolves through - see the module
# docstring's "Shape" section for why this is a registry of one rather than a bare
# constant.
ROUTES: tuple[RouteEntry, ...] = (
    RouteEntry(
        name='india',
        path='/india/:rest(.*)*',
        chunk_name='india-page.js',
        template='india_page.template.js',
        ng_entry='/ng/india.js',
        component_name='IndiaPage',
    ),
)

# Registered in the order they should appear in the sidebar - `patch_nav` below always
# inserts any still-missing items right after the last already-present item (in this
# order), so that order is preserved whether the bundle is patched from scratch or
# incrementally.
NAV_ITEMS: tuple[NavEntry, ...] = (
    NavEntry('india-nav-stocks', 'Stocks', '/india/stocks'),
    NavEntry('india-nav-baskets', 'Baskets', '/india/baskets'),
    NavEntry('india-nav-scan', 'Scan', '/india/scan'),
    NavEntry('india-nav-portfolio', 'Portfolio', '/india/portfolio'),
)

# Every RouteEntry/NavEntry this script knows how to insert/strip, for callers (like
# `strip_patch`'s default) that don't care about the route/nav distinction.
ALL_ITEMS: tuple = ROUTES + NAV_ITEMS

# Every insertion this script makes into the entry chunk for a given route/nav item is
# prefixed with that item's own marker, both so a second run can tell "already patched"
# from "not yet patched" without re-deriving today's variable names, and so a human
# diffing the (huge, minified) entry chunk can `grep` straight to what a specific item
# added.
def marker_for(item) -> str:
    return f'/*jesse-dashboard-patch:{item.name}*/'


def _anchor_value(item) -> str:
    """The literal string `item`'s own bundle object carries under its `path:`/`to:`
    field - `RouteEntry.path` for a route record, `NavEntry.to` for a nav item. Both
    dataclasses keep the field name that matches their own role in the bundle rather
    than a shared generic name, so this is the one place that needs to know which."""
    return item.path if isinstance(item, RouteEntry) else item.to


# The marker used before dev-pmallapp/jesse#92 introduced multiple pages (a single,
# page-name-less marker shared by Universe Scan's route *and* nav insertions). A bundle
# patched by that older script must still be revertible/upgradable by this one, so
# `strip_patch`/`unpatch` always also look for this - see PATCHING.md.
LEGACY_MARKER = '/*jesse-universe-scan-patch*/'

# Markers left by the pre-India per-page patcher (dev-pmallapp/jesse#90..#104: one
# `Page` per route+nav pair, named `universe-scan`/`portfolio`, each generating its own
# `*-page.js` chunk). Superseded by the single `india` RouteEntry + four NAV_ITEMS
# above, but `strip_patch`/`unpatch` must still recognize and remove these so a bundle
# patched by that script upgrades cleanly to this one - see PATCHING.md.
OLD_PAGE_MARKERS = (
    '/*jesse-dashboard-patch:universe-scan*/',
    '/*jesse-dashboard-patch:portfolio*/',
)
# The generated chunks that per-page patcher owned outright - obsolete now that
# dashboard/ng owns all India UI behind the single `india-page.js` chunk. `patch()`
# deletes these on every non-check run (not just `--revert`), so applying today's patch
# to a bundle still carrying the old scheme's output cleans it up automatically.
OBSOLETE_CHUNK_NAMES = ('universe-scan-page.js', 'portfolio-page.js')

# Any `__SOME_PLACEHOLDER__`-shaped token a template still contains after every known
# substitution has run - see `render_generated_chunk` below. Broader than checking for
# just `__VUE_*__` so a future new placeholder that a substitution call was forgotten
# for still fails loudly instead of shipping a literal `__NG_ENTRY__` into the bundle.
PLACEHOLDER_RE = re.compile(r'__[A-Z][A-Z0-9_]*__')

# Anchor for the route table: this is the stable `name`/`path` key pair of the
# `significance-test` route record in vue-router's route array (`_a` today, but that
# array's own variable name is not something we rely on - we splice in right after
# this record wherever it happens to live). See REVERSE_ENGINEERING.md ยง1.
#
# `\s*` around every delimiter (not a literal string) so this matches both the shipped
# minified shape (`{name:\`significance-test\`,path:...`, no whitespace at all) and the
# prettier-formatted shape `dashboard/src/`'s readable entry-chunk mirror ships as
# (`{ name: \`significance-test\`, path: ..., ` with a space after every `:`/`,` and
# possibly a newline before the record's own `{`) - `scripts/dashboard_src.py deploy`
# can copy that readable file verbatim over this exact file (see dashboard/README.md),
# so this anchor must survive both.
SIGNIFICANCE_TEST_ROUTE_RE = re.compile(
    r'\{\s*name:\s*`significance-test`,\s*path:\s*`/significance-test`,\s*'
)

# Anchor for the sidebar `Nav` component's item array: the "Rule Test" row is a plain,
# un-nested object literal, so a single regex capturing its icon-component variable
# name is enough (no brace-balancing needed, unlike the route record above, whose
# `component:()=>...` value contains nested `(){}[]`). Whitespace-tolerant for the same
# reason as the route anchor above. See REVERSE_ENGINEERING.md ยง2.
RULE_TEST_NAV_RE = re.compile(
    r'\{\s*name:\s*`Rule Test`,\s*to:\s*`/significance-test`,\s*icon:\s*([A-Za-z0-9_$]+),?\s*\}'
)

# Content-anchor for Vue's `createElementVNode` (= `createBaseVNode` called on the
# "is element" fast path) inside the (per-build-renamed) Vue-runtime chunk. Vue's own
# source sets `__v_isVNode`/`__v_skip` as literal marker properties on every vnode
# object for cross-module identity checks (e.g. by Vue devtools) - these exact string
# property names cannot be minifier-mangled without breaking that contract, which
# makes them a far more durable anchor across rebuilds than any local variable name.
CREATE_ELEMENT_VNODE_RE = re.compile(
    r'function ([A-Za-z_$][\w$]*)\(e,t=null,n=null,r=0,i=null,a=e===([A-Za-z_$][\w$]*)\?0:1,o=!1,s=!1\)\{'
    r'let c=\{__v_isVNode:!0,__v_skip:!0'
)


class PatchError(RuntimeError):
    """Raised when a content anchor this script relies on isn't found exactly once -
    signals that `jesse/static` was rebuilt in a way this script no longer understands,
    rather than silently mis-patching or skipping the edit."""


def _read(path: Path) -> str:
    return path.read_text(encoding='utf-8')


def find_entry_chunk(static_dir: Path) -> Path:
    """The entry chunk is whatever `index.html`'s importmap points `#entry` at - never
    hard-coded, since that hash changes on every rebuild (see REVERSE_ENGINEERING.md
    ยง"Build facts")."""
    index_html = _read(static_dir / 'index.html')
    matches = re.findall(r'"#entry":"(/_nuxt/[^"]+)"', index_html)
    if len(matches) != 1:
        raise PatchError(
            f"expected exactly one '#entry' importmap entry in {static_dir / 'index.html'}, "
            f"found {len(matches)}"
        )
    return static_dir / matches[0].lstrip('/')


def find_balanced_object_end(text: str, start: int) -> int:
    """`start` is the index of a JS object literal's opening `{`; returns the index
    just past its matching closing `}`, correctly skipping over nested `{}`/`[]`/`()`
    and over any of those characters that appear inside a quoted string or template
    literal (the minifier emits both `` `...` `` and, occasionally, quoted strings).

    Note: regex literals (`/like this/`) aren't tracked as a delimiter here, so a
    stray `{`/`}` inside one would throw off the depth count - acceptable because every
    object this is called on (a route record, and the marker-inserted objects
    `strip_patch` re-scans) never contains one; an unbalanced scan raises `PatchError`
    below instead of returning a wrong-but-plausible offset."""
    depth = 0
    i = start
    n = len(text)
    string_delim = None
    while i < n:
        c = text[i]
        if string_delim:
            if c == '\\':
                i += 2
                continue
            if c == string_delim:
                string_delim = None
            i += 1
            continue
        if c in '`\'"':
            string_delim = c
            i += 1
            continue
        if c in '{[(':
            depth += 1
        elif c in '}])':
            depth -= 1
            if depth == 0 and c == '}':
                return i + 1
        i += 1
    raise PatchError('unbalanced braces while scanning a JS object literal - bundle format may have changed')


def _find_already_present_object_end(entry_text: str, item, key: str) -> int | None:
    """Locates the end of `item`'s already-inserted route (`key='path'`) or nav
    (`key='to'`) object literal, under `item`'s own marker, so a later batch of missing
    items can be spliced in right after it - preserving registry order on an
    incremental/partial re-patch instead of always anchoring on the (earlier,
    significance-test/Rule Test) framework anchor. A marker could in principle appear
    more than once, so every occurrence is checked for the specific `key:` being looked
    up, not just the first. Returns None if `item` isn't present under its marker at
    all."""
    marker = marker_for(item)
    value = _anchor_value(item)
    search_from = 0
    while True:
        marker_at = entry_text.find(marker, search_from)
        if marker_at == -1:
            return None
        obj_start = marker_at + len(marker)
        search_from = obj_start
        if obj_start < len(entry_text) and entry_text[obj_start] == '{':
            obj_end = find_balanced_object_end(entry_text, obj_start)
            if f'{key}:`{value}`' in entry_text[obj_start:obj_end]:
                return obj_end


def _insertion_point(
    entry_text: str, items: tuple, missing_items: list, key: str, fallback_anchor_start: int,
) -> int:
    """Where to splice a batch of `missing_items`' route/nav objects so the result
    stays in `items` order: right after the already-inserted object of the last item
    (in `items` order) that isn't in `missing_items`, or - if no item in `items` is
    present yet - right after the framework anchor object starting at
    `fallback_anchor_start` (the significance-test route / Rule Test nav item)."""
    for item in reversed(items):
        if item in missing_items:
            continue
        obj_end = _find_already_present_object_end(entry_text, item, key)
        if obj_end is not None:
            return obj_end
    return find_balanced_object_end(entry_text, fallback_anchor_start)


def patch_routes(entry_text: str, routes: tuple[RouteEntry, ...] = ROUTES) -> tuple[str, dict[str, bool]]:
    """Inserts a route record for every route in `routes` that doesn't already have one
    (matched by its `path:` string). The batch of still-missing routes is spliced in,
    together and in `routes` order, right after the last already-present route's own
    route record (see `_insertion_point`) - or, if no route in `routes` is present yet,
    right after the significance-test route record. Returns (possibly-patched text,
    {route.name: True if inserted})."""
    changed = {route.name: False for route in routes}
    missing = [route for route in routes if f'path:`{route.path}`' not in entry_text]
    if not missing:
        return entry_text, changed

    route_matches = list(SIGNIFICANCE_TEST_ROUTE_RE.finditer(entry_text))
    if len(route_matches) != 1:
        raise PatchError(
            f"expected exactly one occurrence of the significance-test route anchor "
            f"({SIGNIFICANCE_TEST_ROUTE_RE.pattern!r}), found {len(route_matches)}"
        )
    anchor_start = route_matches[0].start()
    end = _insertion_point(entry_text, routes, missing, 'path', anchor_start)

    insertion = ''.join(
        f',{marker_for(route)}{{name:`{route.name}`,path:`{route.path}`,'
        f'component:()=>import(`./{route.chunk_name}`)}}'
        for route in missing
    )
    for route in missing:
        changed[route.name] = True
    return entry_text[:end] + insertion + entry_text[end:], changed


def patch_nav(entry_text: str, nav_items: tuple[NavEntry, ...] = NAV_ITEMS) -> tuple[str, dict[str, bool]]:
    """Inserts a sidebar item for every nav item in `nav_items` that doesn't already
    have one (matched by its `to:` string), reusing Rule Test's icon component variable
    (rendering the same icon on multiple nav rows is harmless in Vue - a new,
    un-imported `i-heroicons-*` icon isn't available without a fresh Nuxt build). The
    batch of still-missing items is spliced in, together and in `nav_items` order,
    right after the last already-present item's own nav entry (see `_insertion_point`)
    - or, if no item in `nav_items` is present yet, right after the Rule Test nav item.
    Returns (possibly-patched text, {nav.name: True if inserted})."""
    changed = {nav.name: False for nav in nav_items}
    missing = [nav for nav in nav_items if f'to:`{nav.to}`' not in entry_text]
    if not missing:
        return entry_text, changed

    matches = list(RULE_TEST_NAV_RE.finditer(entry_text))
    if len(matches) != 1:
        raise PatchError(
            f"expected exactly one Rule Test nav item anchor, found {len(matches)}"
        )
    m = matches[0]
    icon_var = m.group(1)
    end = _insertion_point(entry_text, nav_items, missing, 'to', m.start())

    insertion = ''.join(
        f',{marker_for(nav)}{{name:`{nav.label}`,to:`{nav.to}`,icon:{icon_var}}}'
        for nav in missing
    )
    for nav in missing:
        changed[nav.name] = True
    return entry_text[:end] + insertion + entry_text[end:], changed


def strip_patch(text: str, items: tuple = ALL_ITEMS) -> str:
    """The exact inverse of `patch_routes`/`patch_nav`: removes every insertion they
    made for `items`, plus anything left by the pre-India per-page patcher
    (`OLD_PAGE_MARKERS`) and the even older pre-#92 single-page script
    (`LEGACY_MARKER`). Each insertion has the fixed shape `,` + marker + a balanced
    `{...}` object literal spliced in right after an anchor (see both functions above),
    so this just finds each marker occurrence and deletes that comma, the marker, and
    the object that follows it, until none remain. Used by `unpatch()` below - and, in
    turn, by the test suite to derive a real "pre-patch" bundle from the committed,
    already-patched one without depending on git history (see PATCHING.md)."""
    markers = [marker_for(item) for item in items] + list(OLD_PAGE_MARKERS) + [LEGACY_MARKER]
    while True:
        found = [(text.find(marker), marker) for marker in markers]
        found = [(pos, marker) for pos, marker in found if pos != -1]
        if not found:
            return text
        # Earliest occurrence first: markers can interleave in the entry chunk (e.g.
        # legacy route, then a new-scheme nav item), and deleting out of document order
        # would shift the offsets `find` returned for the others.
        marker_at, marker = min(found)
        if marker_at == 0 or text[marker_at - 1] != ',':
            raise PatchError(f'found {marker!r} not immediately preceded by a comma - cannot safely unpatch')
        obj_start = marker_at + len(marker)
        if obj_start >= len(text) or text[obj_start] != '{':
            raise PatchError(f'found {marker!r} not immediately followed by an object literal - cannot safely unpatch')
        obj_end = find_balanced_object_end(text, obj_start)
        text = text[:marker_at - 1] + text[obj_end:]


def unpatch(
    static_dir: Path, routes: tuple[RouteEntry, ...] = ROUTES, nav_items: tuple[NavEntry, ...] = NAV_ITEMS,
) -> bool:
    """Reverts `patch()` in place: strips every route/nav insertion from the entry
    chunk (via `strip_patch`, including anything left by the pre-India per-page patcher
    or the pre-#92 single-page script) and deletes every generated page chunk - both
    `routes`' own (current) chunks and the obsolete per-page ones (`OBSOLETE_CHUNK_NAMES`).
    Returns True if anything was actually reverted, False if the bundle was already
    fully unpatched. This is the `--revert` CLI action, and also what the test suite
    uses to build a real unpatched fixture out of the committed, patched bundle."""
    entry_path = find_entry_chunk(static_dir)
    entry_text = _read(entry_path)
    stripped_text = strip_patch(entry_text, routes + nav_items)
    entry_changed = stripped_text != entry_text
    if entry_changed:
        entry_path.write_text(stripped_text, encoding='utf-8')

    any_generated_existed = False
    chunk_names = [route.chunk_name for route in routes] + list(OBSOLETE_CHUNK_NAMES)
    for chunk_name in chunk_names:
        generated_path = static_dir / '_nuxt' / chunk_name
        if generated_path.exists():
            generated_path.unlink()
            any_generated_existed = True

    return entry_changed or any_generated_existed


def find_vue_runtime_chunk(static_dir: Path) -> tuple[Path, str]:
    """Finds the Vue-runtime chunk by content (the file whose source defines a
    function matching Vue's `createElementVNode`/`createBaseVNode` shape), not by
    today's filename (`CoKk4mC0.js` as of this writing - not relied upon)."""
    nuxt_dir = static_dir / '_nuxt'
    candidates = []
    for path in sorted(nuxt_dir.glob('*.js')):
        text = _read(path)
        if CREATE_ELEMENT_VNODE_RE.search(text):
            candidates.append((path, text))
    if len(candidates) != 1:
        found = ', '.join(str(p) for p, _ in candidates) or '<none>'
        raise PatchError(
            f"expected exactly one chunk under {nuxt_dir} containing the createElementVNode "
            f"marker body, found {len(candidates)}: {found}"
        )
    return candidates[0]


def resolve_create_element_vnode_alias(vue_chunk_text: str) -> str:
    """Resolves today's export name for `createElementVNode` in the Vue-runtime
    chunk: first finds its *internal* (pre-export) local name via the content-anchored
    regex above, then finds what that internal name is publicly exported as (the
    `<internal> as <public>` pair inside the chunk's own `export{...}` statement) -
    that public name is what every other chunk (and our generated ones) imports."""
    m = CREATE_ELEMENT_VNODE_RE.search(vue_chunk_text)
    if not m:
        raise PatchError('createElementVNode marker body not found when resolving its export alias')
    internal_name = m.group(1)
    export_matches = re.findall(rf'\b{re.escape(internal_name)}\s+as\s+([A-Za-z_$][\w$]*)\b', vue_chunk_text)
    if len(export_matches) != 1:
        raise PatchError(
            f"expected exactly one 'export' alias for internal name {internal_name!r}, "
            f"found {len(export_matches)}"
        )
    return export_matches[0]


def render_generated_chunk(vue_chunk_filename: str, create_element_vnode_alias: str, route: RouteEntry) -> str:
    template_text = _read(TEMPLATES_DIR / route.template)
    generated = template_text.replace('__VUE_CHUNK__', f'./{vue_chunk_filename}')
    generated = generated.replace('__VUE_createElementVNode__', create_element_vnode_alias)
    generated = generated.replace('__NG_ENTRY__', route.ng_entry)
    generated = generated.replace('__PAGE_NAME__', route.component_name)
    leftover = PLACEHOLDER_RE.search(generated)
    if leftover:
        raise PatchError(
            f"an unresolved {leftover.group(0)!r} placeholder was left in the generated chunk "
            f"for route {route.name!r}"
        )
    return generated


def patch(
    static_dir: Path, check: bool = False,
    routes: tuple[RouteEntry, ...] = ROUTES, nav_items: tuple[NavEntry, ...] = NAV_ITEMS,
) -> bool:
    """Applies (or, with check=True, only verifies) the full patch: every route in
    `routes` and every nav item in `nav_items`. Also strips any obsolete route/nav
    object left by an older version of this patcher (the pre-India per-page design or
    the pre-#92 single-page script - `strip_patch(entry_text, items=())` removes only
    those, never the current `routes`/`nav_items` markers) and deletes the obsolete
    per-page chunk files themselves (`OBSOLETE_CHUNK_NAMES`), on a non-check run.
    Skipping this cleanup would otherwise leave a dead `component:()=>import(...)`
    route pointing at a chunk this same call just deleted. Returns True on
    success/up-to-date, False when `check=True` and anything is missing, stale, or
    still carries obsolete content. Raises PatchError if a content anchor can't be
    resolved at all."""
    entry_path = find_entry_chunk(static_dir)
    original_entry_text = _read(entry_path)
    entry_text = strip_patch(original_entry_text, items=())
    obsolete_markers_present = entry_text != original_entry_text

    routed_text, route_changed = patch_routes(entry_text, routes)
    final_entry_text, nav_changed = patch_nav(routed_text, nav_items)
    entry_needs_write = obsolete_markers_present or any(route_changed.values()) or any(nav_changed.values())

    vue_chunk_path, vue_chunk_text = find_vue_runtime_chunk(static_dir)
    alias = resolve_create_element_vnode_alias(vue_chunk_text)

    problems = []
    to_write = {}
    for route in routes:
        generated_text = render_generated_chunk(vue_chunk_path.name, alias, route)
        generated_path = static_dir / '_nuxt' / route.chunk_name
        up_to_date = generated_path.exists() and _read(generated_path) == generated_text
        to_write[route.name] = (generated_path, generated_text, up_to_date)

        if check:
            if route_changed[route.name]:
                problems.append(f"route '{route.name}': route patch not applied in {entry_path}")
            if not generated_path.exists():
                problems.append(f"route '{route.name}': {generated_path} missing")
            elif not up_to_date:
                problems.append(
                    f"route '{route.name}': {generated_path} stale "
                    f"(does not match the current template + resolved aliases)"
                )

    if check:
        for nav in nav_items:
            if nav_changed[nav.name]:
                problems.append(f"nav item '{nav.name}': nav patch not applied in {entry_path}")
        if obsolete_markers_present:
            problems.append(
                f"obsolete route/nav markers from an older patcher version present in "
                f"{entry_path} (a non-check run removes them)"
            )
        for name in OBSOLETE_CHUNK_NAMES:
            if (static_dir / '_nuxt' / name).exists():
                problems.append(
                    f"obsolete chunk _nuxt/{name} present (left by the pre-India per-page "
                    f"patcher; a non-check run removes it)"
                )

    if check:
        if problems:
            for p in problems:
                print(f'patch_dashboard --check: {p}', file=sys.stderr)
            return False
        return True

    if entry_needs_write:
        entry_path.write_text(final_entry_text, encoding='utf-8')
    for route in routes:
        generated_path, generated_text, up_to_date = to_write[route.name]
        if not up_to_date:
            generated_path.write_text(generated_text, encoding='utf-8')
    for name in OBSOLETE_CHUNK_NAMES:
        obsolete_path = static_dir / '_nuxt' / name
        if obsolete_path.exists():
            obsolete_path.unlink()
    return True


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--static-dir', default=str(DEFAULT_STATIC_DIR), help='Path to jesse/static (default: %(default)s)')
    parser.add_argument('--check', action='store_true', help='Verify the patch is present and up to date; write nothing')
    parser.add_argument(
        '--revert', action='store_true',
        help='Undo the patch (strip every route/nav insertion, delete every generated chunk) instead of '
             'applying it - useful right before merging an upstream "Update frontend" rebuild',
    )
    args = parser.parse_args(argv)
    if args.check and args.revert:
        parser.error('--check and --revert are mutually exclusive')

    static_dir = Path(args.static_dir)
    try:
        if args.revert:
            changed = unpatch(static_dir)
            print('patch_dashboard --revert: OK' + (' (reverted)' if changed else ' (already unpatched)'))
            return 0
        ok = patch(static_dir, check=args.check)
    except PatchError as e:
        print(f'patch_dashboard: {e}', file=sys.stderr)
        return 1

    if args.check:
        if ok:
            print('patch_dashboard --check: OK (patch present and up to date)')
        return 0 if ok else 1

    print('patch_dashboard: OK')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
