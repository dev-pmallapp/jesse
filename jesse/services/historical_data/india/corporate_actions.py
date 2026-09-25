"""NSE corporate actions (splits/bonuses) and the split/bonus price adjustment they
drive (story #7, decision D7 in docs/india-markets/PLAN.md).

D7: Jesse itself split/bonus-adjusts the raw prices its India sources return - neither
NSE's nor BSE's bhavcopy files are retroactively adjusted for a later corporate action
(see NseBhavcopySource/BseBhavcopySource's `prices_adjusted` docstrings, and the
ALLCARGO bonus proof fixture `tests/fixtures/india/nse_bhavcopy_legacy_allcargo_unadjusted_proof.csv`).
This module supplies the two things that adjustment needs:

- `parse_subject` turns NSE's free-text corporate-actions `subject` field
  (e.g. `"Bonus 3:1"`, `"Face Value Split (Sub-Division) - From Rs10/- Per Share To
  Re 1/- Per Share"`) into zero or more `(kind, price_factor)` actions. Only
  split/bonus/consolidation of ORDINARY EQUITY are in scope - dividends, rights, AGM
  notices, and bonus/rights DEBENTURES/NCDs/bonds/preference shares (including
  abbreviations like NCRPS/CRPS/RPS/OCRPS/CCPS - see `_DEBT_KEYWORD_RE`; a
  debt/preference distribution, not a share-count/face-value change) return `[]` (a rights issue does
  technically affect a fair, dividend-adjusted price series, but D7 only covers
  split/bonus; rights handling is out of scope here). A subject that *mentions*
  split/sub-division/bonus/consolidation wording but does not match any known phrasing -
  including a matched ratio/amount that is itself degenerate (a zero term, or an
  unchanged face value) - raises `UnparsedCorporateAction` rather than silently
  returning `[]` - callers must not treat "couldn't parse this" the same as "there was
  no action".
- `NseCorporateActionsClient` fetches the raw JSON from NSE's corporate-actions API,
  one calendar year at a time.
- `CorporateActionsStore` turns fetched actions into a per-security adjustment factor
  (`factor_before`), lazily loading and caching years of history, indexed by BOTH ISIN
  and NSE symbol (see its docstring for why one key alone is not reliable).

Stored-history caveat (also called out in provider.py, since that is where the actual
adjustment happens): a candle is adjusted using whatever corporate actions are known
*at import time*. If a company announces a new split/bonus after a symbol's history has
already been imported, its already-stored bars are NOT retroactively re-adjusted by
this module - only a fresh `_fetch_candles` call (i.e. re-importing that symbol) picks
up the new factor. Detecting a stale import and triggering re-adjustment is out of
scope here; it belongs to story #8 (daily storage/importer).
"""
import re
import time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date, datetime
from threading import Lock
from typing import Literal

import jesse.helpers as jh

from ..errors import ProviderRequestError, ProviderSchemaError, ProviderUnavailableError
from .date_formats import date_format
from .http import IndiaHttpClient
from .sessions import IST

ActionKind = Literal['split', 'bonus', 'consolidation']

# The earliest calendar year NSE's corporate-actions API returns data for - confirmed in
# the live smoke check (2026-09-23): 1994 returns 0 records, 1995 returns 81. NSE's own
# cash-market segment itself only began trading 03-Nov-1994 (NSE_FIRST_SESSION,
# nse_archives.py), so a handful of corporate actions appearing from the following full
# year (1995) onward, and none before, is consistent with that.
CORPORATE_ACTIONS_FIRST_YEAR = 1995

# How long the *current* calendar year's fetched actions stay cached before the next
# call re-fetches them - a company can announce/amend a corporate action for the
# ongoing year at any time, so unlike a fully elapsed past year (cached forever - see
# CorporateActionsStore), the current year must eventually notice new/changed entries.
# 12h matches the TTL every other India catalog cache in this package uses.
_CURRENT_YEAR_CACHE_TTL_SECONDS = 12 * 60 * 60

_CORPORATE_ACTIONS_URL_TEMPLATE = (
    'https://www.nseindia.com/api/corporates-corporateActions?index=equities'
    '&from_date={from_date}&to_date={to_date}'
)
# The homepage 403s (Akamai bot mitigation) but still sets the cookies the API needs -
# see http.py's module docstring and IndiaHttpClient.prime_cookies.
_NSE_HOMEPAGE_URL = 'https://www.nseindia.com/'
# Referer NSE's own corporate-actions page uses; required alongside the primed cookies
# (see docs/india-markets/spike-sources.md §5 - untested without it, so treated as
# required until proven otherwise).
_CORPORATE_ACTIONS_REFERER = 'https://www.nseindia.com/companies-listing/corporate-filings-actions'
_CORPORATE_ACTIONS_HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'X-Requested-With': 'XMLHttpRequest',
}

_REQUIRED_RECORD_FIELDS = ('isin', 'symbol', 'exDate', 'subject')

# `exDate`'s format (see date_formats.py) - resolved once at import time rather than
# looked up per record. No session to key an override off of here: unlike a whole-market
# archive file, each corporate-action record is independently dated.
_EX_DATE_FORMAT = date_format('NSE', 'corporate_actions')

# How long a primed cookie jar is trusted before the next call re-primes it as a routine
# refresh, even without an explicit rejection - Akamai's cookies are not documented to
# expire on a fixed schedule, so this is a conservative guess, not a confirmed TTL.
_COOKIE_PRIME_INTERVAL_SECONDS = 30 * 60


class UnparsedCorporateAction(Exception):
    """`parse_subject` could not match a subject that nonetheless mentions
    split/sub-division/bonus/consolidation wording. Raised (not returned as `[]`) so a
    caller is forced to notice and handle "unknown action" separately from "no action"
    - see the module docstring.
    """


@dataclass(frozen=True, slots=True)
class CorporateAction:
    """One split/bonus/consolidation, as it affects prices strictly before its ex-date.

    `price_factor` multiplies O/H/L/C for every session strictly before `ex_date`
    (volume is divided by the same factor); a session on or after `ex_date` is
    unaffected by this action. See `CorporateActionsStore.factor_before`.
    """

    isin: str
    symbol: str
    ex_date: date
    kind: ActionKind
    price_factor: float
    subject: str


# --------------------------------------------------------------------------------------
# subject parsing
# --------------------------------------------------------------------------------------

# A bare money amount: "Rs10/-", "Rs 5/-", "Re 1/-", "Rs.10/-", "Re.1/-", "Rs 2" (the
# "/-" suffix and the period after Rs/Re are both optional - NSE is inconsistent about
# including them). Captures the numeric amount.
_MONEY = r'r[es]\.?\s*(\d+(?:\.\d+)?)\s*/?-?'

# "Bonus <a>:<b>" (optionally "Bonus Issue <a>:<b>") - `a` new shares issued for every
# `b` already held. `\D{0,30}?` is the non-greedy gap between the word "bonus" and the
# ratio, tolerating phrasing like "Bonus issue in the ratio of 3:1" without a fixed
# template.
_BONUS_RE = re.compile(r'bonus(?:\s+issue)?\D{0,30}?(\d+)\s*:\s*(\d+)', re.IGNORECASE)

# "... From <money> ... To <money> ..." - the shared shape of both a face-value split
# ("From Rs10/- ... To Re1/-") and a consolidation ("From Rs2/- ... To Rs10/-"); which
# one it is, is decided purely by comparing the two amounts (see parse_subject), not by
# which label word (Split/Sub-Division/Consolidation) NSE happened to use.
_SPLIT_RE = re.compile(rf'from\s+{_MONEY}.*?\bto\b\s+{_MONEY}', re.IGNORECASE)

# Any wording that means "some split/bonus/consolidation action happened here" - used
# only to detect a clause this module SHOULD have parsed but didn't (see parse_subject).
_KEYWORD_RE = re.compile(r'\b(?:split|sub-?division|bonus|consolidation)\b', re.IGNORECASE)

# A clause carrying any of these words is a DEBT/PREFERENCE distribution (bonus/rights
# debentures, NCDs, bonds, preference shares - including NSE's common abbreviations for
# the latter: NCRPS "Non-Convertible Redeemable Preference Shares", CRPS "Convertible
# Redeemable Preference Shares", RPS "Redeemable Preference Shares", OCRPS "Optionally
# Convertible Redeemable Preference Shares", CCPS "Compulsorily Convertible Preference
# Shares" - CCPS converts to equity only later/optionally, so at issue it is still a
# preference-share bonus, not an ordinary-equity one), not an ordinary-equity
# split/bonus - even though it may otherwise match `_BONUS_RE`/`_SPLIT_RE` (e.g. "Bonus
# Debentures 3:1", "Scheme Of Arrangement - Bonus Ncrps 4:1" both match the bonus ratio
# pattern; see TVSMOTOR's ex-25-Aug-2025 action, story #82). Checked BEFORE the
# bonus/split patterns so it always wins; treated the same as a dividend (out of scope
# for D7, not an error). Word-bounded so "rps"/"crps" don't fire on an unrelated word
# that merely ends in those letters.
_DEBT_KEYWORD_RE = re.compile(
    r'\b(?:debentures?|ncds?|bonds?|preferences?|pref|prefs|ncrps|ocrps|ccps|crps|rps)\b',
    re.IGNORECASE,
)

# A subject describing more than one action in one string is split on these connectors
# before each clause is parsed independently. Deliberately narrower than a bare '/':
# NSE's money amounts themselves contain an unspaced '/' ("Rs10/-"), so only a '/'
# surrounded by whitespace is treated as an action separator, never that currency
# suffix.
_CLAUSE_SPLIT_RE = re.compile(r';|\s+/\s+|\band\b', re.IGNORECASE)


def parse_subject(subject: str) -> list[tuple[ActionKind, float]]:
    """Parse NSE's free-text corporate-action `subject` into `(kind, price_factor)` pairs.

    Returns `[]` for a subject with no split/bonus/consolidation wording at all (e.g. a
    dividend or rights notice - out of scope for D7), and for a clause that is
    unambiguously a debt/preference distribution (see `_DEBT_KEYWORD_RE`). Raises
    `UnparsedCorporateAction` for a subject that mentions split/bonus/consolidation
    wording but does not match a known pattern, OR whose matched ratio/amount is itself
    degenerate (a zero term, or an unchanged face value - never a real corporate
    action) - see the module docstring for why that must never be treated as `[]`.
    """
    actions: list[tuple[ActionKind, float]] = []
    for raw_clause in _CLAUSE_SPLIT_RE.split(subject):
        clause = raw_clause.strip()
        if not clause:
            continue

        if _DEBT_KEYWORD_RE.search(clause) is not None:
            # A bonus/rights *debenture*/NCD/bond/preference-share issue changes the
            # company's debt/preference capital, not its ordinary share count or face
            # value - nothing here for D7 to adjust (like a cash dividend). BUT this
            # clause might bundle a genuine equity action too, joined by a connector
            # `_CLAUSE_SPLIT_RE` doesn't split on (`&`, a bare comma, or no connector at
            # all - e.g. "Bonus Equity Shares 1:1 & Bonus NCRPS 4:1"; commas can't be
            # added to the splitter since they also appear inside amounts). There is no
            # safe way to tell here which ratio belongs to the equity leg and which to
            # the debt/preference leg, so skipping the whole clause would silently leave
            # a real equity bonus unadjusted (story #82 follow-up). More than one
            # split/bonus/consolidation keyword, or more than one ratio, in the clause
            # means more than one action is packed in here - a lone debt/preference
            # clause has exactly one of each - so raise instead of guessing.
            if len(_KEYWORD_RE.findall(clause)) > 1 or len(re.findall(r'\d+\s*:\s*\d+', clause)) > 1:
                raise UnparsedCorporateAction(subject)
            continue

        bonus_match = _BONUS_RE.search(clause)
        if bonus_match is not None:
            new_shares, held_shares = int(bonus_match.group(1)), int(bonus_match.group(2))
            if new_shares <= 0 or held_shares <= 0:
                # A matched-but-degenerate ratio (e.g. "Bonus 0:1") is never a real
                # bonus - a parsing/data problem, not silently "no action".
                raise UnparsedCorporateAction(subject)
            # a new shares for every b held -> post-bonus share count is (a+b) times
            # the pre-bonus count, so a pre-bonus price is (a+b)/b times a post-bonus
            # one; the adjustment factor (applied to PRE-ex-date prices) is its
            # inverse, b / (a + b). ALLCARGO "Bonus 3:1": 1 / (3 + 1) = 0.25.
            actions.append(('bonus', held_shares / (new_shares + held_shares)))
            continue

        split_match = _SPLIT_RE.search(clause)
        if split_match is not None:
            old_face_value, new_face_value = float(split_match.group(1)), float(split_match.group(2))
            if old_face_value <= 0 or new_face_value <= 0 or old_face_value == new_face_value:
                # Degenerate (a non-positive face value, or "From Rs10 To Rs10") - never
                # a real split/consolidation.
                raise UnparsedCorporateAction(subject)
            # Face value falling (10 -> 1) is a split: each pre-split share becomes
            # several, so its pre-split price is worth proportionally less in
            # post-split terms - factor new/old < 1. Face value rising is the
            # reverse (a consolidation) - factor new/old > 1. Either way the
            # direction is read off the numbers themselves, not the label NSE used.
            kind: ActionKind = 'split' if new_face_value < old_face_value else 'consolidation'
            actions.append((kind, new_face_value / old_face_value))
            continue

        if _KEYWORD_RE.search(clause) is not None:
            # Mentions split/bonus/consolidation wording but matched neither pattern
            # above - a genuinely unhandled phrasing, not "no action" (see docstring).
            raise UnparsedCorporateAction(subject)

    return actions


# --------------------------------------------------------------------------------------
# NSE corporate-actions API client
# --------------------------------------------------------------------------------------

class NseCorporateActionsClient:
    """Fetches NSE's corporate-actions JSON API, one calendar year at a time.

    `www.nseindia.com` sits behind Akamai bot mitigation (see http.py's module
    docstring): a bare homepage GET 403s but still sets the cookies the JSON API needs.
    Cookies are primed once per client, then re-primed at most every
    `_COOKIE_PRIME_INTERVAL_SECONDS` as a routine refresh, or immediately (once) when a
    request itself comes back 401/403 - an expired/invalid cookie mid-session, which a
    routine refresh interval alone wouldn't necessarily catch in time.
    """

    def __init__(self, client: IndiaHttpClient | None = None, *, monotonic: Callable[[], float] | None = None) -> None:
        self._client = client if client is not None else IndiaHttpClient()
        self._monotonic = monotonic if monotonic is not None else time.monotonic
        # None means "never primed" - the very first call always primes regardless of
        # the interval below.
        self._last_primed_at: float | None = None

    def fetch_year(self, year: int) -> list[dict]:
        """Return the raw (unparsed-subject) corporate-action records for `year`."""
        self._ensure_cookies_primed()
        # DD-MM-YYYY in the query string - distinct from the DD-Mon-YYYY dates inside
        # the JSON body itself (see spike-sources.md §5).
        from_date = date(year, 1, 1).strftime('%d-%m-%Y')
        to_date = date(year, 12, 31).strftime('%d-%m-%Y')
        url = _CORPORATE_ACTIONS_URL_TEMPLATE.format(from_date=from_date, to_date=to_date)

        try:
            payload = self._get(url)
        except ProviderRequestError as exc:
            if not _looks_like_auth_rejection(exc):
                raise
            # The primed cookie jar was rejected outright (expired/invalidated mid-
            # session) - re-prime immediately (bypassing the routine interval) and
            # retry this one request exactly once rather than failing the whole year.
            self._prime_cookies()
            payload = self._get(url)

        if payload is None:
            # Not the "holiday/unpublished file" case bhavcopy has - a missing/soft-404
            # response here means the API itself is unreachable right now.
            raise ProviderUnavailableError(f'NSE corporate actions API is currently unavailable for {year}')
        if not isinstance(payload, list):
            raise ProviderSchemaError(f'NSE corporate actions API returned a non-list payload for {year}')

        records = []
        for record in payload:
            if not isinstance(record, dict) or any(
                field not in record or record[field] is None for field in _REQUIRED_RECORD_FIELDS
            ):
                raise ProviderSchemaError(
                    f'NSE corporate actions API returned a record missing required field(s) for {year}'
                )
            records.append(record)
        return records

    def _get(self, url: str):
        return self._client.get(
            url, expect='json', referer=_CORPORATE_ACTIONS_REFERER, extra_headers=_CORPORATE_ACTIONS_HEADERS,
        )

    def _ensure_cookies_primed(self) -> None:
        now = self._monotonic()
        if self._last_primed_at is None or now - self._last_primed_at >= _COOKIE_PRIME_INTERVAL_SECONDS:
            self._prime_cookies()

    def _prime_cookies(self) -> None:
        self._client.prime_cookies(_NSE_HOMEPAGE_URL)
        self._last_primed_at = self._monotonic()


def _looks_like_auth_rejection(exc: ProviderRequestError) -> bool:
    # ProviderRequestError's message embeds the raw HTTP status (see
    # IndiaHttpClient.get: "... rejected the request with HTTP <code>"); 401/403
    # specifically indicate an expired/invalid Akamai cookie (see http.py's module
    # docstring) - a re-prime-and-retry candidate, unlike e.g. a 400 (malformed
    # request) that re-priming cookies could never fix.
    message = str(exc)
    return 'HTTP 401' in message or 'HTTP 403' in message


# --------------------------------------------------------------------------------------
# Per-security adjustment-factor store
# --------------------------------------------------------------------------------------

def _dedupe_actions(actions: list[CorporateAction]) -> list[CorporateAction]:
    """Collapse `actions` to one entry per distinct (ex_date, kind, price_factor).

    Needed for two independent reasons: NSE's feed can repeat a record verbatim within
    one year's payload, and - now that `CorporateActionsStore` indexes by both ISIN and
    NSE symbol (see its docstring) - the SAME underlying record is normally reachable
    via both keys at once for an ordinary (non-reissued-ISIN) security, and must still
    only count once. Two genuinely different actions landing on the same ex-date with
    the same kind and factor is not a real-world scenario this needs to distinguish.
    `price_factor` is rounded to 10 decimal places for the comparison - the union can
    combine floats computed via slightly different (but mathematically equal) parses.
    """
    seen: set[tuple[date, str, float]] = set()
    deduped: list[CorporateAction] = []
    for action in actions:
        key = (action.ex_date, action.kind, round(action.price_factor, 10))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(action)
    return deduped


class CorporateActionsStore:
    """Lazily-loaded index of NSE corporate actions and the adjustment factor they imply
    for any given security/session, indexed by BOTH ISIN and NSE symbol.

    A single ISIN key is not reliable on its own: NSE can reissue a security a NEW ISIN
    when its face value is split (observed live for NESTLEIND's Jan-2024 10->1 split -
    the corporate-action record itself carries the OLD ISIN, while NSE's current
    security master already reports the NEW one). Matching by symbol as well covers
    that case (the trading symbol is unaffected by an ISIN reissue); matching by ISIN
    as well covers the opposite direction - a later SYMBOL rename with the ISIN
    unchanged. `actions_for` returns the (deduplicated - see `_dedupe_actions`) union
    of whichever keys are given; `factor_before`/`unparsed_for` build on it.

    Loads calendar years on demand, from `CORPORATE_ACTIONS_FIRST_YEAR` through the
    current year: a fully elapsed past year never changes, so it is cached for the
    process lifetime once loaded; the current year can still be amended, so it is
    re-fetched after `_CURRENT_YEAR_CACHE_TTL_SECONDS`. A failed fetch for a year is
    never cached - the next call simply retries that year. `_lock` serializes the whole
    load path (deliberately store-wide, not per-year) so concurrent callers loading
    overlapping year ranges can never both fetch the same year.
    """

    def __init__(
        self,
        client: NseCorporateActionsClient | None = None,
        *,
        today: Callable[[], date] | None = None,
        monotonic: Callable[[], float] | None = None,
    ) -> None:
        self._client = client if client is not None else NseCorporateActionsClient()
        self._today = today if today is not None else _default_today
        self._monotonic = monotonic if monotonic is not None else time.monotonic
        self._lock = Lock()
        # Keyed by year so the current year's contribution can be replaced wholesale on
        # refresh without disturbing any other (permanently cached) year.
        self._actions_by_isin_year: dict[int, dict[str, list[CorporateAction]]] = {}
        self._actions_by_symbol_year: dict[int, dict[str, list[CorporateAction]]] = {}
        self._unparsed_by_isin_year: dict[int, dict[str, list[str]]] = {}
        self._unparsed_by_symbol_year: dict[int, dict[str, list[str]]] = {}
        self._loaded_years: set[int] = set()
        self._current_year_cached_at: float | None = None

    def actions_for(self, isin: str | None, nse_symbol: str | None) -> list[CorporateAction]:
        """Deduplicated union of actions found under `isin`, `nse_symbol`, or both -
        either may be None (a caller with only one usable key passes None for the
        other). Returns `[]` if both are None.
        """
        if isin is None and nse_symbol is None:
            return []
        self._ensure_loaded_through(self._today().year)
        normalized_isin = isin.strip().upper() if isin else None
        normalized_symbol = nse_symbol.strip().upper() if nse_symbol else None

        combined: list[CorporateAction] = []
        for year in self._loaded_years:
            if normalized_isin is not None:
                combined.extend(self._actions_by_isin_year.get(year, {}).get(normalized_isin, ()))
            if normalized_symbol is not None:
                combined.extend(self._actions_by_symbol_year.get(year, {}).get(normalized_symbol, ()))
        return _dedupe_actions(combined)

    def factor_before(self, isin: str | None, nse_symbol: str | None, session: date) -> float:
        """Product of `price_factor` over every action for `isin`/`nse_symbol` whose
        ex_date is strictly after `session` - i.e. what a price observed ON `session`
        must be multiplied by to express it in current (post-every-known-action) terms.
        On the ex-date itself the factor is already 1 (the action has taken effect).
        """
        factor = 1.0
        for action in self.actions_for(isin, nse_symbol):
            if action.ex_date > session:
                factor *= action.price_factor
        return factor

    def unparsed_for(self, isin: str | None, nse_symbol: str | None) -> list[str]:
        """Raw `subject` strings for `isin`/`nse_symbol` that mentioned a
        split/bonus/consolidation but could not be parsed - a non-empty result means
        `factor_before` for this security cannot be trusted (see provider.py, which
        refuses to adjust in that case).
        """
        if isin is None and nse_symbol is None:
            return []
        self._ensure_loaded_through(self._today().year)
        normalized_isin = isin.strip().upper() if isin else None
        normalized_symbol = nse_symbol.strip().upper() if nse_symbol else None

        seen: set[str] = set()
        warnings: list[str] = []
        for year in self._loaded_years:
            candidates: list[str] = []
            if normalized_isin is not None:
                candidates.extend(self._unparsed_by_isin_year.get(year, {}).get(normalized_isin, ()))
            if normalized_symbol is not None:
                candidates.extend(self._unparsed_by_symbol_year.get(year, {}).get(normalized_symbol, ()))
            for subject in candidates:
                # The same underlying record is normally reachable via both keys at
                # once (see `actions_for`'s docstring) - de-duplicated here too so a
                # caller doesn't see the same unparsed subject listed twice.
                if subject not in seen:
                    seen.add(subject)
                    warnings.append(subject)
        return warnings

    def _ensure_loaded_through(self, through_year: int) -> None:
        current_year = self._today().year
        # `through_year` is defensive (a caller could in principle ask for a future
        # year); actions can never be known past "now", so it is clamped to it.
        target_year = min(through_year, current_year)
        for year in range(CORPORATE_ACTIONS_FIRST_YEAR, target_year + 1):
            self._ensure_year_loaded(year, current_year)

    def _ensure_year_loaded(self, year: int, current_year: int) -> None:
        with self._lock:
            if year in self._loaded_years and year != current_year:
                return  # a fully elapsed past year never changes once loaded
            if year in self._loaded_years and year == current_year:
                now = self._monotonic()
                if (
                    self._current_year_cached_at is not None
                    and now - self._current_year_cached_at < _CURRENT_YEAR_CACHE_TTL_SECONDS
                ):
                    return  # current year, still within its TTL

            # Deliberately not wrapped in try/except: a failed fetch must propagate to
            # the caller, and - just as importantly - must NOT reach `_loaded_years.add`
            # below, so the very next call retries this year instead of assuming it is
            # empty. The lock is held across this network call, serializing the whole
            # store's load path - simpler than per-year locking, and the only guarantee
            # actually required is "never double-fetch a year".
            records = self._client.fetch_year(year)

            actions_by_isin: dict[str, list[CorporateAction]] = {}
            actions_by_symbol: dict[str, list[CorporateAction]] = {}
            unparsed_by_isin: dict[str, list[str]] = {}
            unparsed_by_symbol: dict[str, list[str]] = {}
            for record in records:
                isin = str(record['isin']).strip().upper()
                symbol = str(record['symbol']).strip().upper()
                subject = str(record['subject'])
                ex_date = _EX_DATE_FORMAT.parse(str(record['exDate']))
                if ex_date is None:
                    # DD-Mon-YYYY, the same shape/format NSE's legacy bhavcopy TIMESTAMP
                    # column uses (case-insensitively, see date_formats.py) - a value
                    # that still fails to parse is a genuine schema break.
                    raise ProviderSchemaError(
                        f'NSE corporate actions API returned an unparseable exDate {record["exDate"]!r} for {year}'
                    )
                try:
                    parsed_actions = parse_subject(subject)
                except UnparsedCorporateAction:
                    jh.debug(
                        f'NSE corporate actions: could not parse subject for {symbol} ({isin}) ex {ex_date}: '
                        f'{subject!r}'
                    )
                    unparsed_by_isin.setdefault(isin, []).append(subject)
                    unparsed_by_symbol.setdefault(symbol, []).append(subject)
                    continue
                for kind, price_factor in parsed_actions:
                    action = CorporateAction(
                        isin=isin, symbol=symbol, ex_date=ex_date, kind=kind, price_factor=price_factor,
                        subject=subject,
                    )
                    # The SAME action object is recorded under both keys - deliberate:
                    # `actions_for` later dedupes the union by value, not identity, so
                    # this costs nothing and keeps the two indexes trivially consistent.
                    actions_by_isin.setdefault(isin, []).append(action)
                    actions_by_symbol.setdefault(symbol, []).append(action)

            self._actions_by_isin_year[year] = actions_by_isin
            self._actions_by_symbol_year[year] = actions_by_symbol
            self._unparsed_by_isin_year[year] = unparsed_by_isin
            self._unparsed_by_symbol_year[year] = unparsed_by_symbol
            self._loaded_years.add(year)
            if year == current_year:
                self._current_year_cached_at = self._monotonic()


def _default_today() -> date:
    return datetime.now(IST).date()
