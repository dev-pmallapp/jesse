"""Tests for `scripts/patch_dashboard.py` (dev-pmallapp/jesse#90) - the content-anchored
patcher that adds the Universe Scan page to the compiled Nuxt dashboard bundle's own
router/sidebar. See that script's module docstring and
`jesse/dashboard_patches/universe_scan_page.template.js`'s docstring for the design.

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
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / 'scripts'))
import patch_dashboard  # noqa: E402  (path insert must happen first)


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
    entry_path = patch_dashboard.find_entry_chunk(unpatched_static_dir)
    generated_path = unpatched_static_dir / '_nuxt' / 'universe-scan-page.js'

    assert patch_dashboard.patch(unpatched_static_dir, check=False) is True

    entry_text = entry_path.read_text(encoding='utf-8')
    assert patch_dashboard.MARKER in entry_text
    assert 'path:`/universe-scan`' in entry_text
    assert 'to:`/universe-scan`' in entry_text
    # Exactly two insertions (route + nav), not a duplicate of either.
    assert entry_text.count(patch_dashboard.MARKER) == 2

    assert generated_path.exists()
    generated_text = generated_path.read_text(encoding='utf-8')
    assert '__VUE_' not in generated_text
    assert "from './CoKk4mC0.js'" in generated_text

    # --check now passes.
    assert patch_dashboard.patch(unpatched_static_dir, check=True) is True

    # A second real run is a strict no-op (byte-identical), not just "check passes"
    # - the whole point of content-anchoring on the *already-inserted* string (not on
    # position) is that re-running after a partial/duplicate apply never doubles up.
    entry_before = entry_path.read_bytes()
    generated_before = generated_path.read_bytes()
    assert patch_dashboard.patch(unpatched_static_dir, check=False) is True
    assert entry_path.read_bytes() == entry_before
    assert generated_path.read_bytes() == generated_before


def test_patch_of_unpatch_reproduces_committed_bundle(unpatched_static_dir):
    """Round-trip proof that `unpatch()` (used by the `unpatched_static_dir` fixture
    itself) is the exact inverse of `patch()`, not merely something that *looks*
    unpatched: re-patching the fixture's already-unpatched copy must reproduce the
    committed, real bundle byte-for-byte, in both the entry chunk and the generated
    page chunk."""
    assert patch_dashboard.patch(unpatched_static_dir, check=False) is True

    committed_static_dir = REPO_ROOT / 'jesse' / 'static'
    entry_path = patch_dashboard.find_entry_chunk(unpatched_static_dir)
    committed_entry_path = patch_dashboard.find_entry_chunk(committed_static_dir)
    assert entry_path.name == committed_entry_path.name
    assert entry_path.read_bytes() == committed_entry_path.read_bytes()

    generated_path = unpatched_static_dir / '_nuxt' / 'universe-scan-page.js'
    committed_generated_path = committed_static_dir / '_nuxt' / 'universe-scan-page.js'
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
    mutated = entry_path.read_text(encoding='utf-8').replace(
        patch_dashboard.SIGNIFICANCE_TEST_ROUTE_ANCHOR, 'path:`/significance-test-renamed`,'
    )
    entry_path.write_text(mutated, encoding='utf-8')
    with pytest.raises(patch_dashboard.PatchError):
        patch_dashboard.patch(unpatched_static_dir, check=False)


def test_check_passes_on_committed_static():
    """The bundle actually shipped on this branch must already be patched."""
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
    generated_path = static_dir / '_nuxt' / 'universe-scan-page.js'
    assert generated_path.exists()

    revert_argv = [
        sys.executable, str(REPO_ROOT / 'scripts' / 'patch_dashboard.py'),
        '--static-dir', str(static_dir), '--revert',
    ]
    result = subprocess.run(revert_argv, cwd=REPO_ROOT, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    assert not generated_path.exists()
    entry_path = patch_dashboard.find_entry_chunk(static_dir)
    assert patch_dashboard.MARKER not in entry_path.read_text(encoding='utf-8')

    # A second --revert on an already-unpatched bundle is a no-op, not an error.
    result2 = subprocess.run(revert_argv, cwd=REPO_ROOT, capture_output=True, text=True)
    assert result2.returncode == 0, result2.stderr


@pytest.mark.skipif(shutil.which('node') is None, reason='node not available in this environment')
def test_generated_chunk_is_valid_js_syntax(unpatched_static_dir):
    patch_dashboard.patch(unpatched_static_dir, check=False)
    generated_path = unpatched_static_dir / '_nuxt' / 'universe-scan-page.js'
    result = subprocess.run(['node', '--check', str(generated_path)], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr


@pytest.mark.skipif(shutil.which('node') is None, reason='node not available in this environment')
def test_patched_entry_chunk_is_valid_js_syntax(unpatched_static_dir):
    patch_dashboard.patch(unpatched_static_dir, check=False)
    entry_path = patch_dashboard.find_entry_chunk(unpatched_static_dir)
    result = subprocess.run(['node', '--check', str(entry_path)], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr


@pytest.mark.skipif(shutil.which('node') is None, reason='node not available in this environment')
def test_committed_generated_chunk_is_valid_js_syntax():
    generated_path = REPO_ROOT / 'jesse' / 'static' / '_nuxt' / 'universe-scan-page.js'
    result = subprocess.run(['node', '--check', str(generated_path)], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
