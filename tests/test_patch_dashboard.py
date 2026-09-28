"""Tests for `scripts/patch_dashboard.py` (dev-pmallapp/jesse#90, #92, #105) - the
content-anchored patcher that adds the India app's single SPA route + its sidebar nav
items to the compiled Nuxt dashboard bundle's own router/sidebar. See that script's
module docstring and `jesse/dashboard_patches/india_page.template.js`'s docstring for
the design.

Two scenarios are covered:
  - `test_check_passes_on_committed_static`: the bundle actually shipped in this repo
    (already patched, as part of this branch) must pass `--check`.
  - `test_patch_from_scratch_on_unpatched_copy`: the patcher, run against a *fresh,
    unpatched* copy of the bundle, must apply cleanly, be idempotent, and leave no
    unresolved template placeholders - this is the scenario that matters most, since
    it's what a future "Update frontend" + re-run-the-patcher cycle will actually look
    like.

The "fresh, unpatched" copy is derived from the committed, already-patched bundle by
*un*-patching it (`patch_dashboard.unpatch`, the exact inverse of `patch`), not by
reading an old commit via `git show`: a shallow CI checkout (`actions/checkout@v4`'s
default `fetch-depth: 1`) has no history to `git show` from, and keeping a second,
~187 KB copy of the real entry chunk in the repo just to serve as an "unpatched"
fixture would be its own maintenance burden. `test_patch_of_unpatch_reproduces_committed_bundle`
below is the proof that this round trip is faithful: unpatching the committed bundle
and then re-patching it must reproduce the exact same bytes.
"""
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / 'scripts'))
import patch_dashboard  # noqa: E402  (path insert must happen first)

INDIA_ROUTE = next(r for r in patch_dashboard.ROUTES if r.name == 'india')
STOCKS_NAV = next(n for n in patch_dashboard.NAV_ITEMS if n.name == 'india-nav-stocks')
BASKETS_NAV = next(n for n in patch_dashboard.NAV_ITEMS if n.name == 'india-nav-baskets')


@pytest.fixture
def unpatched_static_dir(tmp_path):
    """A minimal, real-content copy of the *unpatched* bundle: just the files the
    patcher actually reads/edits (index.html for the entry-chunk lookup, the entry
    chunk itself, and the Vue-runtime chunk it resolves an alias from), derived by
    copying the committed (already-patched) bundle and then stripping the patch back
    out - see the module docstring for why not `git show` a pre-patch commit."""
    committed_static_dir = REPO_ROOT / 'jesse' / 'static'
    static_dir = tmp_path / 'static'
    (static_dir / '_nuxt').mkdir(parents=True)
    shutil.copy(committed_static_dir / 'index.html', static_dir / 'index.html')

    entry_path = patch_dashboard.find_entry_chunk(committed_static_dir)
    shutil.copy(entry_path, static_dir / '_nuxt' / entry_path.name)

    vue_chunk_path, _ = patch_dashboard.find_vue_runtime_chunk(committed_static_dir)
    shutil.copy(vue_chunk_path, static_dir / '_nuxt' / vue_chunk_path.name)

    patch_dashboard.unpatch(static_dir)
    return static_dir


def test_check_fails_before_patching(unpatched_static_dir):
    assert patch_dashboard.patch(unpatched_static_dir, check=True) is False


def test_patch_from_scratch_on_unpatched_copy(unpatched_static_dir):
    """The India route and all four nav items must be applied together from a fresh,
    unpatched bundle, each with its own marker and its own route/nav insertion, and the
    route's generated chunk must exist, resolve the Vue-runtime chunk and reference the
    dashboard/ng entry it `import()`s, with no unresolved template placeholder left in
    it."""
    entry_path = patch_dashboard.find_entry_chunk(unpatched_static_dir)

    assert patch_dashboard.patch(unpatched_static_dir, check=False) is True

    entry_text = entry_path.read_text(encoding='utf-8')
    for route in patch_dashboard.ROUTES:
        marker = patch_dashboard.marker_for(route)
        assert marker in entry_text
        assert f'path:`{route.path}`' in entry_text
        # Exactly one insertion per route (the route table entry only - nav items are
        # separate objects under their own markers, see below).
        assert entry_text.count(marker) == 1

        generated_path = unpatched_static_dir / '_nuxt' / route.chunk_name
        assert generated_path.exists()
        generated_text = generated_path.read_text(encoding='utf-8')
        assert "from './CoKk4mC0.js'" in generated_text
        assert route.ng_entry in generated_text
        assert not patch_dashboard.PLACEHOLDER_RE.search(generated_text)

    for nav in patch_dashboard.NAV_ITEMS:
        marker = patch_dashboard.marker_for(nav)
        assert marker in entry_text
        assert f'to:`{nav.to}`' in entry_text
        assert entry_text.count(marker) == 1

    # --check now passes.
    assert patch_dashboard.patch(unpatched_static_dir, check=True) is True

    # A second real run is a strict no-op (byte-identical), not just "check passes"
    # - the whole point of content-anchoring on the *already-inserted* string (not on
    # position) is that re-running after a partial/duplicate apply never doubles up.
    entry_before = entry_path.read_bytes()
    generated_before = {
        route.name: (unpatched_static_dir / '_nuxt' / route.chunk_name).read_bytes()
        for route in patch_dashboard.ROUTES
    }
    assert patch_dashboard.patch(unpatched_static_dir, check=False) is True
    assert entry_path.read_bytes() == entry_before
    for route in patch_dashboard.ROUTES:
        assert (unpatched_static_dir / '_nuxt' / route.chunk_name).read_bytes() == generated_before[route.name]


def test_patch_of_unpatch_reproduces_committed_bundle(unpatched_static_dir):
    """Round-trip proof that `unpatch()` (used by the `unpatched_static_dir` fixture
    itself) is the exact inverse of `patch()`, not merely something that *looks*
    unpatched: re-patching the fixture's already-unpatched copy must reproduce the
    committed, real bundle byte-for-byte, in both the entry chunk and the generated
    route chunk."""
    assert patch_dashboard.patch(unpatched_static_dir, check=False) is True

    committed_static_dir = REPO_ROOT / 'jesse' / 'static'
    entry_path = patch_dashboard.find_entry_chunk(unpatched_static_dir)
    committed_entry_path = patch_dashboard.find_entry_chunk(committed_static_dir)
    assert entry_path.name == committed_entry_path.name
    assert entry_path.read_bytes() == committed_entry_path.read_bytes()

    for route in patch_dashboard.ROUTES:
        generated_path = unpatched_static_dir / '_nuxt' / route.chunk_name
        committed_generated_path = committed_static_dir / '_nuxt' / route.chunk_name
        assert generated_path.read_bytes() == committed_generated_path.read_bytes()


def test_resolved_vue_alias_matches_known_report_value(unpatched_static_dir):
    """Cross-check against docs/dashboard-bundle/REVERSE_ENGINEERING.md ยง5, which
    independently identified `createElementVNode`'s export alias as `_` for this exact
    bundle snapshot via a different method (call-site pattern matching in consumer
    chunks) - this pins the content-anchor in patch_dashboard.py isn't a fluke."""
    vue_chunk_path, vue_chunk_text = patch_dashboard.find_vue_runtime_chunk(unpatched_static_dir)
    assert vue_chunk_path.name == 'CoKk4mC0.js'
    assert patch_dashboard.resolve_create_element_vnode_alias(vue_chunk_text) == '_'


def test_missing_anchor_raises_patch_error(unpatched_static_dir):
    """If a future bundle no longer contains the significance-test route record at
    all, the patcher must fail loudly, not silently skip the route insertion."""
    entry_path = patch_dashboard.find_entry_chunk(unpatched_static_dir)
    mutated = patch_dashboard.SIGNIFICANCE_TEST_ROUTE_RE.sub(
        'path:`/significance-test-renamed`,', entry_path.read_text(encoding='utf-8')
    )
    entry_path.write_text(mutated, encoding='utf-8')
    with pytest.raises(patch_dashboard.PatchError):
        patch_dashboard.patch(unpatched_static_dir, check=False)


def test_check_names_missing_route_when_only_the_route_insertion_is_removed(unpatched_static_dir):
    """`--check` must call out the route specifically when only its own insertion
    regresses, not a vague overall failure, and must not also complain about the (still
    intact) nav items."""
    patch_dashboard.patch(unpatched_static_dir, check=False)
    entry_path = patch_dashboard.find_entry_chunk(unpatched_static_dir)

    entry_text = entry_path.read_text(encoding='utf-8')
    stripped = patch_dashboard.strip_patch(entry_text, items=(INDIA_ROUTE,))
    assert stripped != entry_text
    entry_path.write_text(stripped, encoding='utf-8')

    result = subprocess.run(
        [
            sys.executable, str(REPO_ROOT / 'scripts' / 'patch_dashboard.py'),
            '--static-dir', str(unpatched_static_dir), '--check',
        ],
        capture_output=True, text=True,
    )
    assert result.returncode == 1
    assert "route 'india'" in result.stderr
    assert "nav item" not in result.stderr


def test_check_names_missing_nav_item_when_only_one_nav_insertion_is_removed(unpatched_static_dir):
    """`--check` must call out exactly which nav item regressed, not the other three or
    the (still intact) route, so a human re-running this after a partial manual edit
    knows what to fix."""
    patch_dashboard.patch(unpatched_static_dir, check=False)
    entry_path = patch_dashboard.find_entry_chunk(unpatched_static_dir)

    entry_text = entry_path.read_text(encoding='utf-8')
    stripped = patch_dashboard.strip_patch(entry_text, items=(STOCKS_NAV,))
    assert stripped != entry_text
    entry_path.write_text(stripped, encoding='utf-8')

    result = subprocess.run(
        [
            sys.executable, str(REPO_ROOT / 'scripts' / 'patch_dashboard.py'),
            '--static-dir', str(unpatched_static_dir), '--check',
        ],
        capture_output=True, text=True,
    )
    assert result.returncode == 1
    assert "nav item 'india-nav-stocks'" in result.stderr
    assert "nav item 'india-nav-baskets'" not in result.stderr
    assert "route 'india'" not in result.stderr


def test_revert_removes_route_and_nav_and_deletes_chunk(tmp_path):
    static_dir = tmp_path / 'static'
    shutil.copytree(REPO_ROOT / 'jesse' / 'static', static_dir)
    for route in patch_dashboard.ROUTES:
        assert (static_dir / '_nuxt' / route.chunk_name).exists()

    assert patch_dashboard.unpatch(static_dir) is True

    entry_path = patch_dashboard.find_entry_chunk(static_dir)
    entry_text = entry_path.read_text(encoding='utf-8')
    for item in patch_dashboard.ALL_ITEMS:
        assert patch_dashboard.marker_for(item) not in entry_text
    for route in patch_dashboard.ROUTES:
        assert f'path:`{route.path}`' not in entry_text
        assert not (static_dir / '_nuxt' / route.chunk_name).exists()
    for nav in patch_dashboard.NAV_ITEMS:
        assert f'to:`{nav.to}`' not in entry_text

    # A second unpatch on an already-unpatched bundle is a no-op, not an error.
    assert patch_dashboard.unpatch(static_dir) is False


def test_unpatch_strips_legacy_single_page_marker(unpatched_static_dir):
    """A bundle patched by the pre-#92 single-page script (one shared marker for both
    the route and nav insertions, no page name in it) must still be revertible by
    today's `unpatch()` - this is the upgrade path for anyone who ran that oldest
    script before this branch."""
    entry_path = patch_dashboard.find_entry_chunk(unpatched_static_dir)
    _patch_only_universe_scan_via_legacy_marker(unpatched_static_dir)

    assert patch_dashboard.unpatch(unpatched_static_dir) is True
    final_text = entry_path.read_text(encoding='utf-8')
    assert patch_dashboard.LEGACY_MARKER not in final_text
    assert 'path:`/universe-scan`' not in final_text
    assert 'to:`/universe-scan`' not in final_text
    assert not (unpatched_static_dir / '_nuxt' / 'universe-scan-page.js').exists()


def test_unpatch_strips_old_per_page_patcher_markers(unpatched_static_dir):
    """A bundle patched by the pre-India per-page patcher (dev-pmallapp/jesse#90..#104
    - one `Page` per route+nav pair, named `universe-scan`/`portfolio`, each under its
    own `/*jesse-dashboard-patch:<name>*/` marker) must still be revertible by today's
    `unpatch()`, and its now-obsolete generated chunks must be deleted too - this is
    the upgrade path for anyone on that design before this branch."""
    entry_path = patch_dashboard.find_entry_chunk(unpatched_static_dir)
    _patch_universe_scan_and_portfolio_via_old_per_page_markers(unpatched_static_dir)

    assert patch_dashboard.unpatch(unpatched_static_dir) is True
    final_text = entry_path.read_text(encoding='utf-8')
    for marker in patch_dashboard.OLD_PAGE_MARKERS:
        assert marker not in final_text
    assert 'path:`/universe-scan`' not in final_text
    assert 'to:`/portfolio`' not in final_text
    for chunk_name in patch_dashboard.OBSOLETE_CHUNK_NAMES:
        assert not (unpatched_static_dir / '_nuxt' / chunk_name).exists()


def _patch_only_universe_scan_via_legacy_marker(static_dir):
    """Hand-builds what the pre-#92 single-page script would have left behind: a
    universe-scan route + nav insertion under the shared, page-name-less
    `LEGACY_MARKER`, with no other insertion at all. Mirrors
    `test_unpatch_strips_legacy_single_page_marker`'s construction."""
    entry_path = patch_dashboard.find_entry_chunk(static_dir)
    entry_text = entry_path.read_text(encoding='utf-8')

    route_insertion = (
        f',{patch_dashboard.LEGACY_MARKER}{{name:`universe-scan`,path:`/universe-scan`,'
        f'component:()=>import(`./universe-scan-page.js`)}}'
    )
    start = patch_dashboard.SIGNIFICANCE_TEST_ROUTE_RE.search(entry_text).start()
    end = patch_dashboard.find_balanced_object_end(entry_text, start)
    entry_text = entry_text[:end] + route_insertion + entry_text[end:]

    m = patch_dashboard.RULE_TEST_NAV_RE.search(entry_text)
    nav_insertion = f',{patch_dashboard.LEGACY_MARKER}{{name:`Universe Scan`,to:`/universe-scan`,icon:{m.group(1)}}}'
    entry_text = entry_text[:m.end()] + nav_insertion + entry_text[m.end():]

    entry_path.write_text(entry_text, encoding='utf-8')
    (static_dir / '_nuxt' / 'universe-scan-page.js').write_text('/* legacy chunk */', encoding='utf-8')


def _patch_universe_scan_and_portfolio_via_old_per_page_markers(static_dir):
    """Hand-builds what the pre-India per-page patcher would have left behind: a
    route + nav insertion for each of `universe-scan`/`portfolio`, each under its own
    `OLD_PAGE_MARKERS` entry, plus their generated chunks. Mirrors
    `test_unpatch_strips_old_per_page_patcher_markers`'s construction."""
    entry_path = patch_dashboard.find_entry_chunk(static_dir)
    entry_text = entry_path.read_text(encoding='utf-8')

    old_pages = (
        ('universe-scan', '/universe-scan', 'Universe Scan', 'universe-scan-page.js'),
        ('portfolio', '/portfolio', 'Portfolio', 'portfolio-page.js'),
    )

    route_matches = list(patch_dashboard.SIGNIFICANCE_TEST_ROUTE_RE.finditer(entry_text))
    end = patch_dashboard.find_balanced_object_end(entry_text, route_matches[0].start())
    route_insertion = ''.join(
        f',{marker}{{name:`{name}`,path:`{path}`,component:()=>import(`./{chunk}`)}}'
        for marker, (name, path, _label, chunk) in zip(patch_dashboard.OLD_PAGE_MARKERS, old_pages)
    )
    entry_text = entry_text[:end] + route_insertion + entry_text[end:]

    m = patch_dashboard.RULE_TEST_NAV_RE.search(entry_text)
    nav_insertion = ''.join(
        f',{marker}{{name:`{label}`,to:`{path}`,icon:{m.group(1)}}}'
        for marker, (_name, path, label, _chunk) in zip(patch_dashboard.OLD_PAGE_MARKERS, old_pages)
    )
    entry_text = entry_text[:m.end()] + nav_insertion + entry_text[m.end():]

    entry_path.write_text(entry_text, encoding='utf-8')
    for _name, _path, _label, chunk in old_pages:
        (static_dir / '_nuxt' / chunk).write_text('/* obsolete chunk */', encoding='utf-8')


def _assert_nav_items_appear_in_registry_order(entry_text):
    prev_index = -1
    for nav in patch_dashboard.NAV_ITEMS:
        idx = entry_text.index(f'to:`{nav.to}`')
        assert idx > prev_index, f"nav item '{nav.name}' is out of NAV_ITEMS order"
        prev_index = idx


def test_patching_remaining_nav_items_preserves_registry_order(unpatched_static_dir):
    """Regression coverage (dev-pmallapp/jesse#92 follow-up, still relevant to the
    India nav items): when only some `NAV_ITEMS` are already patched in, running
    `patch()` for the full list must append the missing ones in `NAV_ITEMS`' own order,
    not splice them in right after the Rule Test anchor (i.e. before the ones already
    present)."""
    assert patch_dashboard.patch(unpatched_static_dir, nav_items=(STOCKS_NAV, BASKETS_NAV)) is True

    assert patch_dashboard.patch(unpatched_static_dir, check=False) is True

    entry_path = patch_dashboard.find_entry_chunk(unpatched_static_dir)
    _assert_nav_items_appear_in_registry_order(entry_path.read_text(encoding='utf-8'))


def test_check_passes_on_committed_static():
    """The bundle actually shipped on this branch must already be patched for the
    India route and every nav item in `NAV_ITEMS`."""
    assert patch_dashboard.patch(REPO_ROOT / 'jesse' / 'static', check=True) is True


def test_cli_check_exit_code_on_committed_static():
    result = subprocess.run(
        [sys.executable, str(REPO_ROOT / 'scripts' / 'patch_dashboard.py'), '--check'],
        cwd=REPO_ROOT, capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stderr


def test_cli_check_exit_code_on_unpatched_copy(unpatched_static_dir):
    result = subprocess.run(
        [
            sys.executable, str(REPO_ROOT / 'scripts' / 'patch_dashboard.py'),
            '--static-dir', str(unpatched_static_dir), '--check',
        ],
        cwd=REPO_ROOT, capture_output=True, text=True,
    )
    assert result.returncode == 1


def test_cli_revert_on_patched_committed_copy(tmp_path):
    """`--revert` is the CLI-facing wrapper around `unpatch()` - exercised end-to-end
    (via subprocess, not a direct library call) since it's meant to be run by hand
    right before merging an upstream "Update frontend" commit."""
    static_dir = tmp_path / 'static'
    shutil.copytree(REPO_ROOT / 'jesse' / 'static', static_dir)
    generated_paths = [static_dir / '_nuxt' / route.chunk_name for route in patch_dashboard.ROUTES]
    for p in generated_paths:
        assert p.exists()

    revert_argv = [
        sys.executable, str(REPO_ROOT / 'scripts' / 'patch_dashboard.py'),
        '--static-dir', str(static_dir), '--revert',
    ]
    result = subprocess.run(revert_argv, cwd=REPO_ROOT, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    for p in generated_paths:
        assert not p.exists()
    entry_path = patch_dashboard.find_entry_chunk(static_dir)
    entry_text = entry_path.read_text(encoding='utf-8')
    for item in patch_dashboard.ALL_ITEMS:
        assert patch_dashboard.marker_for(item) not in entry_text

    # A second --revert on an already-unpatched bundle is a no-op, not an error.
    result2 = subprocess.run(revert_argv, cwd=REPO_ROOT, capture_output=True, text=True)
    assert result2.returncode == 0, result2.stderr


def test_generated_chunk_references_ng_entry_and_has_no_placeholders(unpatched_static_dir):
    """The rendered wrapper for each route must reference its dashboard/ng build
    output by the exact path the entry's own `mount()` contract expects, and must have
    substituted every `__SOME_PLACEHOLDER__`-shaped template token - a leftover one
    would ship literally into the bundle instead of failing the patch loudly."""
    patch_dashboard.patch(unpatched_static_dir, check=False)
    for route in patch_dashboard.ROUTES:
        generated_text = (unpatched_static_dir / '_nuxt' / route.chunk_name).read_text(encoding='utf-8')
        assert f"'{route.ng_entry}'" in generated_text
        assert not re.search(r'__[A-Z][A-Z0-9_]*__', generated_text)


@pytest.mark.skipif(shutil.which('node') is None, reason='node not available in this environment')
def test_generated_chunks_are_valid_js_syntax(unpatched_static_dir):
    patch_dashboard.patch(unpatched_static_dir, check=False)
    for route in patch_dashboard.ROUTES:
        generated_path = unpatched_static_dir / '_nuxt' / route.chunk_name
        result = subprocess.run(['node', '--check', str(generated_path)], capture_output=True, text=True)
        assert result.returncode == 0, result.stderr


@pytest.mark.skipif(shutil.which('node') is None, reason='node not available in this environment')
def test_patched_entry_chunk_is_valid_js_syntax(unpatched_static_dir):
    patch_dashboard.patch(unpatched_static_dir, check=False)
    entry_path = patch_dashboard.find_entry_chunk(unpatched_static_dir)
    result = subprocess.run(['node', '--check', str(entry_path)], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr


@pytest.mark.skipif(shutil.which('node') is None, reason='node not available in this environment')
def test_committed_generated_chunks_are_valid_js_syntax():
    for route in patch_dashboard.ROUTES:
        generated_path = REPO_ROOT / 'jesse' / 'static' / '_nuxt' / route.chunk_name
        result = subprocess.run(['node', '--check', str(generated_path)], capture_output=True, text=True)
        assert result.returncode == 0, result.stderr
