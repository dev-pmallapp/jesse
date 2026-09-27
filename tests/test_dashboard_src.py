"""Tests for scripts/dashboard_src.py (the dashboard/src <-> jesse/static/_nuxt manager).

These tests don't require node/npx for the parts that don't shell out to them (classify,
manifest bookkeeping, status). `deploy`'s `node --check` gate is skipped when `node` isn't
on PATH, since CI/dev boxes running the general test suite aren't guaranteed to have it.
"""
import hashlib
import importlib.util
import io
import json
import shutil
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "scripts" / "dashboard_src.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("dashboard_src", SCRIPT_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture
def ds():
    """Fresh import per test so module-level path constants can be monkeypatched safely."""
    return _load_module()


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class _Args:
    def __init__(self, **kw):
        self.files = kw.get("files", [])
        self.force = kw.get("force", False)


def test_manifest_covers_exactly_the_app_chunks(ds):
    manifest = json.loads(ds.MANIFEST_PATH.read_text())
    classification = ds.classify_chunks()
    app_files = {f for f, info in classification.items() if info["kind"] == "APP"}
    assert set(manifest.keys()) == app_files


def test_manifest_original_sha_matches_committed_static(ds):
    manifest = json.loads(ds.MANIFEST_PATH.read_text())
    assert manifest, "manifest.json should not be empty"
    for fname, entry in manifest.items():
        shipped = ds.STATIC_NUXT / fname
        assert shipped.exists(), f"{fname} listed in manifest but missing from jesse/static/_nuxt"
        assert _sha256(shipped) == entry["original_sha256"], (
            f"{fname}: manifest original_sha256 doesn't match the committed jesse/static file "
            "(re-run `extract` if jesse/static was legitimately updated)"
        )


def test_manifest_records_a_mode_for_every_chunk(ds):
    manifest = json.loads(ds.MANIFEST_PATH.read_text())
    assert manifest, "manifest.json should not be empty"
    for fname, entry in manifest.items():
        assert entry.get("mode") in ("wakaru", "prettier-only"), (
            f"{fname}: manifest entry missing/invalid 'mode' (got {entry.get('mode')!r})"
        )
        if entry["mode"] == "prettier-only":
            assert entry.get("reason"), f"{fname}: prettier-only entry should record why"


def test_readable_export_names_match_original_for_every_chunk(ds):
    # This is the check `extract` itself runs per-chunk before accepting a wakaru pass (falling
    # back to prettier-only on mismatch - see dashboard/README.md "Known issue"), re-run here as
    # a regression test so a future `extract` run that skips/breaks the check gets caught by CI
    # even without re-running wakaru.
    manifest = json.loads(ds.MANIFEST_PATH.read_text())
    for fname in manifest:
        original_text = (ds.STATIC_NUXT / fname).read_text(errors="replace")
        readable_text = (ds.SRC_NUXT / fname).read_text(errors="replace")
        matches, only_orig, only_readable = ds.diff_export_names(original_text, readable_text)
        assert matches, (
            f"{fname}: readable file's exports differ from the original shipped chunk "
            f"(only in original: {sorted(only_orig)}, only in readable: {sorted(only_readable)})"
        )


def test_readable_files_pass_node_check_if_node_available():
    if not shutil.which("node"):
        pytest.skip("node not on PATH")
    import subprocess

    manifest = json.loads((REPO_ROOT / "dashboard" / "src" / "manifest.json").read_text())
    for fname in manifest:
        readable = REPO_ROOT / "dashboard" / "src" / "_nuxt" / fname
        proc = subprocess.run(["node", "--check", str(readable)], capture_output=True, text=True)
        assert proc.returncode == 0, f"node --check failed for {fname}:\n{proc.stderr}"


def test_status_reports_clean_on_a_fresh_tree(ds, tmp_path, monkeypatch):
    # Copy just the manifested chunks (not the whole 27 MB _nuxt dir) into an isolated tmp
    # tree so this test doesn't depend on / mutate the real jesse/static or dashboard/src.
    manifest = json.loads(ds.MANIFEST_PATH.read_text())
    static_dir = tmp_path / "static_nuxt"
    src_dir = tmp_path / "src_nuxt"
    static_dir.mkdir()
    src_dir.mkdir()
    for fname in manifest:
        shutil.copyfile(ds.STATIC_NUXT / fname, static_dir / fname)
        shutil.copyfile(ds.SRC_NUXT / fname, src_dir / fname)

    monkeypatch.setattr(ds, "STATIC_NUXT", static_dir)
    monkeypatch.setattr(ds, "SRC_NUXT", src_dir)

    buf = io.StringIO()
    with redirect_stdout(buf):
        rc = ds.cmd_status(None)
    assert rc == 0
    assert "Clean" in buf.getvalue()


def test_deploy_copies_an_edited_file(ds, tmp_path, monkeypatch):
    if not shutil.which("node"):
        pytest.skip("node not on PATH (deploy runs `node --check`)")

    manifest = json.loads(ds.MANIFEST_PATH.read_text())
    fname = next(iter(manifest))
    static_dir = tmp_path / "static_nuxt"
    src_dir = tmp_path / "src_nuxt"
    static_dir.mkdir()
    src_dir.mkdir()
    for f in manifest:
        shutil.copyfile(ds.STATIC_NUXT / f, static_dir / f)
        shutil.copyfile(ds.SRC_NUXT / f, src_dir / f)

    monkeypatch.setattr(ds, "STATIC_NUXT", static_dir)
    monkeypatch.setattr(ds, "SRC_NUXT", src_dir)

    marker = "\n// test-edit-marker\n"
    (src_dir / fname).write_text((src_dir / fname).read_text() + marker)

    buf = io.StringIO()
    with redirect_stdout(buf):
        ds.cmd_deploy(_Args())
    assert marker.strip() in (static_dir / fname).read_text()
    assert fname in buf.getvalue()


def test_deploy_refuses_on_shipped_file_conflict(ds, tmp_path, monkeypatch):
    if not shutil.which("node"):
        pytest.skip("node not on PATH (deploy runs `node --check`)")

    manifest = json.loads(ds.MANIFEST_PATH.read_text())
    fname = next(iter(manifest))
    static_dir = tmp_path / "static_nuxt"
    src_dir = tmp_path / "src_nuxt"
    static_dir.mkdir()
    src_dir.mkdir()
    for f in manifest:
        shutil.copyfile(ds.STATIC_NUXT / f, static_dir / f)
        shutil.copyfile(ds.SRC_NUXT / f, src_dir / f)

    monkeypatch.setattr(ds, "STATIC_NUXT", static_dir)
    monkeypatch.setattr(ds, "SRC_NUXT", src_dir)

    # Edit the readable copy...
    (src_dir / fname).write_text((src_dir / fname).read_text() + "\n// edited\n")
    # ...and simulate an upstream "Update frontend" touching the shipped file too.
    (static_dir / fname).write_text((static_dir / fname).read_text() + "\n// upstream changed\n")

    buf = io.StringIO()
    with redirect_stdout(buf), redirect_stderr(buf):
        ds.cmd_deploy(_Args())
    assert "// edited" not in (static_dir / fname).read_text()
    assert "conflict" in buf.getvalue().lower()

    # --force overrides the refusal.
    buf2 = io.StringIO()
    with redirect_stdout(buf2):
        ds.cmd_deploy(_Args(force=True))
    assert "// edited" in (static_dir / fname).read_text()
