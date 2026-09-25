"""Tests for `scripts/patch_dashboard.py` (dev-pmallapp/jesse#90) - the content-anchored
patcher that adds the Universe Scan page to the compiled Nuxt dashboard bundle's own
router/sidebar. See that script's module docstring and
`jesse/dashboard_patches/universe_scan_page.template.js`'s docstring for the design.

Two scenarios are covered:
  - `test_check_passes_on_committed_static`: the bundle actually shipped in this repo
    (already patched, as part of this branch) must pass `--check`.
  - `test_patch_from_scratch_on_unpatched_copy`: the patcher, run against a *fresh,
    unpatched* copy of the bundle taken from git history (the last "Update frontend"
    commit, before this branch touched anything), must apply cleanly, be idempotent,
    and leave no unresolved template placeholders - this is the scenario that matters
    most, since it's what a future "Update frontend" + re-run-the-patcher cycle will
    actually look like.
"""
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / 'scripts'))
import patch_dashboard  # noqa: E402  (path insert must happen first)

# The last "Update frontend" commit before this feature branch made any edits to
# jesse/static - i.e. a real, known-unpatched snapshot of the bundle, fetched via `git
# show` rather than kept as a duplicate binary fixture in the repo.
UNPATCHED_COMMIT = 'd1b75745'


def _git_show(rev_path: str) -> bytes:
    result = subprocess.run(
        ['git', 'show', rev_path], cwd=REPO_ROOT, capture_output=True, check=True,
    )
    return result.stdout


@pytest.fixture
def unpatched_static_dir(tmp_path):
    """A minimal, real-content copy of the *unpatched* bundle: just the two files the
    patcher actually reads/edits (index.html for the entry-chunk lookup, the entry
    chunk itself, and the Vue-runtime chunk it resolves an alias from) - everything
    else in the real `_nuxt/` directory is irrelevant to this script."""
    static_dir = tmp_path / 'static'
    (static_dir / '_nuxt').mkdir(parents=True)
    (static_dir / 'index.html').write_bytes(_git_show(f'{UNPATCHED_COMMIT}:jesse/static/index.html'))
    (static_dir / '_nuxt' / 'rHIqefrb.js').write_bytes(
        _git_show(f'{UNPATCHED_COMMIT}:jesse/static/_nuxt/rHIqefrb.js')
    )
    (static_dir / '_nuxt' / 'CoKk4mC0.js').write_bytes(
        _git_show(f'{UNPATCHED_COMMIT}:jesse/static/_nuxt/CoKk4mC0.js')
    )
    return static_dir


def test_check_fails_before_patching(unpatched_static_dir):
    assert patch_dashboard.patch(unpatched_static_dir, check=True) is False


def test_patch_from_scratch_on_unpatched_copy(unpatched_static_dir):
    entry_path = unpatched_static_dir / '_nuxt' / 'rHIqefrb.js'
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
    entry_path = unpatched_static_dir / '_nuxt' / 'rHIqefrb.js'
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


@pytest.mark.skipif(shutil.which('node') is None, reason='node not available in this environment')
def test_generated_chunk_is_valid_js_syntax(unpatched_static_dir):
    patch_dashboard.patch(unpatched_static_dir, check=False)
    generated_path = unpatched_static_dir / '_nuxt' / 'universe-scan-page.js'
    result = subprocess.run(['node', '--check', str(generated_path)], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr


@pytest.mark.skipif(shutil.which('node') is None, reason='node not available in this environment')
def test_patched_entry_chunk_is_valid_js_syntax(unpatched_static_dir):
    patch_dashboard.patch(unpatched_static_dir, check=False)
    entry_path = unpatched_static_dir / '_nuxt' / 'rHIqefrb.js'
    result = subprocess.run(['node', '--check', str(entry_path)], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr


@pytest.mark.skipif(shutil.which('node') is None, reason='node not available in this environment')
def test_committed_generated_chunk_is_valid_js_syntax():
    generated_path = REPO_ROOT / 'jesse' / 'static' / '_nuxt' / 'universe-scan-page.js'
    result = subprocess.run(['node', '--check', str(generated_path)], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
