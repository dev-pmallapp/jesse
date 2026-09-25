#!/usr/bin/env python3
"""Patches the prebuilt Nuxt dashboard bundle (`jesse/static/`) to add the Universe
Scan page to the dashboard's own router/sidebar, instead of shipping it as a separate
standalone HTML page (see `jesse/dashboard_patches/universe_scan_page.template.js`'s
docstring and `docs/dashboard-bundle/REVERSE_ENGINEERING.md` for the full background).

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

Usage:
    python scripts/patch_dashboard.py [--static-dir jesse/static] [--check]

`--check` verifies the patch is present and up to date without writing anything;
it exits non-zero if the patch is missing, stale, or an anchor can't be resolved.
Re-running without `--check` is idempotent (a no-op, byte-identical result, if the
bundle is already patched for the current template + resolved aliases).
"""
import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_STATIC_DIR = REPO_ROOT / 'jesse' / 'static'
TEMPLATE_PATH = REPO_ROOT / 'jesse' / 'dashboard_patches' / 'universe_scan_page.template.js'

# Every insertion this script makes into the entry chunk is prefixed with this marker,
# both so a second run can tell "already patched" from "not yet patched" without
# re-deriving today's variable names, and so a human diffing the (huge, minified)
# entry chunk can `grep` straight to what we added.
MARKER = '/*jesse-universe-scan-patch*/'

ROUTE_NAME = 'universe-scan'
ROUTE_PATH = '/universe-scan'
NAV_LABEL = 'Universe Scan'
# Never hashed (unlike every Vite-generated chunk) - this script's own output always
# lands at this exact, permanent filename, so the route record it inserts never has to
# guess or look up a name for it.
GENERATED_CHUNK_NAME = 'universe-scan-page.js'

# Anchor for the route table: this is the literal, stable prefix of the
# `significance-test` route record vue-router's route array (`_a` today, but that
# array's own variable name is not something we rely on - we splice in right after
# this record wherever it happens to live). See REVERSE_ENGINEERING.md ยง1.
SIGNIFICANCE_TEST_ROUTE_ANCHOR = '{name:`significance-test`,path:`/significance-test`,'

# Anchor for the sidebar `Nav` component's item array: the "Rule Test" row is a plain,
# un-nested object literal, so a single regex capturing its icon-component variable
# name is enough (no brace-balancing needed, unlike the route record above, whose
# `component:()=>...` value contains nested `(){}[]`). See REVERSE_ENGINEERING.md ยง2.
RULE_TEST_NAV_RE = re.compile(r'\{name:`Rule Test`,to:`/significance-test`,icon:([A-Za-z0-9_$]+)\}')

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
    literal (the minifier emits both `` `...` `` and, occasionally, quoted strings)."""
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


def patch_routes(entry_text: str) -> tuple[str, bool]:
    """Inserts the universe-scan route record right after the significance-test one.
    Returns (possibly-patched text, whether a change was made)."""
    already_present = f'path:`{ROUTE_PATH}`' in entry_text
    if already_present:
        return entry_text, False

    count = entry_text.count(SIGNIFICANCE_TEST_ROUTE_ANCHOR)
    if count != 1:
        raise PatchError(
            f"expected exactly one occurrence of the significance-test route anchor "
            f"{SIGNIFICANCE_TEST_ROUTE_ANCHOR!r}, found {count}"
        )
    start = entry_text.index(SIGNIFICANCE_TEST_ROUTE_ANCHOR)
    end = find_balanced_object_end(entry_text, start)

    insertion = (
        f',{MARKER}{{name:`{ROUTE_NAME}`,path:`{ROUTE_PATH}`,'
        f'component:()=>import(`./{GENERATED_CHUNK_NAME}`)}}'
    )
    return entry_text[:end] + insertion + entry_text[end:], True


def patch_nav(entry_text: str) -> tuple[str, bool]:
    """Inserts the Universe Scan sidebar item right after Rule Test, reusing its icon
    component variable (rendering the same icon on two nav rows is harmless in Vue -
    a new, un-imported `i-heroicons-*` icon isn't available without a fresh Nuxt
    build). Returns (possibly-patched text, whether a change was made)."""
    already_present = f'to:`{ROUTE_PATH}`' in entry_text
    if already_present:
        return entry_text, False

    matches = list(RULE_TEST_NAV_RE.finditer(entry_text))
    if len(matches) != 1:
        raise PatchError(
            f"expected exactly one Rule Test nav item anchor, found {len(matches)}"
        )
    m = matches[0]
    icon_var = m.group(1)
    insertion = f',{MARKER}{{name:`{NAV_LABEL}`,to:`{ROUTE_PATH}`,icon:{icon_var}}}'
    return entry_text[:m.end()] + insertion + entry_text[m.end():], True


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
    that public name is what every other chunk (and our generated one) imports."""
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


def render_generated_chunk(vue_chunk_filename: str, create_element_vnode_alias: str) -> str:
    template_text = _read(TEMPLATE_PATH)
    generated = template_text.replace('__VUE_CHUNK__', f'./{vue_chunk_filename}')
    generated = generated.replace('__VUE_createElementVNode__', create_element_vnode_alias)
    if '__VUE_' in generated:
        raise PatchError('a __VUE_*__ placeholder was left unresolved in the generated chunk')
    return generated


def patch(static_dir: Path, check: bool = False) -> bool:
    """Applies (or, with check=True, only verifies) the full patch. Returns True on
    success/up-to-date, False when `check=True` and the patch is missing or stale.
    Raises PatchError if a content anchor can't be resolved at all."""
    entry_path = find_entry_chunk(static_dir)
    entry_text = _read(entry_path)

    routed_text, route_changed = patch_routes(entry_text)
    final_entry_text, nav_changed = patch_nav(routed_text)
    entry_needs_write = route_changed or nav_changed

    vue_chunk_path, vue_chunk_text = find_vue_runtime_chunk(static_dir)
    alias = resolve_create_element_vnode_alias(vue_chunk_text)
    generated_text = render_generated_chunk(vue_chunk_path.name, alias)
    generated_path = static_dir / '_nuxt' / GENERATED_CHUNK_NAME
    generated_up_to_date = generated_path.exists() and _read(generated_path) == generated_text

    if check:
        problems = []
        if entry_needs_write:
            problems.append(f'{entry_path}: route/nav patch not applied')
        if not generated_path.exists():
            problems.append(f'{generated_path}: missing')
        elif not generated_up_to_date:
            problems.append(f'{generated_path}: stale (does not match the current template + resolved aliases)')
        if problems:
            for p in problems:
                print(f'patch_dashboard --check: {p}', file=sys.stderr)
            return False
        return True

    if entry_needs_write:
        entry_path.write_text(final_entry_text, encoding='utf-8')
    if not generated_up_to_date:
        generated_path.write_text(generated_text, encoding='utf-8')
    return True


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--static-dir', default=str(DEFAULT_STATIC_DIR), help='Path to jesse/static (default: %(default)s)')
    parser.add_argument('--check', action='store_true', help='Verify the patch is present and up to date; write nothing')
    args = parser.parse_args(argv)

    static_dir = Path(args.static_dir)
    try:
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
