#!/usr/bin/env python3
"""Manage `dashboard/src/`, a readable (wakaru-unminified + prettier-formatted) mirror of
the compiled Nuxt 3 dashboard shipped in `jesse/static/_nuxt/`.

Why this exists: `jesse/static/_nuxt/*.js` is Vite/Rollup output (minified, one-letter
identifiers, no source maps, no upstream .vue sources in this repo) that the dashboard-v1
repo produces at build time. This tool lets us edit that bundle in place: keep a readable
copy of the "APP" chunks (the ones that actually contain Jesse dashboard code, as opposed to
vendor library code) under version control, edit *that*, then `deploy` the edited file back
over the minified original. Because Vite's loader (see docs/dashboard-bundle/REVERSE_ENGINEERING.md)
does no hash/integrity/manifest checking, a hand-edited file with the same name loads exactly
like the original build output.

Subcommands: status | deploy | revert | extract. Run `dashboard_src.py <cmd> --help` for
per-command options. Only Python stdlib is used; `extract` shells out to `npx @wakaru/cli`
and `npx prettier` (dev-only tools, not repo dependencies) and to `node --check`.

Which tool owns what (see docs/dashboard-bundle/PATCHING.md and dashboard/README.md for
the full rationale): `scripts/patch_dashboard.py` owns inserting extra pages (Universe
Scan, Portfolio, ...) into the entry chunk's route table/nav and owns every generated
`*-page.js` chunk outright. This script's mirror always represents the entry chunk's
UNPATCHED upstream content - every read/hash/compare of the shipped entry chunk below
goes through `patch_dashboard.strip_patch()` first (see `_strip_patch_if_entry` and its
callers), and generated `*-page.js` chunks are excluded from classification entirely
(they're never "APP" or "VENDOR" here, they're just not this mirror's concern).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
STATIC_NUXT = REPO_ROOT / "jesse" / "static" / "_nuxt"
SRC_DIR = REPO_ROOT / "dashboard" / "src"
SRC_NUXT = SRC_DIR / "_nuxt"
MANIFEST_PATH = SRC_DIR / "manifest.json"
INDEX_PATH = SRC_DIR / "INDEX.md"

# Both scripts live under scripts/; import patch_dashboard.py by inserting this file's
# own directory (not the caller's cwd or sys.path[0]) so this works whether the module
# is run directly (`python scripts/dashboard_src.py`), imported via `-m`, or loaded by
# path from a test (`importlib.util.spec_from_file_location`, which does NOT add the
# script's directory to sys.path the way a normal `python <script>` invocation does).
_SCRIPTS_DIR = Path(__file__).resolve().parent
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))
import patch_dashboard  # noqa: E402  (path insert must happen first)

# Tool versions this pipeline was last verified against (`extract` prints the versions it
# actually finds; this is just a sanity reference for README/INDEX generation).
WAKARU_PKG = "@wakaru/cli@latest"
PRETTIER_PKG = "prettier@latest"

# ---------------------------------------------------------------------------
# Classification: APP (Jesse dashboard code) vs VENDOR (Vue/Nuxt/Nuxt-UI/reka-ui/Monaco/
# charting/fonts). See dashboard/README.md "How chunks are classified" for the rationale.
# Heuristics are content-based and intentionally conservative: default to VENDOR unless a
# file contains a Jesse-specific signal (a real backend API path literal it calls, a Pinia
# store defined for one of Jesse's own domains, or a component name that isn't part of the
# Nuxt UI / reka-ui / Vue vendor catalog shipped in this bundle).
# ---------------------------------------------------------------------------

# Real Jesse backend API path prefixes (collected by grepping every chunk for backtick
# string literals starting with "/" and cross-checking against jesse/controllers/*).
# Deliberately excludes vendor-infra-looking paths seen in the same grep that are NOT
# Jesse endpoints: `/api/_nuxt_icon` (nuxt-icon module), `/node_modules`, `/html`, `/index`,
# `/lsp-config`, `/invalid/` (Monaco/tsserver worker internals).
API_PATH_RE = re.compile(
    r"`(/(?:auth|backtest|candles|closed-trades|config|data-providers|download|"
    r"exchange|exchange-api-keys|live|monte-carlo|notification|notification-api-keys|"
    r"optimization|orders|period-templates|route-templates|significance-test|"
    r"strategies|strategy|system|tabs|universe-scan|ws)[^`]*)`"
)

# Pinia's `defineStore(id, {state: ...})` call shape, minified to `<fn>(\`id\`,{state:...})`.
# Any match means the chunk defines one of Jesse's own stores (Pinia itself is vendor, but
# every store *definition* in this bundle is app state-management code, not library code).
STORE_DEF_RE = re.compile(r"`([a-zA-Z][a-zA-Z0-9_-]*)`,\{state:")

# Compiled Vue SFCs keep their source component name as `__name:\`ComponentName\`` in the
# options object (used by devtools/warnings) - this survives minification since it's a
# literal string, not an identifier, so it's the most reliable per-chunk content signal.
NAME_RE = re.compile(r"__name:`([A-Za-z0-9_]+)`")

# Route table entries in the entry chunk: `name:\`x\`,path:\`/y\`,component:()=>Y(()=>import(\`./Z.js\`)`
ROUTE_RE = re.compile(
    r"name:`([a-zA-Z0-9_-]*)`,path:`([^`]*)`,component:\(\)=>[A-Za-z_$]*\(\(\)=>import\(`\./([^`]+)`\)"
)

# Names emitted by @nuxt/ui (all prefixed `U<Capital>`, e.g. UButton/UCard/USelectMenu) and by
# reka-ui's headless primitives (grouped by widget family below) plus a couple of Vue/Nuxt
# built-ins. Collected by inspecting every `__name:` string across the whole bundle and
# cross-referencing against the public component catalogs of @nuxt/ui and reka-ui - anything
# NOT in this set is either a Jesse-authored component or a reka-ui internal helper we missed,
# and is treated as an app-name signal by is_vendor_name() below.
VENDOR_NAMES = {
    "ActionListItem", "Arrow", "BaseSeparator", "Separator", "BubbleSelect",
    "CheckboxIndicator", "CheckboxRoot",
    "ComboboxAnchor", "ComboboxArrow", "ComboboxCancel", "ComboboxContent", "ComboboxContentImpl",
    "ComboboxEmpty", "ComboboxGroup", "ComboboxInput", "ComboboxItem", "ComboboxItemIndicator",
    "ComboboxLabel", "ComboboxPortal", "ComboboxRoot", "ComboboxSeparator", "ComboboxTrigger",
    "ComboboxVirtualizer",
    "ConfigProvider",
    "DialogClose", "DialogContent", "DialogContentImpl", "DialogContentModal", "DialogContentNonModal",
    "DialogDescription", "DialogOverlay", "DialogOverlayImpl", "DialogPortal", "DialogRoot",
    "DialogTitle", "DialogTrigger",
    "DismissableLayer", "DismissableLayerBranch",
    "FocusProxy", "FocusScope",
    "HoverCardArrow", "HoverCardContent", "HoverCardContentImpl", "HoverCardPortal", "HoverCardRoot",
    "HoverCardTrigger",
    "Label",
    "ListboxContent", "ListboxFilter", "ListboxGroup", "ListboxItem", "ListboxItemIndicator",
    "ListboxRoot", "ListboxVirtualizer",
    "PopoverAnchor", "PopoverArrow", "PopoverClose", "PopoverContent", "PopoverContentImpl",
    "PopoverContentModal", "PopoverContentNonModal", "PopoverPortal", "PopoverRoot", "PopoverTrigger",
    "PopperAnchor", "PopperArrow", "PopperContent", "PopperRoot",
    "ProgressIndicator", "ProgressRoot", "ProgressStatusText",
    "RovingFocusItem",
    "SelectArrow", "SelectContent", "SelectContentImpl", "SelectGroup", "SelectItem",
    "SelectItemAlignedPosition", "SelectItemIndicator", "SelectItemText", "SelectLabel",
    "SelectPopperPosition", "SelectPortal", "SelectProvider", "SelectRoot", "SelectSeparator",
    "SelectTrigger", "SelectValue", "SelectViewport",
    "SwitchRoot", "SwitchThumb",
    "ToastAction", "ToastAnnounce", "ToastAnnounceExclude", "ToastClose", "ToastDescription",
    "ToastPortal", "ToastProvider", "ToastRoot", "ToastRootImpl", "ToastTitle", "ToastViewport",
    "Tooltip", "TooltipArrow", "TooltipContent", "TooltipContentHoverable", "TooltipContentImpl",
    "TooltipPortal", "TooltipProvider", "TooltipRoot", "TooltipTrigger",
    "VisuallyHidden", "VisuallyHiddenInput", "VisuallyHiddenInputBubble",
    "Teleport",  # Vue built-in
    "UApp", "UOverlayProvider",
}


# Vue/vue-router/pinia runtime chunk and its export-name -> Vue-API mapping, as they were at
# the time this dashboard/src/ was last extracted (see write_index()'s "Vue runtime alias map"
# section for the caveats). Hand-verified by cross-referencing compiled render-function call
# shapes against several chunks' own `import{...}from"./<runtime chunk>"` lines - there is no
# source map to derive this from mechanically, and it is NOT stable across an upstream rebuild
# (every alias is independently re-picked by esbuild/Rollup each build), so this is a snapshot,
# not something `extract` recomputes.
VUE_RUNTIME_CHUNK = "CoKk4mC0.js"
VUE_ALIAS_MAP = [
    ("openBlock", "mt", "`(d(),m(l,{key:0}))` v-if pattern in 3+ files, `d` always traces back to export `mt`"),
    ("createElementBlock", "b", "`d(),s(\\`div\\`,M,[...])` - `s`->`b` in CZ3SG3_I2.js, CZymKofZ2.js, KhqzbbC32.js"),
    ("createBlock", "v", "`(d(),m(l,{key:0}))` - `m`->`v` in CZ3SG3_I2.js; classic v-if-with-key shape"),
    ("createVNode", "D", "component calls `(type,props,null,patchFlag,dynamicProps)`, e.g. `e(i,{modelValue:...},null,8,[...])`"),
    ("createElementVNode", "_", "plain-tag calls `o(\\`div\\`,F,[...])` / `a(\\`span\\`,z,d(t),1)` (element, not component)"),
    ("createTextVNode", "E", "`t(\\` some text \\`,-1)` hoisted static text pattern (`,-1` = hoisted flag)"),
    ("createCommentVNode", "y", "`g(\\`\\`,!0)` - the standard v-if=false placeholder"),
    ("toDisplayString", "nr", "`a(\\`span\\`,z,d(t),1)` interpolation pattern, patch flag `1`=TEXT"),
    ("withCtx", "qt", "`{default:p(()=>[...])}` slot-function wrapper, universal across every SFC chunk"),
    ("resolveComponent", "St", "`ce=ee(\\`router-link\\`)` in Nav's render - only used for globally-registered components"),
    ("ref", "vn", "long chains of `let a=V(!1)`, `M=g([])` etc. - always a bare-value wrapper immediately used as `.value`"),
    ("computed", "g", "`l=j(()=>t.hasLivePluginInstalled)` - getter-only reactive wrapper"),
    ("onMounted", "ct", "`O(()=>{document.documentElement.classList.add(...)})` at app.vue's setup tail"),
    ("unref", "On", "`i(N)` used to read a possibly-ref value inline"),
    ("isRef", "un", "`m(N)?N.value=e:null` - the compiler's isRef(x)?x.value=$event:null v-model guard"),
    ("Fragment", "o", "root-level `E(L,null,[...])` = createElementBlock(Fragment,null,[...]) in Nav's render"),
    ("defineComponent", "k", "`P({__name:\\`Nav\\`,setup...})` - the `{__name,...,setup}` object-wrapper pattern for every compiled SFC"),
]


def is_vendor_name(name: str) -> bool:
    if name in VENDOR_NAMES:
        return True
    # @nuxt/ui components are exported as `U<Capital>...` (UButton, UCard, USelectMenu, ...).
    return len(name) > 1 and name[0] == "U" and name[1].isupper()


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ---------------------------------------------------------------------------
# patch_dashboard.py interop: the mirror always represents the entry chunk's UNPATCHED
# upstream content (patch_dashboard.py owns inserting pages into it - see the module
# docstring). Every place below that reads/hashes/compares a shipped `_nuxt/*.js` file
# routes through these two helpers instead of touching `path.read_text()`/`read_bytes()`
# directly, so the page-injection patch is transparently stripped back out whenever
# `path` is the entry chunk and left alone for every other chunk.
# ---------------------------------------------------------------------------

def _strip_patch_if_entry(text: str, fname: str, entry_chunk: str | None) -> str:
    """`strip_patch(text)` if `fname` is the entry chunk, else `text` unchanged. Safe to
    call on already-unpatched text (patch_dashboard.strip_patch is a no-op when none of
    its markers are present)."""
    if entry_chunk is not None and fname == entry_chunk:
        return patch_dashboard.strip_patch(text)
    return text


def read_shipped_text(path: Path, entry_chunk: str | None) -> str:
    """A shipped `_nuxt/*.js` chunk's text as `dashboard/src/` should see it: unpatched,
    even if `path` currently carries patch_dashboard's page-injection patch. Read-only,
    analysis-purpose text (classification, route/import-graph parsing) - decodes with
    errors="replace" like the rest of this module's pre-existing text reads, which is
    fine here since nothing derived from it is ever written back to disk. Anything that
    IS written back to disk must go through `unpatched_shipped_bytes` instead, which
    decodes strictly."""
    return _strip_patch_if_entry(path.read_text(errors="replace"), path.name, entry_chunk)


def _unpatch_bytes_if_entry(data: bytes, fname: str, entry_chunk: str | None) -> bytes:
    """`strip_patch`'s bytes-in-bytes-out form: `data` unpatched if `fname` is the entry
    chunk, else `data` unchanged. `strip_patch` operates on `str`, so this decodes
    strictly (errors="strict", the default) rather than read_shipped_text's lossy
    errors="replace" - a genuinely non-UTF-8 shipped file must fail loudly here
    (UnicodeDecodeError) instead of silently replacing bytes, since callers of this
    function (sha256_shipped, original_chunk_bytes, extract's fallback writes) either
    hash the result against a recorded sha256 or write it straight back to disk, where a
    silent lossy substitution would corrupt the output undetected."""
    if entry_chunk is not None and fname == entry_chunk:
        return patch_dashboard.strip_patch(data.decode("utf-8")).encode("utf-8")
    return data


def unpatched_shipped_bytes(path: Path, entry_chunk: str | None) -> bytes:
    """Byte-exact UNPATCHED content of a shipped `_nuxt/*.js` chunk, suitable to write
    straight back to disk (unlike `read_shipped_text`, which is lossy and read-only)."""
    return _unpatch_bytes_if_entry(path.read_bytes(), path.name, entry_chunk)


def sha256_shipped(path: Path, entry_chunk: str | None) -> str:
    """sha256 of a shipped chunk's UNPATCHED content - what every manifest
    `original_sha256` is recorded against."""
    return hashlib.sha256(unpatched_shipped_bytes(path, entry_chunk)).hexdigest()


def classify_chunks(static_nuxt: Path = STATIC_NUXT) -> dict:
    """Classify every `_nuxt/*.js` chunk as APP or VENDOR.

    Returns {filename: {"kind": "APP"|"VENDOR", "reasons": [...], "names": [...],
                         "stores": [...], "paths": [...]}}.
    CSS, fonts, images and the nuxt-monaco-editor/ vendored metadata directory are out of
    scope (not JS chunks) and are not included here. Generated `*-page.js` chunks
    (`patch_dashboard.PAGES`) are excluded outright, never classified APP or VENDOR:
    they're owned by patch_dashboard.py, not this mirror, regardless of whether their
    current template content happens to trip one of the APP signals below (e.g. quoting
    a `/universe-scan`-prefixed path - today it doesn't, since the templates use plain
    string literals rather than the backtick literals API_PATH_RE looks for, but that's
    an incidental fact about the current templates, not something this classifier
    should ever depend on).
    """
    entry_chunk = find_entry_chunk(static_nuxt)
    generated_chunk_names = {page.chunk_name for page in patch_dashboard.PAGES}
    out = {}
    for f in sorted(static_nuxt.glob("*.js")):
        if f.name in generated_chunk_names:
            continue
        text = read_shipped_text(f, entry_chunk)
        paths = sorted(set(API_PATH_RE.findall(text)))
        stores = sorted(set(STORE_DEF_RE.findall(text)))
        app_names = sorted({n for n in NAME_RE.findall(text) if not is_vendor_name(n)})
        reasons = []
        if paths:
            reasons.append(f"calls Jesse API path {paths[0]!r}")
        if stores:
            reasons.append(f"defines Pinia store(s) {stores}")
        if app_names:
            reasons.append(f"has non-vendor component name(s) {app_names[:5]}")
        kind = "APP" if reasons else "VENDOR"
        if kind == "VENDOR":
            reasons = ["no Jesse-specific API path / store / component name found"]
        out[f.name] = {
            "kind": kind,
            "reasons": reasons,
            "names": app_names,
            "stores": stores,
            "paths": paths,
        }
    return out


def parse_routes(static_nuxt: Path = STATIC_NUXT) -> list[tuple[str, str, str]]:
    r"""Find the entry chunk (the one containing the route table) by content, and parse its
    `name:\`x\`,path:\`/y\`,component:()=>...import(\`./Z.js\`)` route records.

    Returns a list of (route_name, route_path, chunk_filename). Reads the entry chunk in
    its unpatched form (see `read_shipped_text`), so patch_dashboard's injected routes
    (`/universe-scan`, `/portfolio`, ...) never show up here - those pages' source lives
    under `jesse/dashboard_patches/`, not this mirror.
    """
    entry_chunk = find_entry_chunk(static_nuxt)
    for f in static_nuxt.glob("*.js"):
        text = read_shipped_text(f, entry_chunk)
        if "path:`/significance-test`" in text or "path:`/backtest`" in text:
            return ROUTE_RE.findall(text)
    return []


def find_entry_chunk(static_nuxt: Path = STATIC_NUXT) -> str | None:
    index_html = static_nuxt.parent / "index.html"
    if index_html.exists():
        m = re.search(r'"#entry"\s*:\s*"/_nuxt/([^"]+)"', index_html.read_text(errors="replace"))
        if m:
            return m.group(1)
    return None


IMPORT_RE = re.compile(r'from"\./([\w.$-]+\.js)"')
DYNAMIC_IMPORT_RE = re.compile(r"import\(`\./([\w.$-]+\.js)`\)")


def build_reverse_import_graph(static_nuxt: Path = STATIC_NUXT) -> dict:
    """importee filename -> set of importer filenames, scanning every chunk's static and
    dynamic `./X.js` import specifiers (relative imports only, which is all Vite emits
    within `_nuxt/`). Reads the entry chunk unpatched, so its dynamic imports of the
    generated page chunks (owned by patch_dashboard.py, not this mirror) aren't
    included."""
    entry_chunk = find_entry_chunk(static_nuxt)
    reverse: dict[str, set] = {}
    for f in static_nuxt.glob("*.js"):
        text = read_shipped_text(f, entry_chunk)
        importees = set(IMPORT_RE.findall(text)) | set(DYNAMIC_IMPORT_RE.findall(text))
        for imp in importees:
            reverse.setdefault(imp, set()).add(f.name)
    return reverse


def routes_for_chunk(chunk: str, routes: list, reverse_graph: dict, entry_chunk: str | None) -> list[str]:
    """BFS backward through the import graph from `chunk` to find which routed page
    chunk(s) transitively load it. Falls back to '(app shell)' if only the entry chunk
    reaches it (loaded on every route) and to '(unresolved)' if nothing does."""
    route_by_chunk = {c: p for _, p, c in routes}
    if chunk in route_by_chunk:
        return [route_by_chunk[chunk]]
    if chunk == entry_chunk:
        return ["(app shell, all routes)"]
    seen = {chunk}
    frontier = [chunk]
    found = set()
    while frontier:
        nxt = []
        for node in frontier:
            for importer in reverse_graph.get(node, ()):
                if importer in seen:
                    continue
                seen.add(importer)
                if importer in route_by_chunk:
                    found.add(route_by_chunk[importer])
                elif importer == entry_chunk:
                    found.add("(app shell, all routes)")
                else:
                    nxt.append(importer)
        frontier = nxt
    return sorted(found) if found else ["(unresolved - not reachable from any route)"]


def describe(fname: str, info: dict, route_paths: list[str]) -> str:
    bits = []
    if info["stores"]:
        bits.append(f"Pinia store `{', '.join(info['stores'])}`")
    if info["names"]:
        bits.append(", ".join(info["names"][:4]))
    if info["paths"]:
        bits.append(f"calls `{info['paths'][0]}`")
    label = "; ".join(bits) if bits else "app chunk"
    return f"{label} (routes: {', '.join(route_paths)})"


# ---------------------------------------------------------------------------
# Export-name comparison: wakaru's identifier-renaming pass can silently collide two
# distinct locals onto the same alias and drop one of a chunk's public exports (see
# dashboard/README.md "Known issue" - this is what originally surfaced the bug on
# B8_r5oP7.js). Every chunk in this bundle only uses `export{a as B,...}` (Vite/Rollup's
# only output shape here - confirmed by grepping every _nuxt/*.js chunk), but `export
# default <expr>` and `export const/function/class NAME` are also valid ESM export forms
# a hand-edit could introduce, so they're covered too for robustness.
# ---------------------------------------------------------------------------

EXPORT_BRACE_RE = re.compile(r"export\s*\{([^}]*)\}", re.DOTALL)
EXPORT_DEFAULT_BARE_RE = re.compile(r"export\s+default\b")
EXPORT_DECL_RE = re.compile(r"export\s+(?:const|let|var|function\*?|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)")


def export_names(text: str) -> set[str]:
    """The set of externally-visible export names of a JS module (its public API surface -
    what an `import{...}from"./this.js"` elsewhere in the bundle can bind to). Works on both
    the original minified chunk and its wakaru+prettier readable form, since `export{a as
    B}` survives prettier reformatting (incl. across multiple lines) unchanged."""
    names: set[str] = set()
    for block in EXPORT_BRACE_RE.findall(text):
        for item in block.split(","):
            item = item.strip()
            if not item:
                continue
            # `local as Exported` binds under the alias; a bare `local` re-exports itself.
            names.add(item.rsplit(" as ", 1)[-1].strip() if " as " in item else item)
    if EXPORT_DEFAULT_BARE_RE.search(text):
        names.add("default")
    names.update(EXPORT_DECL_RE.findall(text))
    return names


def diff_export_names(original_text: str, other_text: str) -> tuple[bool, set[str], set[str]]:
    """Compare two versions of the same chunk's source. Returns (matches, only_in_original,
    only_in_other) - a mismatch means `other_text` is not a safe drop-in replacement for
    `original_text` (some importer relying on a name in `only_in_original` would break)."""
    orig = export_names(original_text)
    other = export_names(other_text)
    return orig == other, orig - other, other - orig


def read_git_head_blob(relpath: str) -> bytes | None:
    """Content of `relpath` as committed at HEAD, or None if git can't produce it (path
    doesn't exist at HEAD, not a git repo, etc). Shared by `revert` and `deploy`'s
    export-safety check."""
    proc = subprocess.run(
        ["git", "-C", str(REPO_ROOT), "show", f"HEAD:{relpath}"], capture_output=True,
    )
    return proc.stdout if proc.returncode == 0 else None


def original_chunk_bytes(fname: str, entry: dict, entry_chunk: str | None) -> bytes | None:
    """The shipped chunk's UNPATCHED content as it was when `extract` last recorded
    `entry` (`original_sha256`), independent of whatever's on disk right now. Prefers the
    current `jesse/static/_nuxt/<fname>` (cheap, no subprocess) and only falls back to the
    git HEAD blob if that file has since changed out from under the manifest (e.g. an
    upstream "Update frontend" landed) - `deploy`'s export check needs to compare against
    the exact bytes wakaru/prettier actually ran on, not against a chunk that may have
    moved on. Both sources are stripped of patch_dashboard's page-injection patch first if
    `fname` is the entry chunk: on disk it's normally patched (the committed, shipped
    state), and the git HEAD blob is too (the patch is part of what's committed) - neither
    holds the manifest's unpatched `original_sha256` verbatim once the bundle is patched.
    Returns None if neither source's sha256 matches `entry["original_sha256"]` (can't verify)."""
    shipped = STATIC_NUXT / fname
    if shipped.exists():
        data = unpatched_shipped_bytes(shipped, entry_chunk)
        if hashlib.sha256(data).hexdigest() == entry["original_sha256"]:
            return data
    data = read_git_head_blob(f"jesse/static/_nuxt/{fname}")
    if data is not None:
        data = _unpatch_bytes_if_entry(data, fname, entry_chunk)
        if hashlib.sha256(data).hexdigest() == entry["original_sha256"]:
            return data
    return None


# ---------------------------------------------------------------------------
# extract
# ---------------------------------------------------------------------------

def run_wakaru(src: Path, dst: Path) -> tuple[bool, str]:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        dst.unlink()  # wakaru refuses to overwrite an existing output file
    proc = subprocess.run(
        ["npx", "--yes", WAKARU_PKG, str(src), "-o", str(dst), "--diagnostics"],
        capture_output=True, text=True,
    )
    return proc.returncode == 0 and dst.exists(), proc.stdout + proc.stderr


def run_prettier(path: Path) -> tuple[bool, str]:
    proc = subprocess.run(
        ["npx", "--yes", PRETTIER_PKG, "--write", "--parser", "babel", str(path)],
        capture_output=True, text=True,
    )
    return proc.returncode == 0, proc.stdout + proc.stderr


def cmd_extract(args) -> int:
    classification = classify_chunks()
    app_files = sorted(f for f, info in classification.items() if info["kind"] == "APP")
    routes = parse_routes()
    entry_chunk = find_entry_chunk()
    reverse_graph = build_reverse_import_graph()

    SRC_NUXT.mkdir(parents=True, exist_ok=True)
    old_manifest = {}
    if MANIFEST_PATH.exists():
        old_manifest = json.loads(MANIFEST_PATH.read_text())

    manifest = {}
    wakaru_failed = []
    export_mismatches = []
    skipped_edited = []
    for fname in app_files:
        dst = SRC_NUXT / fname
        prior = old_manifest.get(fname)
        if dst.exists() and prior and sha256_file(dst) != prior.get("readable_sha256") and not args.force:
            skipped_edited.append(fname)
            manifest[fname] = prior  # keep the existing (edited) entry untouched
            continue
        src = STATIC_NUXT / fname
        # unpatched_shipped_bytes strips patch_dashboard's page-injection patch back out
        # of the entry chunk (its only shipped touch point) - the mirror always
        # represents the UNPATCHED upstream bundle, never whatever's currently patched on
        # disk. Byte-exact (strict utf-8 decode) rather than read_shipped_text's lossy
        # errors="replace", since this is what gets fed to wakaru and, on any fallback
        # path below, written straight back to disk as dashboard/src's own content - a
        # lossy decode here would silently corrupt that output instead of failing loudly.
        original_bytes = unpatched_shipped_bytes(src, entry_chunk)
        original_text = original_bytes.decode(errors="replace")  # for export-name diffing only
        mode, reason = "wakaru", None
        if fname == entry_chunk:
            # wakaru/prettier shell out by file path, so they'd unminify whatever is
            # physically on disk (patched) unless fed an unpatched copy explicitly.
            with tempfile.TemporaryDirectory() as tmp_dir:
                wakaru_src = Path(tmp_dir) / fname
                wakaru_src.write_bytes(original_bytes)
                ok, log = run_wakaru(wakaru_src, dst)
        else:
            ok, log = run_wakaru(src, dst)
        if not ok:
            wakaru_failed.append(fname)
            dst.write_bytes(original_bytes)  # fallback: prettier-format the (unpatched) original directly
            mode, reason = "prettier-only", "wakaru command failed"
        prettier_ok, plog = run_prettier(dst)
        if not prettier_ok:
            print(f"WARNING: prettier failed on {fname}:\n{plog}", file=sys.stderr)
        if mode == "wakaru":
            matches, only_orig, only_readable = diff_export_names(original_text, dst.read_text(errors="replace"))
            if not matches:
                # wakaru's rename pass changed the chunk's public API (e.g. collided two
                # locals onto one alias and dropped an export - see README "Known issue").
                # Formatting-only regeneration can't do that, so fall back to it and treat
                # the wakaru output as unsafe to deploy.
                export_mismatches.append(fname)
                dst.write_bytes(original_bytes)
                prettier_ok2, plog2 = run_prettier(dst)
                if not prettier_ok2:
                    print(f"WARNING: prettier failed on {fname}:\n{plog2}", file=sys.stderr)
                mode = "prettier-only"
                reason = (f"wakaru changed exported names (only in original: {sorted(only_orig)}, "
                          f"only in wakaru output: {sorted(only_readable)})")
                # Sanity re-check: a plain prettier pass is formatting-only, so this should
                # always match. If it doesn't, export_names() itself needs updating for a
                # new export shape - it's not evidence the file is unsafe.
                matches2, only_orig2, only_other2 = diff_export_names(original_text, dst.read_text(errors="replace"))
                if not matches2:
                    print(f"WARNING: export mismatch persisted after prettier-only fallback for {fname} "
                          f"(only in original: {sorted(only_orig2)}, only in readable: {sorted(only_other2)}) "
                          "- likely a bug in export_names(), not an unsafe file.", file=sys.stderr)
                    reason += " [WARNING: mismatch persisted after prettier-only regen]"
        manifest[fname] = {
            "original_sha256": hashlib.sha256(original_bytes).hexdigest(),
            "readable_sha256": sha256_file(dst),
            "mode": mode,
        }
        if reason:
            manifest[fname]["reason"] = reason

    # Drop stale entries for files that are no longer classified as APP.
    manifest = {f: v for f, v in manifest.items() if f in app_files}

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
    write_index(classification, app_files, routes, entry_chunk, reverse_graph, manifest)

    mode_counts: dict[str, int] = {}
    for entry in manifest.values():
        mode_counts[entry["mode"]] = mode_counts.get(entry["mode"], 0) + 1
    print(f"Classified {len(classification)} JS chunks: {len(app_files)} APP, "
          f"{len(classification) - len(app_files)} VENDOR.")
    print(f"Modes: {mode_counts}")
    if wakaru_failed:
        print(f"wakaru command failed on {len(wakaru_failed)} chunk(s), fell back to prettier-only: {wakaru_failed}")
    if export_mismatches:
        print(f"wakaru changed exported names on {len(export_mismatches)} chunk(s), fell back to "
              f"prettier-only: {export_mismatches}")
    if skipped_edited:
        print(f"Skipped {len(skipped_edited)} locally-edited readable file(s) (use --force to overwrite): {skipped_edited}")
    return 0


def write_index(classification, app_files, routes, entry_chunk, reverse_graph, manifest):
    lines = [
        "# dashboard/src index (generated by `scripts/dashboard_src.py extract`)",
        "",
        "Do not hand-edit this file - it is regenerated by `extract`.",
        "",
        f"Tools: `npx {WAKARU_PKG}` (unminify) + `npx {PRETTIER_PKG}` (format).",
        "",
        "## APP chunks",
        "",
        "`Mode` is `wakaru` (unminified + formatted) unless the export-name check described in"
        " dashboard/README.md's \"Known issue\" section caught wakaru changing the chunk's public"
        " API, in which case it's `prettier-only` (formatting-only, semantics-preserving) - hover"
        " the reason in `dashboard/src/manifest.json`.",
        "",
        "| File | Components (`__name`) | Pinia store | Route(s) | Mode | Description |",
        "|---|---|---|---|---|---|",
    ]
    for fname in app_files:
        info = classification[fname]
        rps = routes_for_chunk(fname, routes, reverse_graph, entry_chunk)
        names = ", ".join(info["names"]) or "-"
        stores = ", ".join(info["stores"]) or "-"
        entry = manifest.get(fname, {})
        mode = entry.get("mode", "-")
        if mode == "prettier-only" and entry.get("reason"):
            mode = f"prettier-only ({entry['reason']})"
        lines.append(
            f"| `{fname}` | {names} | {stores} | {', '.join(rps)} | {mode} | {describe(fname, info, rps)} |"
        )

    lines += [
        "",
        "## Vendor chunks",
        "",
        "Everything else under `jesse/static/_nuxt/*.js` not listed above: Vue 3 runtime +"
        " vue-router + pinia (+ pinia-plugin-persistedstate), @nuxt/ui components, reka-ui"
        " headless primitives, the Monaco editor bundle and its web workers"
        " (`nuxt-monaco-editor/`), charting libraries, and Nuxt/Vite runtime glue"
        " (`__vitePreload`, icon loader, etc). Not mirrored under `dashboard/src/` - edit"
        " these only by upgrading the dashboard-v1 build, not by hand.",
        "",
        f"VENDOR chunk count: {sum(1 for v in classification.values() if v['kind'] == 'VENDOR')}.",
        "",
        "CSS (`*.css`), fonts (`*.ttf`), and images (`*.svg`/`*.png`) under `_nuxt/` are out"
        " of scope for this tool (not JS chunks) and are left untouched in `jesse/static/`.",
        "",
        "## Vue runtime alias map",
        "",
        "The Vue 3 + vue-router + pinia (+ pinia-plugin-persistedstate) runtime chunk"
        " re-exports its whole API under short, per-build minified names - every other chunk"
        " imports a subset under its own, independently-minified local alias, so the same Vue"
        " function has a different one-letter name in nearly every file. Only the export names"
        " on the right of `as` below (`CoKk4mC0.js`'s own `export{}` statement) are stable"
        " across the whole bundle. This table is evidence-based (cross-referencing compiled"
        " template call shapes against import lines, not a source map - none exists) and is"
        " hand-verified for the runtime chunk present at the time of this extraction; it is"
        " NOT regenerated automatically by `extract` (would need call-shape triangulation,"
        " not just grepping `export{}`) and it changes on every upstream \"Update frontend\"",
        "",
        f"Runtime chunk at this extraction: `{VUE_RUNTIME_CHUNK}`.",
        "",
        "| Vue API | export name | Evidence |",
        "|---|---|---|",
    ] + [f"| `{api}` | `{alias}` | {evidence} |" for api, alias, evidence in VUE_ALIAS_MAP] + [
        "",
    ]
    if entry_chunk:
        lines.insert(4, f"Entry chunk (`#entry` in index.html): `{entry_chunk}`.\n")
    INDEX_PATH.write_text("\n".join(lines) + "\n")


# ---------------------------------------------------------------------------
# status / deploy / revert
# ---------------------------------------------------------------------------

def load_manifest() -> dict:
    if not MANIFEST_PATH.exists():
        print(f"No manifest at {MANIFEST_PATH} - run `extract` first.", file=sys.stderr)
        sys.exit(1)
    return json.loads(MANIFEST_PATH.read_text())


def cmd_status(args) -> int:
    manifest = load_manifest()
    entry_chunk = find_entry_chunk()
    edited = []
    shipped_changed = []
    for fname, entry in sorted(manifest.items()):
        readable = SRC_NUXT / fname
        shipped = STATIC_NUXT / fname
        if readable.exists() and sha256_file(readable) != entry["readable_sha256"]:
            edited.append(fname)
        # sha256_shipped strips patch_dashboard's page-injection patch back out of the
        # entry chunk first - manifest's original_sha256 is always the UNPATCHED hash,
        # so comparing raw on-disk bytes here would permanently report the entry chunk
        # as "changed" even when nothing but the (expected, committed) patch differs.
        if shipped.exists() and sha256_shipped(shipped, entry_chunk) != entry["original_sha256"]:
            shipped_changed.append(fname)

    conflicts = sorted(set(edited) & set(shipped_changed))
    print(f"Edited readable file(s) since extraction: {len(edited)}")
    for f in edited:
        print(f"  M {f}")
    print(f"Shipped file(s) changed since extraction (e.g. 'Update frontend'): {len(shipped_changed)}")
    for f in shipped_changed:
        print(f"  U {f}")
    if conflicts:
        print(f"CONFLICT: {len(conflicts)} file(s) changed on BOTH sides - re-apply your edit "
              f"after `extract --force` for these: {conflicts}")
    if not edited and not shipped_changed:
        print("Clean: dashboard/src matches manifest, jesse/static matches manifest.")
    return 1 if conflicts else 0


def node_check(path: Path) -> tuple[bool, str]:
    proc = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
    return proc.returncode == 0, proc.stdout + proc.stderr


def cmd_deploy(args) -> int:
    manifest = load_manifest()
    entry_chunk = find_entry_chunk()
    targets = args.files or [
        f for f, entry in manifest.items()
        if (SRC_NUXT / f).exists() and sha256_file(SRC_NUXT / f) != entry["readable_sha256"]
    ]
    if not targets:
        print("Nothing to deploy: no edited readable files (pass filenames explicitly to force a redeploy).")
        return 0

    deployed = []
    for fname in targets:
        entry = manifest.get(fname)
        if entry is None:
            print(f"SKIP {fname}: not a tracked APP chunk (see dashboard/src/manifest.json)", file=sys.stderr)
            continue
        readable = SRC_NUXT / fname
        if not readable.exists():
            print(f"SKIP {fname}: {readable} does not exist", file=sys.stderr)
            continue
        ok, log = node_check(readable)
        if not ok:
            print(f"REFUSE {fname}: node --check failed:\n{log}", file=sys.stderr)
            continue
        # Export-name safety net (no --force override - unlike the conflict check below,
        # there's no valid reason to ship a file that changed the chunk's public API; that's
        # exactly the wakaru bug this check exists to catch, see README "Known issue").
        original_bytes = original_chunk_bytes(fname, entry, entry_chunk)
        if original_bytes is None:
            print(f"REFUSE {fname}: can't locate the original shipped chunk content to verify "
                  f"exported names (neither jesse/static nor git HEAD matches manifest's "
                  f"original_sha256)", file=sys.stderr)
            continue
        matches, only_orig, only_readable = diff_export_names(
            original_bytes.decode(errors="replace"), readable.read_text()
        )
        if not matches:
            print(f"REFUSE {fname}: export names differ from the original shipped chunk (only in "
                  f"original: {sorted(only_orig)}, only in readable file: {sorted(only_readable)}) "
                  f"- this would silently break an importer; no --force override for this check", file=sys.stderr)
            continue
        shipped = STATIC_NUXT / fname
        shipped_changed = shipped.exists() and sha256_shipped(shipped, entry_chunk) != entry["original_sha256"]
        if shipped_changed and not args.force:
            print(f"REFUSE {fname}: shipped file changed since extraction (conflict) - "
                  f"use --force to overwrite anyway", file=sys.stderr)
            continue
        # The readable mirror always holds the entry chunk's UNPATCHED content, so
        # deploying it is a two-step operation: overwrite the shipped file, then
        # immediately re-apply patch_dashboard's page-injection patch (idempotent) so
        # Universe Scan/Portfolio don't silently vanish from the router/sidebar. Snapshot
        # whatever was shipped before the overwrite so a failed re-patch (a PatchError -
        # e.g. a future "Update frontend" changed the anchor shape - or any other
        # exception) can be rolled back instead of leaving the entry chunk unpatched on
        # disk; the exception is then re-raised so the caller sees the failure.
        original_shipped_bytes = shipped.read_bytes() if fname == entry_chunk and shipped.exists() else None
        shutil.copyfile(readable, shipped)
        if fname == entry_chunk:
            try:
                patch_dashboard.patch(STATIC_NUXT.parent, check=False)
            except Exception:
                if original_shipped_bytes is not None:
                    shipped.write_bytes(original_shipped_bytes)
                else:
                    shipped.unlink(missing_ok=True)
                raise
        deployed.append(fname)

    print(f"Deployed {len(deployed)} file(s): {deployed}")
    return 0 if deployed or not targets else 1


def cmd_revert(args) -> int:
    fname = args.file
    data = read_git_head_blob(f"jesse/static/_nuxt/{fname}")
    if data is None:
        print(f"git show failed for jesse/static/_nuxt/{fname}", file=sys.stderr)
        return 1
    entry_chunk = find_entry_chunk()
    if entry_chunk is not None and fname == entry_chunk:
        # HEAD's committed entry chunk is itself patched (patch_dashboard's page
        # insertions are part of the committed bundle, not a local-only overlay - see
        # dashboard/README.md). Strip that patch back out of the HEAD content, write the
        # unpatched form, then re-derive and reapply the patch fresh against whatever's
        # currently under jesse/static/_nuxt (the Vue-runtime chunk's resolved export
        # alias, the page templates, ...) instead of trusting HEAD's own patched bytes
        # verbatim - byte-identical to the committed chunk in the common case, but this
        # stays correct even if something else under jesse/static/ moved independently
        # since HEAD. Invariant: after revert, the entry chunk equals master's committed
        # patched chunk (`patch_dashboard.py --check` passes).
        target = STATIC_NUXT / fname
        # Snapshot whatever was on disk before the write below, so a failed re-patch (a
        # PatchError, or any other exception) can be rolled back instead of leaving the
        # entry chunk unpatched; the exception is then re-raised so the caller sees it.
        original_bytes = target.read_bytes() if target.exists() else None
        unpatched_head = patch_dashboard.strip_patch(data.decode("utf-8"))
        target.write_text(unpatched_head, encoding="utf-8")
        try:
            patch_dashboard.patch(STATIC_NUXT.parent, check=False)
        except Exception:
            if original_bytes is not None:
                target.write_bytes(original_bytes)
            else:
                target.unlink(missing_ok=True)
            raise
    else:
        (STATIC_NUXT / fname).write_bytes(data)
    print(f"Reverted jesse/static/_nuxt/{fname} to HEAD.")
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("status", help="show edited/changed files vs manifest.json")

    p_deploy = sub.add_parser("deploy", help="copy edited readable file(s) over the shipped minified chunk(s)")
    p_deploy.add_argument("files", nargs="*", help="chunk filenames to deploy (default: all edited)")
    p_deploy.add_argument("--force", action="store_true", help="deploy even if the shipped file changed since extraction")

    p_revert = sub.add_parser("revert", help="restore a shipped chunk to its committed (HEAD) content")
    p_revert.add_argument("file", help="chunk filename under jesse/static/_nuxt/")

    p_extract = sub.add_parser("extract", help="regenerate dashboard/src from current jesse/static")
    p_extract.add_argument("--force", action="store_true", help="overwrite locally-edited readable files")

    args = parser.parse_args(argv)
    return {
        "status": cmd_status,
        "deploy": cmd_deploy,
        "revert": cmd_revert,
        "extract": cmd_extract,
    }[args.command](args)


if __name__ == "__main__":
    raise SystemExit(main())
