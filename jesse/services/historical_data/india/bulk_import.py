"""Bulk whole-market session import for India daily-bars-as-1m storage (story #8, D3).

The per-symbol importer (`jesse.modes.import_candles_mode._run`) pages one symbol at a
time - correct, but wasteful for India: every session's whole-market bhavcopy/index
file already contains every ticker's bar, so importing N symbols the same way
re-downloads (or re-parses, without the disk cache) the same file N times. This module
is the whole-market counterpart: `import_sessions` walks the requested session range,
fetching each session's file exactly once via `IndiaExchangeProvider.
fetch_session_bars` (cached on disk by default - see archive_cache.py), then adjusts
and stores every ticker's series.

`_build_range` is the shared "fetch this range and build (but don't store) adjusted
candles per symbol" step - `import_sessions` calls it once per chunk (see
`IMPORT_CHUNK_SESSIONS`), and `adjustment_state.refresh_adjustments` calls it once per
stale symbol's full stored range so it can build the complete replacement before
touching the database at all (see that module for why). Both reuse
`IndiaExchangeProvider.adjusted_candles_for_ticker` (`_bars_to_candles` underneath), so
there is exactly one split/bonus-adjustment code path between the per-symbol and bulk
importers (D7's "adjusted only as of import time" caveat, and the corporate-action
re-adjustment story #8 introduces in adjustment_state.py, both apply identically).
"""
from collections.abc import Callable, Iterable
from dataclasses import dataclass, field
from datetime import date, timedelta

import jesse.helpers as jh
from jesse.repositories import candle_repository

from ..contracts import HistoricalCandle
from ..errors import HistoricalDataError
from .adjustment_state import record_adjustment_state, refresh_adjustments
from .archive_cache import ArchiveFileCache
from .provider import IndiaExchangeProvider
from .sources import DailyBar
from .symbols import to_jesse_symbol

# Standard on-disk location for `import_sessions`'s default archive cache, under the
# calling project's storage directory (mirrors Jesse's existing `storage/...`
# convention - see e.g. jesse/services/cache.py's `storage/temp/`). Relative, like every
# other `storage/` path in this codebase: resolved against the current working
# directory, which Jesse always runs from the project root.
DEFAULT_ARCHIVE_CACHE_DIR = 'storage/india-archives'

# `import_sessions` processes the requested range in chunks of this many CALENDAR days
# (not real trading sessions - a chunk therefore holds AT MOST this many sessions, and
# fewer whenever it spans a weekend/holiday, which is a fine approximation for the
# purpose here) rather than building the whole requested range - possibly years - in
# memory before writing anything. Two benefits: memory stays bounded regardless of how
# long a range is requested, and each chunk's rows are committed to storage before the
# next chunk is even fetched, so a failure partway through a long range still leaves
# every earlier chunk's data safely persisted instead of losing the whole run.
IMPORT_CHUNK_SESSIONS = 31


@dataclass
class ImportSummary:
    """Result of one `import_sessions` call."""

    sessions_processed: int = 0
    sessions_unpublished: int = 0
    rows_stored: int = 0
    symbols_seen: set[str] = field(default_factory=set)
    adjustment_warnings: dict[str, list[str]] = field(default_factory=dict)
    # Tickers whose candles could not be built in at least one chunk (e.g. the
    # corporate-actions API was unavailable) - message per ticker. That ticker's
    # sessions in every OTHER chunk are still stored; see `import_sessions`'s
    # docstring for why such a ticker's adjustment state is deliberately left alone.
    failed_tickers: dict[str, str] = field(default_factory=dict)
    # Symbols `refresh_adjustments` additionally re-imported because a corporate action
    # changed a signature this same call had already touched (see `import_sessions`'s
    # `check_adjustments` parameter) - not required by the story, but cheap to surface
    # so a caller can tell "freshly imported" apart from "re-imported for adjustment".
    reimported_symbols: list[str] = field(default_factory=list)
    # Symbols `refresh_adjustments` tried to re-import but couldn't (message per
    # symbol) - their old rows/signature are left untouched, to be retried next run.
    failed_adjustments: dict[str, str] = field(default_factory=dict)


@dataclass
class _RangeBuildResult:
    """What `_build_range` produces for one date range - candles per symbol, ready to
    store, but NOT stored yet (see `_build_range`'s docstring for why that split
    matters to `adjustment_state.refresh_adjustments`).
    """

    candles_by_symbol: dict[str, list[HistoricalCandle]] = field(default_factory=dict)
    adjustment_warnings: dict[str, list[str]] = field(default_factory=dict)
    # ticker (not symbol - a ticker that fails before it even resolves to a symbol,
    # e.g. an ambiguous one, still needs to be reported) -> failure message.
    failed_tickers: dict[str, str] = field(default_factory=dict)
    sessions_processed: int = 0
    sessions_unpublished: int = 0


def _build_range(
    provider: IndiaExchangeProvider,
    start_date: date,
    end_date: date,
    wanted_symbols: set[str] | None,
    *,
    progress: Callable[[date], None] | None = None,
) -> _RangeBuildResult:
    """Fetch every Mon-Fri session in `[start_date, end_date]` and build adjusted
    candles per Jesse symbol, WITHOUT storing anything - the shared "fetch + adjust"
    step reused by both `import_sessions` (once per chunk) and
    `adjustment_state.refresh_adjustments` (once per stale symbol's full stored range).
    Callers decide what to do with the result; this function never touches the
    database.

    A ticker whose symbol resolution or candle-building raises a `HistoricalDataError`
    (e.g. an ambiguous ticker, or the corporate-actions API being unavailable) is
    recorded in `.failed_tickers` and simply excluded from `.candles_by_symbol` - one
    bad ticker never aborts the whole range.
    """
    result = _RangeBuildResult()
    bars_by_ticker: dict[str, list[DailyBar]] = {}

    current = start_date
    while current <= end_date:
        if current.weekday() < 5:  # Mon-Fri only - matches sessions.py's own rule
            day_bars = provider.fetch_session_bars(current)
            if day_bars is None:
                result.sessions_unpublished += 1
            else:
                result.sessions_processed += 1
                for ticker, bar in day_bars.items():
                    bars_by_ticker.setdefault(ticker, []).append(bar)
        if progress is not None:
            progress(current)
        current += timedelta(days=1)

    for ticker, bars in bars_by_ticker.items():
        try:
            symbol = to_jesse_symbol(ticker)
            if wanted_symbols is not None and symbol not in wanted_symbols:
                continue
            candles = provider.adjusted_candles_for_ticker(symbol, ticker, bars)
        except HistoricalDataError as exc:
            # Covers both an ambiguous ticker (`to_jesse_symbol`) and a candle-building
            # failure (e.g. `ProviderUnavailableError` fetching corporate actions) -
            # either way this ticker's sessions in this range are simply skipped.
            result.failed_tickers[ticker] = str(exc)
            jh.debug(f'India bulk import: skipped {ticker!r} for {start_date}..{end_date} - {exc}')
            continue

        result.candles_by_symbol[symbol] = candles
        warnings = provider.adjustment_warnings(symbol)
        if warnings:
            result.adjustment_warnings[symbol] = warnings

    return result


def _chunk_date_range(start_date: date, end_date: date, chunk_days: int) -> Iterable[tuple[date, date]]:
    """Yield consecutive inclusive `(chunk_start, chunk_end)` sub-ranges of at most
    `chunk_days` calendar days each, covering `[start_date, end_date]`.
    """
    current = start_date
    while current <= end_date:
        chunk_end = min(current + timedelta(days=chunk_days - 1), end_date)
        yield current, chunk_end
        current = chunk_end + timedelta(days=1)


def import_sessions(
    exchange: str,
    start_date: date,
    end_date: date,
    symbols: Iterable[str] | None = None,
    *,
    provider: IndiaExchangeProvider | None = None,
    progress: Callable[[date], None] | None = None,
    check_adjustments: bool = True,
) -> ImportSummary:
    """Import every NSE/BSE session in `[start_date, end_date]` (inclusive) as one
    09:59 UTC 1m row per ticker per session (D3).

    `symbols`, when given, restricts which Jesse symbols are actually stored - every
    session's whole-market file is still fetched/parsed in full regardless (a session
    file has no per-ticker query), so filtering only affects what gets written.
    `None` (the default) stores every ticker found, including indices (stored raw, per
    D7 - see `IndiaDailySource.is_index`).

    `provider` is injectable (e.g. a test double, or one wired with a test
    `ArchiveFileCache`); when omitted, a fresh `IndiaExchangeProvider` backed by the
    standard on-disk archive cache at `storage/india-archives` is built.

    The range is processed in `IMPORT_CHUNK_SESSIONS`-day chunks via `_build_range`
    (see its docstring for the per-ticker failure handling). A symbol whose ticker
    failed in ANY chunk does NOT get its adjustment state recorded at the end: its
    stored history is only a partial replacement of what a full re-import would have
    produced, so recording state now would wrongly tell `refresh_adjustments` this
    symbol is already fully up to date, hiding the gap instead of retrying it.

    `check_adjustments` skips the final `refresh_adjustments` call entirely - useful
    for a caller that wants a plain bulk import with no adjustment-state side effects
    (e.g. a test, or a one-off backfill that will call it separately).
    """
    if provider is None:
        provider = IndiaExchangeProvider(exchange, cache=ArchiveFileCache(DEFAULT_ARCHIVE_CACHE_DIR))

    wanted_symbols = set(symbols) if symbols is not None else None
    summary = ImportSummary()
    clean_symbols: set[str] = set()
    dirty_symbols: set[str] = set()

    for chunk_start, chunk_end in _chunk_date_range(start_date, end_date, IMPORT_CHUNK_SESSIONS):
        result = _build_range(provider, chunk_start, chunk_end, wanted_symbols, progress=progress)
        summary.sessions_processed += result.sessions_processed
        summary.sessions_unpublished += result.sessions_unpublished

        for ticker, message in result.failed_tickers.items():
            summary.failed_tickers[ticker] = message
            try:
                dirty_symbols.add(to_jesse_symbol(ticker))
            except HistoricalDataError:
                pass  # the ticker itself was unresolvable - never had a symbol to mark dirty

        for symbol, candles in result.candles_by_symbol.items():
            candle_repository.store_observed_candles(exchange, symbol, '1m', candles)
            summary.rows_stored += len(candles)
            summary.symbols_seen.add(symbol)
            clean_symbols.add(symbol)

        for symbol, warnings in result.adjustment_warnings.items():
            summary.adjustment_warnings[symbol] = warnings

    fully_stored_symbols = clean_symbols - dirty_symbols

    # Order matters here: `refresh_adjustments` decides whether a symbol is stale by
    # comparing its CURRENTLY STORED signature against a fresh one - so it must run
    # BEFORE this call records anything, not after. Recording first would always
    # overwrite that stored signature with the fresh one first, making every symbol
    # look "unchanged" and silently defeating the whole re-adjustment mechanism for a
    # symbol whose corporate actions changed somewhere in its OLDER (not-just-touched)
    # history. `refresh_adjustments` atomically replaces (and itself records the final
    # signature for) every symbol it finds stale; only the remaining, already-current
    # symbols still need a plain record here.
    if check_adjustments and fully_stored_symbols:
        refresh_result = refresh_adjustments(exchange, fully_stored_symbols, provider=provider)
        summary.reimported_symbols = refresh_result.reimported
        summary.failed_adjustments = refresh_result.failed
    already_current_symbols = [
        symbol for symbol in fully_stored_symbols if symbol not in summary.reimported_symbols
    ]
    for symbol in already_current_symbols:
        record_adjustment_state(exchange, symbol, provider.adjustment_signature(symbol))

    return summary
