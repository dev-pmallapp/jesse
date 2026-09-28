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
        self.file = kw.get("file")


def test_manifest_covers_exactly_the_app_chunks(ds):
    manifest = json.loads(ds.MANIFEST_PATH.read_text())
    classification = ds.classify_chunks()
    app_files = {f for f, info in classification.items() if info["kind"] == "APP"}
    assert set(manifest.keys()) == app_files


def test_manifest_original_sha_matches_committed_static(ds):
    # original_sha256 is always recorded against the entry chunk's UNPATCHED content
    # (see dashboard/README.md "which tool owns what") - sha256_shipped strips
    # patch_dashboard's page-injection patch back out of the entry chunk before hashing,
    # same as `status`/`deploy` do, so this stays green even though the committed
    # jesse/static/_nuxt/<entry chunk> is itself patched.
    manifest = json.loads(ds.MANIFEST_PATH.read_text())
    assert manifest, "manifest.json should not be empty"
    entry_chunk = ds.find_entry_chunk()
    for fname, entry in manifest.items():
        shipped = ds.STATIC_NUXT / fname
        assert shipped.exists(), f"{fname} listed in manifest but missing from jesse/static/_nuxt"
        assert ds.sha256_shipped(shipped, entry_chunk) == entry["original_sha256"], (
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
    entry_chunk = ds.find_entry_chunk()
    for fname in manifest:
        # read_shipped_text strips patch_dashboard's page-injection patch out of the
        # entry chunk first, matching what `extract` itself compares against.
        original_text = ds.read_shipped_text(ds.STATIC_NUXT / fname, entry_chunk)
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


# ---------------------------------------------------------------------------
# patch_dashboard.py interop (dev-pmallapp/jesse#99): the entry chunk is the one shipped
# chunk that ships PATCHED (patch_dashboard's Universe Scan/Portfolio route+nav
# insertions - see dashboard/README.md "which tool owns what"), while dashboard/src/
# always mirrors its UNPATCHED upstream content. These tests build a minimal, real
# (non-network) copy of the patched bundle - just the files patch_dashboard.py itself
# reads/writes (index.html, the entry chunk, the Vue-runtime chunk, the generated page
# chunks) - the same technique tests/test_patch_dashboard.py's `unpatched_static_dir`
# fixture uses, so no wakaru/prettier/npx invocation is needed.
# ---------------------------------------------------------------------------

def _copy_patched_static_dir(ds, dest: Path) -> tuple[str, Path]:
    """A tmp `static/` tree (index.html + _nuxt/) seeded with real, currently-committed
    content: the entry chunk (patched), the Vue-runtime chunk, and every generated page
    chunk. Returns (entry_chunk filename, the tmp `static/` dir)."""
    real_static = ds.STATIC_NUXT.parent
    (dest / "_nuxt").mkdir(parents=True)
    shutil.copyfile(real_static / "index.html", dest / "index.html")

    entry_chunk = ds.find_entry_chunk()
    assert entry_chunk is not None
    shutil.copyfile(ds.STATIC_NUXT / entry_chunk, dest / "_nuxt" / entry_chunk)

    vue_chunk_path, _ = ds.patch_dashboard.find_vue_runtime_chunk(real_static)
    shutil.copyfile(vue_chunk_path, dest / "_nuxt" / vue_chunk_path.name)

    for route in ds.patch_dashboard.ROUTES:
        shutil.copyfile(real_static / "_nuxt" / route.chunk_name, dest / "_nuxt" / route.chunk_name)

    return entry_chunk, dest


def test_status_clean_on_a_patched_bundle(ds, tmp_path, monkeypatch):
    """The entry chunk ships patched; `status` compares it against the manifest's
    UNPATCHED `original_sha256` (via `sha256_shipped`) and must still report it clean,
    not flag it as a shipped-side change every single time."""
    manifest = json.loads(ds.MANIFEST_PATH.read_text())
    static_dir = tmp_path / "static"
    entry_chunk, static_dir = _copy_patched_static_dir(ds, static_dir)
    src_dir = tmp_path / "src_nuxt"
    src_dir.mkdir()
    for fname in manifest:
        shutil.copyfile(ds.SRC_NUXT / fname, src_dir / fname)
        if not (static_dir / "_nuxt" / fname).exists():
            shutil.copyfile(ds.STATIC_NUXT / fname, static_dir / "_nuxt" / fname)

    monkeypatch.setattr(ds, "STATIC_NUXT", static_dir / "_nuxt")
    monkeypatch.setattr(ds, "SRC_NUXT", src_dir)

    buf = io.StringIO()
    with redirect_stdout(buf):
        rc = ds.cmd_status(None)
    assert rc == 0
    assert "Clean" in buf.getvalue()
    assert f"U {entry_chunk}" not in buf.getvalue()


def test_deploy_of_entry_chunk_keeps_both_pages(ds, tmp_path, monkeypatch):
    if not shutil.which("node"):
        pytest.skip("node not on PATH (deploy runs `node --check`)")

    static_dir = tmp_path / "static"
    entry_chunk, static_dir = _copy_patched_static_dir(ds, static_dir)

    src_dir = tmp_path / "src_nuxt"
    src_dir.mkdir()
    shutil.copyfile(ds.SRC_NUXT / entry_chunk, src_dir / entry_chunk)
    marker = "\n// test-entry-chunk-edit-marker\n"
    (src_dir / entry_chunk).write_text((src_dir / entry_chunk).read_text() + marker)

    monkeypatch.setattr(ds, "STATIC_NUXT", static_dir / "_nuxt")
    monkeypatch.setattr(ds, "SRC_NUXT", src_dir)

    buf = io.StringIO()
    with redirect_stdout(buf):
        ds.cmd_deploy(_Args())

    deployed_entry = static_dir / "_nuxt" / entry_chunk
    assert marker.strip() in deployed_entry.read_text()
    # The deploy must have re-applied patch_dashboard's patch afterward, so the India
    # route's generated chunk is still present and up to date.
    assert ds.patch_dashboard.patch(static_dir, check=True) is True
    for route in ds.patch_dashboard.ROUTES:
        assert (static_dir / "_nuxt" / route.chunk_name).exists()


def test_revert_of_entry_chunk_restores_committed_patched_chunk(ds, tmp_path, monkeypatch):
    """`revert` on the entry chunk must leave it equal to master's committed (patched)
    chunk, not the bare git-HEAD-blob-stripped-of-patch intermediate state."""
    real_static = ds.STATIC_NUXT.parent
    static_dir = tmp_path / "static"
    entry_chunk, static_dir = _copy_patched_static_dir(ds, static_dir)
    committed_entry_bytes = (real_static / "_nuxt" / entry_chunk).read_bytes()

    # Simulate a bad hand-edit that needs reverting.
    (static_dir / "_nuxt" / entry_chunk).write_text(
        committed_entry_bytes.decode("utf-8") + "\n// oops\n", encoding="utf-8"
    )

    monkeypatch.setattr(ds, "STATIC_NUXT", static_dir / "_nuxt")

    rc = ds.cmd_revert(_Args(file=entry_chunk))
    assert rc == 0
    assert (static_dir / "_nuxt" / entry_chunk).read_bytes() == committed_entry_bytes
    assert ds.patch_dashboard.patch(static_dir, check=True) is True


def test_generated_page_chunks_are_excluded_from_classification(ds):
    """Generated `*-page.js` chunks are owned by patch_dashboard.py, not this mirror -
    they must never be classified (APP or VENDOR) or enter manifest.json."""
    classification = ds.classify_chunks()
    manifest = json.loads(ds.MANIFEST_PATH.read_text())
    for route in ds.patch_dashboard.ROUTES:
        assert route.chunk_name not in classification
        assert route.chunk_name not in manifest


def test_deploy_of_entry_chunk_is_atomic_on_repatch_failure(ds, tmp_path, monkeypatch):
    """If re-applying patch_dashboard's patch after deploying the entry chunk fails (a
    future "Update frontend" broke an anchor, or any other error), the shipped entry
    chunk must be rolled back to its pre-deploy bytes - never left unpatched - and the
    error must propagate to the caller rather than being swallowed."""
    if not shutil.which("node"):
        pytest.skip("node not on PATH (deploy runs `node --check`)")

    static_dir = tmp_path / "static"
    entry_chunk, static_dir = _copy_patched_static_dir(ds, static_dir)
    pre_deploy_bytes = (static_dir / "_nuxt" / entry_chunk).read_bytes()

    src_dir = tmp_path / "src_nuxt"
    src_dir.mkdir()
    shutil.copyfile(ds.SRC_NUXT / entry_chunk, src_dir / entry_chunk)
    (src_dir / entry_chunk).write_text((src_dir / entry_chunk).read_text() + "\n// marker\n")

    monkeypatch.setattr(ds, "STATIC_NUXT", static_dir / "_nuxt")
    monkeypatch.setattr(ds, "SRC_NUXT", src_dir)

    def boom(*a, **k):
        raise ds.patch_dashboard.PatchError("simulated anchor failure")

    monkeypatch.setattr(ds.patch_dashboard, "patch", boom)

    with pytest.raises(ds.patch_dashboard.PatchError):
        ds.cmd_deploy(_Args())

    assert (static_dir / "_nuxt" / entry_chunk).read_bytes() == pre_deploy_bytes


def test_revert_of_entry_chunk_is_atomic_on_repatch_failure(ds, tmp_path, monkeypatch):
    """Same invariant as the deploy test above, for `revert`: a failed re-patch must
    leave the shipped entry chunk exactly as it was before the revert attempt, and
    propagate the error."""
    static_dir = tmp_path / "static"
    entry_chunk, static_dir = _copy_patched_static_dir(ds, static_dir)
    # Simulate a bad prior state that's about to be reverted.
    corrupted = (static_dir / "_nuxt" / entry_chunk).read_text(encoding="utf-8") + "\n// oops\n"
    (static_dir / "_nuxt" / entry_chunk).write_text(corrupted, encoding="utf-8")
    pre_revert_bytes = (static_dir / "_nuxt" / entry_chunk).read_bytes()

    monkeypatch.setattr(ds, "STATIC_NUXT", static_dir / "_nuxt")

    def boom(*a, **k):
        raise ds.patch_dashboard.PatchError("simulated anchor failure")

    monkeypatch.setattr(ds.patch_dashboard, "patch", boom)

    with pytest.raises(ds.patch_dashboard.PatchError):
        ds.cmd_revert(_Args(file=entry_chunk))

    assert (static_dir / "_nuxt" / entry_chunk).read_bytes() == pre_revert_bytes


def _rebind_default(func, static_nuxt):
    """Wraps one of classify_chunks/parse_routes/find_entry_chunk/
    build_reverse_import_graph so its own `static_nuxt` parameter defaults to
    `static_nuxt` instead of the real STATIC_NUXT captured at module-def time. Needed
    because `cmd_extract` calls all four with no arguments, and Python binds default
    parameter values once when the function is defined - monkeypatching the module-level
    `ds.STATIC_NUXT` constant alone does NOT redirect those zero-argument calls. The
    wrapper still accepts an explicit positional argument (as these functions call each
    other internally, e.g. classify_chunks calling `find_entry_chunk(static_nuxt)`), in
    which case it's used as-is instead of the rebound default."""
    def wrapper(sn=static_nuxt):
        return func(sn)
    return wrapper


def test_extract_feeds_entry_chunk_from_a_temp_unpatched_copy(ds, tmp_path, monkeypatch):
    """`extract` must never invoke wakaru/prettier on the live (patched) entry chunk -
    it has to feed a temp, stripped copy instead - while every other chunk is fed
    straight from STATIC_NUXT. run_wakaru/run_prettier are monkeypatched so no
    npx/network call happens; only tmp copies are touched, never the real jesse/static
    or dashboard/src."""
    manifest = json.loads(ds.MANIFEST_PATH.read_text())
    real_entry_chunk = ds.find_entry_chunk()
    other_fname = next(f for f in manifest if f != real_entry_chunk)

    static_dir = tmp_path / "static"
    (static_dir / "_nuxt").mkdir(parents=True)
    shutil.copyfile(ds.STATIC_NUXT.parent / "index.html", static_dir / "index.html")
    shutil.copyfile(ds.STATIC_NUXT / real_entry_chunk, static_dir / "_nuxt" / real_entry_chunk)
    shutil.copyfile(ds.STATIC_NUXT / other_fname, static_dir / "_nuxt" / other_fname)
    tmp_static_nuxt = static_dir / "_nuxt"

    src_dir = tmp_path / "src_nuxt"
    src_dir.mkdir()
    manifest_path = tmp_path / "manifest.json"
    manifest_path.write_text("{}")
    index_path = tmp_path / "INDEX.md"

    monkeypatch.setattr(ds, "classify_chunks", _rebind_default(ds.classify_chunks, tmp_static_nuxt))
    monkeypatch.setattr(ds, "parse_routes", _rebind_default(ds.parse_routes, tmp_static_nuxt))
    monkeypatch.setattr(ds, "find_entry_chunk", _rebind_default(ds.find_entry_chunk, tmp_static_nuxt))
    monkeypatch.setattr(ds, "build_reverse_import_graph", _rebind_default(ds.build_reverse_import_graph, tmp_static_nuxt))
    monkeypatch.setattr(ds, "STATIC_NUXT", tmp_static_nuxt)
    monkeypatch.setattr(ds, "SRC_NUXT", src_dir)
    monkeypatch.setattr(ds, "MANIFEST_PATH", manifest_path)
    monkeypatch.setattr(ds, "INDEX_PATH", index_path)

    seen = {}

    def fake_run_wakaru(src, dst):
        # Capture the source path and its bytes NOW - if `src` lives under a
        # TemporaryDirectory (the entry-chunk case), it may be gone by the time this
        # test asserts on it.
        seen[dst.name] = (src, src.read_bytes())
        dst.write_bytes(src.read_bytes())
        return True, ""

    def fake_run_prettier(path):
        return True, ""

    monkeypatch.setattr(ds, "run_wakaru", fake_run_wakaru)
    monkeypatch.setattr(ds, "run_prettier", fake_run_prettier)

    rc = ds.cmd_extract(_Args())
    assert rc == 0

    # Non-entry chunk: wakaru fed straight from the shipped file.
    other_src, _ = seen[other_fname]
    assert other_src == tmp_static_nuxt / other_fname

    # Entry chunk: wakaru fed from a temp path holding the UNPATCHED content, never the
    # live shipped (patched) file.
    entry_src, entry_bytes = seen[real_entry_chunk]
    assert entry_src != tmp_static_nuxt / real_entry_chunk
    expected_unpatched = ds.patch_dashboard.strip_patch(
        (tmp_static_nuxt / real_entry_chunk).read_text(encoding="utf-8")
    ).encode("utf-8")
    assert entry_bytes == expected_unpatched

    written_manifest = json.loads(manifest_path.read_text())
    assert set(written_manifest) == {real_entry_chunk, other_fname}
