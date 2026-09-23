"""Bridges a pluggable `IndiaDailySource` (NSE/BSE archive or broker) into Jesse's
generic `HistoricalCandleProvider` contract, per D1/D3 in docs/india-markets/PLAN.md.

Registered as the `NSE`/`BSE` Jesse exchanges (story #9) via the no-arg
`NseProvider`/`BseProvider` subclasses in `exchange_providers.py` - see
`jesse/info.py`'s `exchange_info` and
`jesse/modes/import_candles_mode/drivers/__init__.py`'s `historical_provider_classes`.

Split/bonus adjustment (story #7, D7): a source's raw bars are, by construction, never
retroactively adjusted for a later corporate action (see every `IndiaDailySource`
subclass's `prices_adjusted` docstring) - so when a request asks for
`AdjustmentMode.SPLIT_ADJUSTED`, `_bars_to_candles` multiplies each pre-ex-date bar's
O/H/L/C by the security's cumulative split/bonus factor (and divides its volume by the
same factor) itself, using `CorporateActionsStore`. Adjustment is applied ONLY as of
import time: if a symbol's history was already imported and a new split/bonus is
announced afterwards, its already-stored bars are not retroactively touched by this
module alone - `adjustment_signature` (below) is what story #8's
`adjustment_state.refresh_adjustments` uses to detect that a symbol's known actions
have changed since its last import and re-import it.
"""
import hashlib
from collections.abc import Sequence
from datetime import date
from threading import Lock

import jesse.helpers as jh

from ..contracts import (
    AdjustmentMode,
    HistoricalCandle,
    HistoricalCandleBatch,
    HistoricalCandleProvider,
    HistoricalCandleRequest,
    ProviderCapabilities,
    SymbolCatalogEntry,
)
from .archive_cache import ArchiveFileCache
from .corporate_actions import CorporateActionsStore
from .nse_archives import NseBhavcopySource
from .sessions import next_session_row_timestamp, session_dates_in_range, session_row_timestamp
from .sources import DailyBar, IndiaDailySource, create_source
from .symbols import to_exchange_ticker

# `adjustment_signature` (story #8) returns this fixed marker - instead of a sha256
# digest of actual actions - for a symbol that is never adjusted at all (an index, or a
# source whose prices already come pre-adjusted): there is nothing to fingerprint, and
# this value can never collide with a real digest, so "permanently unadjusted" is never
# confused with "adjusted against zero currently-known actions" (an empty action list
# still hashes to a real, if unremarkable, digest).
UNADJUSTED_SIGNATURE_MARKER = 'unadjusted'

# Split/bonus factors are frequently non-terminating fractions (e.g. a 3:1 bonus is
# exactly 0.25, but a 5:2 bonus is 2/7 = 0.2857...); NSE/BSE prices themselves never
# carry more than 2 decimal places, so rounding the adjusted result to 4 keeps ample
# precision while not pretending the multiplication produced a more exact price than it
# did (and keeps repeated re-adjustment idempotent up to float noise).
_ADJUSTED_PRICE_DECIMALS = 4

# One CorporateActionsStore shared by every IndiaExchangeProvider in the process (unless
# a caller injects its own, e.g. for tests) - NSE's corporate-actions API is keyed by
# ISIN, not by exchange, so the NSE and BSE providers both adjusting against the same
# fetched actions is correct, not just an optimization: a BSE-only price series for a
# dual-listed company must see the same NSE-sourced actions an NSE price series does.
_shared_corporate_actions_store: CorporateActionsStore | None = None
_shared_corporate_actions_store_lock = Lock()


def _default_corporate_actions_store() -> CorporateActionsStore:
    global _shared_corporate_actions_store
    with _shared_corporate_actions_store_lock:
        if _shared_corporate_actions_store is None:
            _shared_corporate_actions_store = CorporateActionsStore()
        return _shared_corporate_actions_store


# One NseBhavcopySource shared by every IndiaExchangeProvider in the process, used ONLY
# to resolve a BSE security's ISIN back to its NSE trading symbol (fix-up A, story #7) -
# never as an actual candle source. A dedicated instance rather than reusing whatever
# NSE source a caller happens to be running (an NseCompositeSource's own internal
# NseBhavcopySource, say): a BSE-only provider process has no NSE source at all to
# borrow one from.
_shared_nse_symbol_master: NseBhavcopySource | None = None
_shared_nse_symbol_master_lock = Lock()


def _default_nse_symbol_master() -> NseBhavcopySource:
    global _shared_nse_symbol_master
    with _shared_nse_symbol_master_lock:
        if _shared_nse_symbol_master is None:
            _shared_nse_symbol_master = NseBhavcopySource()
        return _shared_nse_symbol_master


# import_candles_mode requires a finite max_candles_per_request (it raises ValueError
# otherwise - see jesse/modes/import_candles_mode/__init__.py:~274). Expressed as one
# calendar month of 1m slots, matching the existing crypto providers' pattern, even
# though these sources only ever produce one candle per session: with one row per
# session, a "page" of this size holds at most ~23 real candles (one per trading day
# in the month). Actual importer paging against this sparse-1m-per-session shape is
# revisited in story #8.
INDIA_MAX_CANDLES_PER_REQUEST = 31 * 24 * 60


class IndiaExchangeProvider(HistoricalCandleProvider):
    """One NSE/BSE-style exchange, backed by whichever `IndiaDailySource` it is given.

    Every trading session is stored as a single 1m candle stamped at 15:29 IST (D3):
    the sparse-market engine already aggregates isolated 1m rows into correct 1D/1W
    candles, so no India-specific replay/aggregation change is needed.
    """

    def __init__(
        self,
        exchange: str,
        source: IndiaDailySource | None = None,
        *,
        corporate_actions_store: CorporateActionsStore | None = None,
        nse_symbol_master: NseBhavcopySource | None = None,
        cache: ArchiveFileCache | None = None,
    ) -> None:
        # `cache` (story #8's on-disk archive cache) is forwarded to `create_source`
        # only when this provider builds its own default source - an explicitly
        # injected `source` is trusted to already be wired however its caller wanted.
        self._source = source if source is not None else create_source(exchange, cache=cache)
        self.provider_id = exchange
        self.source_id = self._source.source_id
        self.prices_adjusted = self._source.prices_adjusted
        # Injectable for tests; defaults to the one store every India provider in the
        # process shares (see `_default_corporate_actions_store`).
        self._corporate_actions_store = (
            corporate_actions_store if corporate_actions_store is not None else _default_corporate_actions_store()
        )
        # Injectable for tests; only ever consulted for a non-NSE source (see
        # `_resolve_nse_symbol`) - defaults to the one shared master every India
        # provider in the process reuses (see `_default_nse_symbol_master`).
        self._nse_symbol_master = (
            nse_symbol_master if nse_symbol_master is not None else _default_nse_symbol_master()
        )
        # Symbols this instance has already logged an unadjusted-bars warning for (see
        # `_warn_unadjusted`) - keeps a long-running process from re-logging the same
        # warning on every single fetch for a symbol whose ISIN/actions are permanently
        # unknown, while `adjustment_warnings` itself always reflects the current state.
        self._warned_symbols: set[str] = set()
        self._adjustment_warnings: dict[str, list[str]] = {}
        # A per-instance attribute (not the shared class default) because ticker_search
        # depends on whether *this* source overrides list_symbol_entries - two providers
        # backed by different sources must not share one capabilities object.
        # D7: SPLIT_ADJUSTED is only offered when the source itself hands back raw
        # prices (`prices_adjusted` False, true of every India source today) - Jesse has
        # nothing to adjust, and no way to safely re-derive raw prices, for a source
        # that already returns adjusted ones.
        source_needs_adjustment = not self._source.prices_adjusted
        self.capabilities = ProviderCapabilities(
            native_timeframes=('1m',),
            max_candles_per_request=INDIA_MAX_CANDLES_PER_REQUEST,
            ticker_search=_has_symbol_catalog(self._source),
            adjustment_modes=(AdjustmentMode.SPLIT_ADJUSTED,) if source_needs_adjustment else (),
            default_adjustment_mode=AdjustmentMode.SPLIT_ADJUSTED if source_needs_adjustment else AdjustmentMode.NONE,
        )

    def _fetch_candles(self, request: HistoricalCandleRequest) -> HistoricalCandleBatch:
        ticker = to_exchange_ticker(request.symbol)
        sessions = session_dates_in_range(request.requested_range)
        bars = self._source.fetch_daily_bars(ticker, sessions)

        candles = [
            candle
            for candle in self._bars_to_candles(request.symbol, ticker, bars, request.adjustment_mode)
            if (
                request.requested_range.start_timestamp
                <= candle.timestamp
                < request.requested_range.end_timestamp
            )
            # Defensive: only sessions inside the requested range should ever reach
            # here, but a source must never be trusted to have respected that itself.
        ]

        next_available_timestamp = None
        if not candles:
            # No bar landed in range (e.g. an all-weekend range, or every session in it
            # was a holiday); point the caller at the next weekday session row instead
            # of leaving them to guess where to resume.
            next_available_timestamp = next_session_row_timestamp(request.requested_range.end_timestamp)

        return HistoricalCandleBatch(
            request=request,
            candles=tuple(candles),
            next_available_timestamp=next_available_timestamp,
        )

    def adjusted_candles_for_ticker(
        self, symbol: str, ticker: str, bars: Sequence[DailyBar],
    ) -> list[HistoricalCandle]:
        """Bulk (story #8) counterpart to `fetch_candles`: turn bars a caller already
        has in hand (from `fetch_session_bars`, one whole session at a time) into
        adjusted candles, without a second round-trip through `_source.fetch_daily_bars`.
        Always uses this provider's `default_adjustment_mode` (mirrors what a single-
        symbol `fetch_candles` request would use by default) - `import_sessions`
        (bulk_import.py) is this method's only caller today.
        """
        return self._bars_to_candles(symbol, ticker, bars, self.capabilities.default_adjustment_mode)

    def adjustment_signature(self, symbol: str) -> str:
        """Fingerprint of the corporate actions currently known for `symbol` - story
        #8's `adjustment_state.refresh_adjustments` compares this against the signature
        recorded at import time to detect a split/bonus that was announced (or only
        became parseable) AFTER a symbol's history was already imported, and re-imports
        only the symbols whose signature has actually changed.

        Returns `UNADJUSTED_SIGNATURE_MARKER` when this symbol is never adjusted (an
        index, a source whose prices already come pre-adjusted, or a security whose
        ISIN/NSE symbol can't currently be resolved) - the exact same eligibility this
        provider's own adjustment math (`_resolve_adjustment`) uses, so a signature can
        never disagree with what was actually applied at import time. An unparsed
        corporate action is deliberately folded into the marker path too: `factor_before`
        is refused for such a symbol the same way it is for an unresolved identity (see
        `_resolve_adjustment`), so there is nothing usable to fingerprint either way.
        """
        ticker = to_exchange_ticker(symbol)
        isin, nse_symbol, apply_adjustment = self._resolve_adjustment(
            self.capabilities.default_adjustment_mode, symbol, ticker,
        )
        if not apply_adjustment:
            return UNADJUSTED_SIGNATURE_MARKER

        actions = self._corporate_actions_store.actions_for(isin, nse_symbol)
        # Sorted + deduped (a set of tuples) so the signature is order-independent and
        # stable across otherwise-equivalent re-fetches (e.g. CorporateActionsStore's
        # own dedup already collapses exact repeats, but the union order across
        # ISIN/symbol keys is not itself guaranteed - see its `actions_for` docstring).
        fingerprint = sorted(
            {(action.ex_date.isoformat(), action.kind, round(action.price_factor, 10)) for action in actions}
        )
        return hashlib.sha256(repr(fingerprint).encode()).hexdigest()

    def fetch_session_bars(self, session: date) -> dict[str, DailyBar] | None:
        """Bulk (story #8) counterpart to `fetch_candles`: every ticker's raw
        (unadjusted) bar for one whole-market session, keyed by exchange ticker -
        delegates to the underlying source's own `fetch_session_bars` (see
        `ArchiveDailySource`/`NseCompositeSource`). Used by `import_sessions`
        (bulk_import.py), which needs a whole session at once rather than one ticker at
        a time.
        """
        return self._source.fetch_session_bars(session)

    def _bars_to_candles(
        self, symbol: str, ticker: str, bars: Sequence[DailyBar], adjustment_mode: AdjustmentMode,
    ) -> list[HistoricalCandle]:
        """Shared math behind `_fetch_candles` and `adjusted_candles_for_ticker`: turn
        raw `bars` into one `HistoricalCandle` per bar, applying split/bonus adjustment
        (D7) when `adjustment_mode` and this symbol's identity/known-actions state both
        allow it (see `_resolve_adjustment`).
        """
        isin, nse_symbol, apply_adjustment = self._resolve_adjustment(adjustment_mode, symbol, ticker)

        candles = []
        for bar in bars:
            timestamp = session_row_timestamp(bar.session)
            open_price, high_price, low_price, close_price, volume = (
                bar.open, bar.high, bar.low, bar.close, bar.volume,
            )
            if apply_adjustment:
                factor = self._corporate_actions_store.factor_before(isin, nse_symbol, bar.session)
                if factor != 1.0:
                    open_price, high_price, low_price, close_price = _adjust_ohlc(
                        open_price, high_price, low_price, close_price, factor,
                    )
                    volume = volume / factor
            candles.append(
                HistoricalCandle(
                    timestamp=timestamp,
                    open=open_price,
                    high=high_price,
                    low=low_price,
                    close=close_price,
                    volume=volume,
                )
            )
        candles.sort(key=lambda candle: candle.timestamp)
        return candles

    def _resolve_adjustment(
        self, adjustment_mode: AdjustmentMode, symbol: str, ticker: str,
    ) -> tuple[str | None, str | None, bool]:
        """Whether `_bars_to_candles` should split/bonus-adjust `symbol`'s bars, and
        the (ISIN, NSE symbol) key pair to adjust them against - `CorporateActionsStore`
        matches on the union of both (see its docstring for why one key alone is not
        reliable: an ISIN can be reissued when a security's face value changes).

        Returns `(None, None, False)` immediately for `AdjustmentMode.NONE` or an index
        symbol (see `IndiaDailySource.is_index`) - neither is ever adjusted, so no
        lookup is even attempted. Otherwise resolves both keys and checks the store for
        any subject it could not parse under either: either an unresolvable security or
        an unparsed subject means the true cumulative factor cannot be trusted, so
        adjustment is refused (unadjusted bars, logged via `_warn_unadjusted`) rather
        than silently guessing.
        """
        if adjustment_mode is not AdjustmentMode.SPLIT_ADJUSTED:
            return None, None, False
        if self._source.is_index(ticker):
            return None, None, False

        # This call is a genuine adjustment-resolution attempt for `symbol` - reset its
        # warnings so `adjustment_warnings` reflects only this fetch, never a stale one
        # from an earlier call whose underlying problem may since have resolved itself
        # (fix D).
        self._adjustment_warnings[symbol] = []

        isin = self._source.isin_for(ticker)
        nse_symbol = self._resolve_nse_symbol(ticker, isin)
        if isin is None and nse_symbol is None:
            self._warn_unadjusted(symbol, 'unknown to NSE corporate actions (no ISIN or matching NSE symbol)')
            return None, None, False

        unparsed_subjects = self._corporate_actions_store.unparsed_for(isin, nse_symbol)
        if unparsed_subjects:
            self._warn_unadjusted(
                symbol, f'unparsed corporate-action subject(s) for {isin or nse_symbol}: {unparsed_subjects}'
            )
            return None, None, False

        return isin, nse_symbol, True

    def _resolve_nse_symbol(self, ticker: str, isin: str | None) -> str | None:
        """The NSE trading symbol to match corporate actions against, for `ticker`.

        An NSE-exchange source's own ticker already IS its NSE trading symbol - no
        lookup needed. A non-NSE (BSE) source has no such symbol of its own, so its
        ISIN is joined back to one through NSE's security master (`symbol_for_isin`);
        when that ISIN isn't listed on NSE at all (or is unknown), there is nothing to
        join with, so None - the caller falls back to ISIN-only matching (or, if the
        ISIN was also unknown, to `_warn_unadjusted`'s "unknown to NSE corporate
        actions" path).
        """
        if self._source.exchange == 'NSE':
            return ticker
        if isin is None:
            return None
        return self._nse_symbol_master.symbol_for_isin(isin)

    def _warn_unadjusted(self, symbol: str, reason: str) -> None:
        warning = f'{symbol}: returning unadjusted bars - {reason}'
        self._adjustment_warnings.setdefault(symbol, []).append(warning)
        if symbol not in self._warned_symbols:
            # Logged once per symbol per provider instance - a long-running process
            # asking for the same permanently-unadjustable symbol repeatedly must not
            # spam the log, but `adjustment_warnings` below always reflects only the
            # most recent fetch regardless of how many times this has already fired.
            self._warned_symbols.add(symbol)
            jh.debug(f'IndiaExchangeProvider({self.provider_id}): {warning}')

    def adjustment_warnings(self, symbol: str) -> list[str]:
        """Reasons (if any) `symbol` has been returned unadjusted despite a
        SPLIT_ADJUSTED request - surfaced for stories #8/#12 to show the user rather
        than leaving an unadjusted import looking silently correct.
        """
        return list(self._adjustment_warnings.get(symbol, ()))

    def list_symbol_entries(self) -> tuple[SymbolCatalogEntry, ...]:
        return self._source.list_symbol_entries()

    def is_index(self, symbol: str) -> bool:
        """Whether `symbol` (a Jesse symbol, e.g. `NIFTY-INR`) is an index rather than a
        tradable security - delegates to the underlying source's `is_index` (see
        `IndiaDailySource.is_index` for why that is the single authority story #7 uses).
        May raise `ProviderUnavailableError` for a source (e.g. NseCompositeSource) that
        cannot confidently classify the ticker right now - never silently guesses.
        """
        return self._source.is_index(to_exchange_ticker(symbol))

    def list_symbols(self) -> tuple[str, ...]:
        return tuple(entry.symbol for entry in self.list_symbol_entries())

    def search_symbols(self, query: str, limit: int = 50) -> tuple[str, ...]:
        normalized_query = query.strip().upper()
        if not normalized_query:
            return ()

        prefix_matches: list[str] = []
        other_matches: list[str] = []
        for entry in self.list_symbol_entries():
            symbol = entry.symbol.upper()
            name = (entry.name or '').upper()
            if normalized_query not in symbol and normalized_query not in name:
                continue
            # A symbol-prefix match (e.g. "TCS" for query "TCS") is what a user typing a
            # ticker is almost always looking for, so it outranks a mid-string/name hit.
            (prefix_matches if symbol.startswith(normalized_query) else other_matches).append(entry.symbol)

        return tuple((prefix_matches + other_matches)[:limit])


def _has_symbol_catalog(source: IndiaDailySource) -> bool:
    # `IndiaDailySource.list_symbol_entries` is the shared "not supported" default (it
    # raises ProviderCapabilityError); a source only offers ticker search when its own
    # class overrides that method with a real implementation.
    return type(source).list_symbol_entries is not IndiaDailySource.list_symbol_entries


def _adjust_ohlc(
    open_price: float, high_price: float, low_price: float, close_price: float, factor: float,
) -> tuple[float, float, float, float]:
    """Multiply one bar's O/H/L/C by `factor`, rounded to `_ADJUSTED_PRICE_DECIMALS`.

    Two edge cases handled beyond a plain per-field `round()`:
    - Independent per-field rounding could in principle nudge the rounded high/low just
      inside the rounded open/close (`HistoricalCandle` requires `high >= max(o, c)` and
      `low <= min(o, c)`) - high/low are recomputed from the four already-rounded values
      themselves so the invariant always holds regardless.
    - An extreme cumulative factor against a deep-penny-stock price (a large bonus ratio
      compounding on an already sub-Rs-1 price) can round a genuinely positive adjusted
      price down to 0.0000, which would misrepresent it as free - in that case the full-
      precision (unrounded) adjusted values are kept instead of the rounded ones.
    """
    unrounded = (open_price * factor, high_price * factor, low_price * factor, close_price * factor)
    rounded = tuple(round(value, _ADJUSTED_PRICE_DECIMALS) for value in unrounded)
    if any(value <= 0 for value in rounded):
        return unrounded
    rounded_open, rounded_high, rounded_low, rounded_close = rounded
    high = max(rounded_open, rounded_high, rounded_low, rounded_close)
    low = min(rounded_open, rounded_high, rounded_low, rounded_close)
    return rounded_open, high, low, rounded_close
