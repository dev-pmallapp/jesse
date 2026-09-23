"""Corporate-action re-adjustment detection for stored India daily-as-1m history
(story #8). Split/bonus adjustment (story #7, D7) is only ever applied against the
corporate actions known AT IMPORT TIME - see provider.py's and corporate_actions.py's
module docstrings. This module is what actually keeps a symbol's stored history
correct after the fact: `record_adjustment_state` fingerprints the actions a symbol was
just imported against, and `refresh_adjustments` later compares that fingerprint to the
symbol's CURRENT one, re-importing exactly the symbols whose known actions have changed
since - e.g. a split/bonus announced after the symbol's history was first imported.
"""
from collections.abc import Iterable
from dataclasses import dataclass, field

import jesse.helpers as jh
from jesse.models.IndiaAdjustmentState import IndiaAdjustmentState
from jesse.repositories import candle_repository
from jesse.services.db import database

from .archive_cache import DEFAULT_ARCHIVE_CACHE_DIR, ArchiveFileCache
from .provider import IndiaExchangeProvider
from .symbols import to_exchange_ticker

@dataclass
class RefreshAdjustmentsResult:
    """Result of one `refresh_adjustments` call."""

    reimported: list[str] = field(default_factory=list)
    # symbol -> failure message, for a stale symbol whose FULL replacement candle set
    # could not be built (e.g. the corporate-actions API was unavailable) - its old
    # rows and old (stale) signature are left exactly as they were, so the next
    # `refresh_adjustments` call retries it.
    failed: dict[str, str] = field(default_factory=dict)


def record_adjustment_state(exchange: str, symbol: str, signature: str) -> None:
    """Upsert the corporate-action signature `symbol`'s just-imported history was
    adjusted against - called after every successful India import (per-symbol `_run`
    via import_candles_mode's post-import hook, and `import_sessions` for every symbol
    it touches) so a later `refresh_adjustments` call has something to compare against.
    """
    now = jh.now_to_timestamp()
    IndiaAdjustmentState.insert(
        exchange=exchange, symbol=symbol, signature=signature, adjusted_as_of=now,
    ).on_conflict(
        conflict_target=[IndiaAdjustmentState.exchange, IndiaAdjustmentState.symbol],
        preserve=(IndiaAdjustmentState.signature, IndiaAdjustmentState.adjusted_as_of),
    ).execute()


def refresh_adjustments(
    exchange: str,
    symbols: Iterable[str] | None = None,
    *,
    provider: IndiaExchangeProvider | None = None,
) -> RefreshAdjustmentsResult:
    """Re-import every stored India symbol (restricted to `symbols` when given) whose
    `IndiaExchangeProvider.adjustment_signature` no longer matches what it was last
    imported against.

    For each stale symbol, the COMPLETE replacement candle set is built first (via
    `bulk_import._build_range`, over the symbol's full previously-stored date range -
    cheap thanks to `provider`'s on-disk archive cache, archive_cache.py, which serves
    every session that hasn't changed straight from disk). Only once that build has
    fully succeeded are the symbol's old rows deleted, the new rows stored, and the new
    signature recorded - all inside ONE database transaction, so a crash or exception
    between those three steps can never leave a symbol with its old rows deleted but no
    replacement (or replacement rows with a stale signature still recorded). If the
    build itself fails (any `HistoricalDataError` - e.g. the corporate-actions API is
    unavailable right now), the symbol's old rows AND old signature are left completely
    untouched, so it simply stays "stale" and gets retried the next time this runs;
    the failure is logged via `jh.debug` and recorded in the result's `.failed`, and
    every other stale symbol is still attempted.

    Deliberately NOT batched across symbols (each stale symbol re-fetches its own
    whole-market session files independently, even though two stale symbols on the
    same exchange over an overlapping range fetch the same files) - an accepted cost
    for now; the on-disk cache already makes each of those re-fetches a local read
    rather than a network call.
    """
    # Imported here, not at module load time, to avoid a cycle: bulk_import.py imports
    # `record_adjustment_state`/`refresh_adjustments` from this module at ITS module
    # load time, so this module can't import bulk_import.py back at load time too.
    from .bulk_import import _build_range

    if provider is None:
        provider = IndiaExchangeProvider(exchange, cache=ArchiveFileCache(DEFAULT_ARCHIVE_CACHE_DIR))

    stored_symbols = candle_repository.get_stored_symbols(exchange)
    if symbols is not None:
        wanted = set(symbols)
        stored_symbols = [symbol for symbol in stored_symbols if symbol in wanted]

    result = RefreshAdjustmentsResult()
    for symbol in stored_symbols:
        state = IndiaAdjustmentState.get_or_none(
            (IndiaAdjustmentState.exchange == exchange) & (IndiaAdjustmentState.symbol == symbol)
        )
        current_signature = provider.adjustment_signature(symbol)
        if state is None or state.signature == current_signature:
            # No recorded signature to compare against (e.g. a symbol whose import
            # just finished this instant - the caller records its current, correct
            # signature right after import; see `import_sessions`), or the signature is
            # unchanged since the last import - either way, nothing to redo here.
            continue

        first_timestamp, latest_timestamp = candle_repository.get_candle_timestamp_bounds(exchange, symbol, '1m')
        if first_timestamp is None or latest_timestamp is None:
            # Defensive: `get_stored_symbols` and this lookup aren't transactionally
            # consistent - a symbol deleted out from under us in between is simply
            # skipped rather than treated as an error.
            continue

        start_date = jh.timestamp_to_arrow(first_timestamp).date()
        end_date = jh.timestamp_to_arrow(latest_timestamp).date()
        ticker = to_exchange_ticker(symbol)

        # Build the COMPLETE replacement first, without touching the database at all -
        # see this function's docstring for why the database is only ever touched
        # after a full, successful build.
        build = _build_range(provider, start_date, end_date, {symbol})
        if ticker in build.failed_tickers or symbol not in build.candles_by_symbol:
            message = build.failed_tickers.get(ticker, 'no candles were built for the requested range')
            jh.debug(
                f'India refresh_adjustments: keeping {symbol!r} on {exchange!r} stale - rebuild failed: {message}'
            )
            result.failed[symbol] = message
            continue  # old rows and old signature untouched - retried on the next run

        # India only ever stores 1m rows (D3: one row per session) - deleting "all
        # timeframes" for this exchange/symbol is exactly deleting its 1m rows, since
        # no other timeframe is ever persisted for it. One atomic transaction (the
        # project's peewee pattern - see e.g. jesse/repositories/live_chart_repository.py)
        # so delete+store+record either all happen or none do.
        with database.db.atomic():
            candle_repository.delete_candles_from_db(exchange, symbol)
            candle_repository.store_observed_candles(exchange, symbol, '1m', build.candles_by_symbol[symbol])
            record_adjustment_state(exchange, symbol, current_signature)
        result.reimported.append(symbol)

    return result
