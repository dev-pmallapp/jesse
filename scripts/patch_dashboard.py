#!/usr/bin/env python3
"""Patches the prebuilt Nuxt dashboard bundle (`jesse/static/`) to add extra pages
(Universe Scan, Portfolio, ...) to the dashboard's own router/sidebar, instead of
shipping each one as a separate standalone HTML page (see each page's template
docstring in `jesse/dashboard_patches/` and `docs/dashboard-bundle/REVERSE_ENGINEERING.md`
for the full background).

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

Adding a new page: append a `Page(...)` entry to `PAGES` below (pick a permanent,
never-hashed `chunk_name`) and add its source template under `jesse/dashboard_patches/`
(copy an existing template's mechanics - the `__VUE_CHUNK__`/`__VUE_createElementVNode__`
placeholder substitution and the `export default {name, render()}` shape are the only
per-build-fragile parts). Then add the matching SPA deep-link route in `jesse/__init__.py`
(see `docs/dashboard-bundle/PATCHING.md`).

Usage:
    python scripts/patch_dashboard.py [--static-dir jesse/static] [--check | --revert]

`--check` verifies every page's patch is present and up to date without writing
anything; it exits non-zero if any page's patch is missing, stale, or an anchor can't
be resolved, printing which page(s) failed. Re-running without `--check` is idempotent
(a no-op, byte-identical result, if the bundle is already patched for every page's
current template + resolved aliases).

`--revert` undoes the patch in place for every page (strips every page's marker-
prefixed insertions - including ones left by a pre-dev-pmallapp/jesse#92 single-page
run of this script - from the entry chunk, and deletes every generated page chunk) -
handy right before merging an upstream "Update frontend" commit, so that rebuild lands
on a clean, unpatched bundle instead of merging on top of our insertions.
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
class Page:
    """One page this script injects into the dashboard SPA's own router/sidebar.

    `name` is both the vue-router route name and the key used to derive this page's
    own marker (see `marker_for` below) - keep it kebab-case and unique across `PAGES`.
    `chunk_name` is never hashed (unlike every Vite-generated chunk): this script's own
    output for this page always lands at this exact, permanent filename, so the route
    record it inserts never has to guess or look up a name for it.
    """
    name: str
    path: str
    nav_label: str
    template: str
    chunk_name: str


# Registered in the order they should appear in the route table / sidebar -
# `patch_routes`/`patch_nav` below always insert any still-missing pages right after
# the last already-present page (in this order), so that order is preserved whether a
# bundle is patched from scratch or incrementally (e.g. a new page added to `PAGES`
# later and the patcher re-run on an already-patched bundle).
PAGES: tuple[Page, ...] = (
    Page('universe-scan', '/universe-scan', 'Universe Scan', 'universe_scan_page.template.js', 'universe-scan-page.js'),
    Page('portfolio', '/portfolio', 'Portfolio', 'portfolio_page.template.js', 'portfolio-page.js'),
)

# Every insertion this script makes into the entry chunk for a given page is prefixed
# with that page's own marker, both so a second run can tell "already patched" from
# "not yet patched" without re-deriving today's variable names, and so a human diffing
# the (huge, minified) entry chunk can `grep` straight to what a specific page added.
def marker_for(page: Page) -> str:
    return f'/*jesse-dashboard-patch:{page.name}*/'


# The marker used before dev-pmallapp/jesse#92 introduced multiple pages (a single,
# page-name-less marker shared by Universe Scan's route *and* nav insertions). A bundle
# patched by that older script must still be revertible/upgradable by this one, so
# `strip_patch`/`unpatch` always also look for this alongside every current page's
# marker - see PATCHING.md.
LEGACY_MARKER = '/*jesse-universe-scan-patch*/'

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


def _find_already_present_object_end(entry_text: str, page: Page, key: str) -> int | None:
    """Locates the end of `page`'s already-inserted route (`key='path'`) or nav
    (`key='to'`) object literal, so a later batch of missing pages can be spliced in
    right after it - preserving `PAGES` order on an incremental/partial re-patch
    instead of always anchoring on the (earlier, `significance-test`/`Rule Test`)
    framework anchor.

    Looks for the object under both `page`'s own marker and `LEGACY_MARKER` (a bundle
    patched by the pre-#92 single-page script only ever used the legacy marker), since
    either could be how `page` ended up in the bundle. `LEGACY_MARKER` is checked for
    every page (not just the one page - `universe-scan` - the old script supported),
    for the same reason `strip_patch` doesn't special-case it: cheap to check, and
    correct even if a future rename changes which page carries that legacy marker.
    A marker can appear more than once (route + nav insertions share it under the
    legacy scheme), so every occurrence is checked for the specific `key:` this page
    is being looked up by, not just the first. Returns None if `page` isn't present
    under either marker at all."""
    for marker in (marker_for(page), LEGACY_MARKER):
        search_from = 0
        while True:
            marker_at = entry_text.find(marker, search_from)
            if marker_at == -1:
                break
            obj_start = marker_at + len(marker)
            search_from = obj_start
            if obj_start < len(entry_text) and entry_text[obj_start] == '{':
                obj_end = find_balanced_object_end(entry_text, obj_start)
                if f'{key}:`{page.path}`' in entry_text[obj_start:obj_end]:
                    return obj_end
    return None


def _insertion_point(
    entry_text: str, pages: tuple[Page, ...], missing_pages: list[Page], key: str,
    fallback_anchor_start: int,
) -> int:
    """Where to splice a batch of `missing_pages`' route/nav objects so the result
    stays in `pages` order: right after the already-inserted object of the last page
    (in `pages` order) that isn't in `missing_pages`, or - if no page in `pages` is
    present yet - right after the framework anchor object starting at
    `fallback_anchor_start` (the significance-test route / Rule Test nav item)."""
    for page in reversed(pages):
        if page in missing_pages:
            continue
        obj_end = _find_already_present_object_end(entry_text, page, key)
        if obj_end is not None:
            return obj_end
    return find_balanced_object_end(entry_text, fallback_anchor_start)


def patch_routes(entry_text: str, pages: tuple[Page, ...] = PAGES) -> tuple[str, dict[str, bool]]:
    """Inserts a route record for every page in `pages` that doesn't already have one
    (matched by its `path:` string). The batch of still-missing pages is spliced in,
    together and in `pages` order, right after the last already-present page's own
    route record (see `_insertion_point`) - or, if no page in `pages` is present yet,
    right after the significance-test route record. Returns (possibly-patched text,
    {page.name: True if inserted})."""
    changed = {page.name: False for page in pages}
    missing_pages = [page for page in pages if f'path:`{page.path}`' not in entry_text]
    if not missing_pages:
        return entry_text, changed

    route_matches = list(SIGNIFICANCE_TEST_ROUTE_RE.finditer(entry_text))
    if len(route_matches) != 1:
        raise PatchError(
            f"expected exactly one occurrence of the significance-test route anchor "
            f"({SIGNIFICANCE_TEST_ROUTE_RE.pattern!r}), found {len(route_matches)}"
        )
    anchor_start = route_matches[0].start()
    end = _insertion_point(entry_text, pages, missing_pages, 'path', anchor_start)

    insertion = ''.join(
        f',{marker_for(page)}{{name:`{page.name}`,path:`{page.path}`,'
        f'component:()=>import(`./{page.chunk_name}`)}}'
        for page in missing_pages
    )
    for page in missing_pages:
        changed[page.name] = True
    return entry_text[:end] + insertion + entry_text[end:], changed


def patch_nav(entry_text: str, pages: tuple[Page, ...] = PAGES) -> tuple[str, dict[str, bool]]:
    """Inserts a sidebar item for every page in `pages` that doesn't already have one
    (matched by its `to:` string), reusing Rule Test's icon component variable
    (rendering the same icon on multiple nav rows is harmless in Vue - a new,
    un-imported `i-heroicons-*` icon isn't available without a fresh Nuxt build). The
    batch of still-missing pages is spliced in, together and in `pages` order, right
    after the last already-present page's own nav item (see `_insertion_point`) - or,
    if no page in `pages` is present yet, right after the Rule Test nav item. Returns
    (possibly-patched text, {page.name: True if inserted})."""
    changed = {page.name: False for page in pages}
    missing_pages = [page for page in pages if f'to:`{page.path}`' not in entry_text]
    if not missing_pages:
        return entry_text, changed

    matches = list(RULE_TEST_NAV_RE.finditer(entry_text))
    if len(matches) != 1:
        raise PatchError(
            f"expected exactly one Rule Test nav item anchor, found {len(matches)}"
        )
    m = matches[0]
    icon_var = m.group(1)
    end = _insertion_point(entry_text, pages, missing_pages, 'to', m.start())

    insertion = ''.join(
        f',{marker_for(page)}{{name:`{page.nav_label}`,to:`{page.path}`,icon:{icon_var}}}'
        for page in missing_pages
    )
    for page in missing_pages:
        changed[page.name] = True
    return entry_text[:end] + insertion + entry_text[end:], changed


def strip_patch(text: str, pages: tuple[Page, ...] = PAGES) -> str:
    """The exact inverse of `patch_routes`/`patch_nav`: removes every insertion they
    made for `pages`, plus anything left by the pre-#92 single-page script (see
    `LEGACY_MARKER`). Each insertion has the fixed shape `,` + marker + a balanced
    `{...}` object literal spliced in right after an anchor (see both functions above),
    so this just finds each marker occurrence and deletes that comma, the marker, and
    the object that follows it, until none remain. Used by `unpatch()` below - and, in
    turn, by the test suite to derive a real "pre-patch" bundle from the committed,
    already-patched one without depending on git history (see PATCHING.md)."""
    markers = [marker_for(page) for page in pages] + [LEGACY_MARKER]
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


def unpatch(static_dir: Path, pages: tuple[Page, ...] = PAGES) -> bool:
    """Reverts `patch()` in place: strips every page's marker-prefixed insertions from
    the entry chunk (via `strip_patch`, including any left by the pre-#92 single-page
    script) and deletes every generated page chunk. Returns True if anything was
    actually reverted, False if the bundle was already fully unpatched. This is the
    `--revert` CLI action, and also what the test suite uses to build a real unpatched
    fixture out of the committed, patched bundle."""
    entry_path = find_entry_chunk(static_dir)
    entry_text = _read(entry_path)
    stripped_text = strip_patch(entry_text, pages)
    entry_changed = stripped_text != entry_text
    if entry_changed:
        entry_path.write_text(stripped_text, encoding='utf-8')

    any_generated_existed = False
    for page in pages:
        generated_path = static_dir / '_nuxt' / page.chunk_name
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


def render_generated_chunk(vue_chunk_filename: str, create_element_vnode_alias: str, page: Page) -> str:
    template_text = _read(TEMPLATES_DIR / page.template)
    generated = template_text.replace('__VUE_CHUNK__', f'./{vue_chunk_filename}')
    generated = generated.replace('__VUE_createElementVNode__', create_element_vnode_alias)
    if '__VUE_' in generated:
        raise PatchError(f"a __VUE_*__ placeholder was left unresolved in the generated chunk for page {page.name!r}")
    return generated


def patch(static_dir: Path, check: bool = False, pages: tuple[Page, ...] = PAGES) -> bool:
    """Applies (or, with check=True, only verifies) the full patch for every page in
    `pages`. Returns True on success/up-to-date, False when `check=True` and any
    page's patch is missing or stale. Raises PatchError if a content anchor can't be
    resolved at all."""
    entry_path = find_entry_chunk(static_dir)
    entry_text = _read(entry_path)

    routed_text, route_changed = patch_routes(entry_text, pages)
    final_entry_text, nav_changed = patch_nav(routed_text, pages)
    entry_needs_write = any(route_changed.values()) or any(nav_changed.values())

    vue_chunk_path, vue_chunk_text = find_vue_runtime_chunk(static_dir)
    alias = resolve_create_element_vnode_alias(vue_chunk_text)

    problems = []
    to_write = {}
    for page in pages:
        generated_text = render_generated_chunk(vue_chunk_path.name, alias, page)
        generated_path = static_dir / '_nuxt' / page.chunk_name
        up_to_date = generated_path.exists() and _read(generated_path) == generated_text
        to_write[page.name] = (generated_path, generated_text, up_to_date)

        if check:
            if route_changed[page.name] or nav_changed[page.name]:
                problems.append(f"page '{page.name}': route/nav patch not applied in {entry_path}")
            if not generated_path.exists():
                problems.append(f"page '{page.name}': {generated_path} missing")
            elif not up_to_date:
                problems.append(
                    f"page '{page.name}': {generated_path} stale "
                    f"(does not match the current template + resolved aliases)"
                )

    if check:
        if problems:
            for p in problems:
                print(f'patch_dashboard --check: {p}', file=sys.stderr)
            return False
        return True

    if entry_needs_write:
        entry_path.write_text(final_entry_text, encoding='utf-8')
    for page in pages:
        generated_path, generated_text, up_to_date = to_write[page.name]
        if not up_to_date:
            generated_path.write_text(generated_text, encoding='utf-8')
    return True


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--static-dir', default=str(DEFAULT_STATIC_DIR), help='Path to jesse/static (default: %(default)s)')
    parser.add_argument('--check', action='store_true', help='Verify the patch is present and up to date; write nothing')
    parser.add_argument(
        '--revert', action='store_true',
        help='Undo the patch (strip every page\'s route/nav insertions, delete every generated chunk) instead of '
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
