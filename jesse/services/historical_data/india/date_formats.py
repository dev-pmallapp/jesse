"""Per-(exchange, source) date parsing for India's daily archive/API files.

Each India provider column that carries a date (NSE/BSE bhavcopy TIMESTAMP/TradDt, NSE's
index file Index Date, NSE's corporate-actions exDate) is parsed with a `strptime`-style
pattern declared here, keyed by `(exchange, source)` in `DATE_FORMATS` - never guessed
per row. A known historical deviation from a source's usual format (e.g. NSE writing its
index file's `Index Date` column month-first for one week in April 2023) is an explicit,
dated `FormatOverride`, not a runtime heuristic: the override only ever applies for the
session-date window it documents, and every session outside that window uses the base
pattern. A value that fails to parse under the selected pattern, or that parses but does
not equal the row's session, is left for the caller to reject (typically via
`archive_parsing.check_session_date`, or - for a whole-file-is-one-session source like
NSE's index file - a direct raise; see nse_indices.py) - a new, unanticipated glitch must
surface loudly in import logs, not be silently reinterpreted the way the old
DD-MM/MM-DD tie-breaker in nse_indices.py used to.
"""
from dataclasses import dataclass
from datetime import date, datetime

from .archive_parsing import MONTH_ABBREVIATIONS


@dataclass(frozen=True)
class FormatOverride:
    """An inclusive session-date window (`first`..`last`) where a source wrote its date
    column in `pattern` instead of its usual format. `reason` documents the evidence for
    the override (e.g. "verified against cached files") so a future reader doesn't need
    to re-derive it from git blame before trusting - or removing - it.
    """
    first: date
    last: date
    pattern: str
    reason: str


@dataclass(frozen=True)
class DateFormat:
    """The `strptime`-style pattern a source's date column uses, plus any dated
    overrides. Every pattern currently registered below is either purely numeric
    (`%d`/`%m`/`%Y`) or the DD-MON-YYYY `%b` shape - see `parse`'s locale note before
    registering a new `%b`-based pattern.
    """
    pattern: str
    overrides: tuple[FormatOverride, ...] = ()

    def pattern_for(self, session: date | None) -> str:
        """The pattern to use for `session` - an override's pattern when `session` falls
        inside its window, else the base pattern. `session=None` (a caller with no
        single file-wide session to key off, e.g. corporate actions - see
        corporate_actions.py) always uses the base pattern; no override in this registry
        is keyed by anything other than a session date.
        """
        if session is not None:
            for override in self.overrides:
                if override.first <= session <= override.last:
                    return override.pattern
        return self.pattern

    def parse(self, value: str, *, session: date | None = None) -> date | None:
        """Parse `value` with the pattern selected for `session`. Returns None on an
        empty value or one that fails to parse under that pattern - the same row-scoped
        "couldn't parse this one" contract the old `archive_parsing.parse_iso_date`/
        `parse_legacy_date` had. This never raises on a parse failure and never checks
        `value` against `session` itself (that's `archive_parsing.check_session_date`,
        or - for a source where any unparseable/mismatched date is inherently
        file-wide-suspicious - a caller-level raise; see nse_indices.py's docstring).
        """
        text = value.strip()
        if not text:
            return None
        pattern = self.pattern_for(session)
        try:
            if '%b' in pattern:
                # CPython's `_strptime` resolves `%b` against the process's current
                # LC_TIME locale (`_strptime.LocaleTime` builds its month-name table
                # from `calendar`/`time`, both locale-aware) - unlike the purely numeric
                # `%d`/`%m`/`%Y` directives used everywhere else in this registry, which
                # `_strptime` matches with plain digit regexes regardless of locale. A
                # non-English LC_TIME could therefore silently fail to match NSE's
                # English month abbreviations if this went through `strptime` directly.
                # Every `%b` pattern registered below is exactly `%d-%b-%Y`, so it is
                # parsed by hand against the same explicit English table
                # (`archive_parsing.MONTH_ABBREVIATIONS`) NSE's legacy URL-building
                # already uses - locale-independent by construction, not by accident.
                return _parse_day_month_abbr_year(text, pattern)
            return datetime.strptime(text, pattern).date()
        except ValueError:
            return None


def _parse_day_month_abbr_year(value: str, pattern: str) -> date | None:
    if pattern != '%d-%b-%Y':
        # Every %b pattern actually registered is this one DD-MON-YYYY shape; a
        # different %b pattern would need its own hand-rolled parser (or a general
        # token-by-token reimplementation) rather than silently mis-parsing here.
        raise NotImplementedError(f'locale-independent %b parsing only supports the %d-%b-%Y shape, got {pattern!r}')
    parts = value.split('-')
    if len(parts) != 3:
        return None
    day_str, month_str, year_str = parts
    # Case-insensitive: NSE's own files are inconsistent (`30-Jan-2025` in current
    # bhavcopy/corporate-actions responses, all-caps `JAN` seen in some legacy exports).
    month_str = month_str.strip().upper()
    if month_str not in MONTH_ABBREVIATIONS:
        return None
    try:
        return date(int(year_str), MONTH_ABBREVIATIONS.index(month_str) + 1, int(day_str))
    except ValueError:
        return None


# 2023-04-06, 2023-04-10, and 2023-04-11: a scan of every cached NSE index file found
# exactly these three writing `Index Date` MM-DD-YYYY for every row, instead of the
# usual DD-MM-YYYY - all one glitch week. Bounded tightly to this window (verified
# against the cached files themselves, not inferred from a calendar rule) so any other
# session that happens to write a swapped day/month is treated as the genuine anomaly it
# is, not silently reinterpreted - see nse_indices.py.
_NSE_INDEX_MM_DD_GLITCH_WEEK = FormatOverride(
    first=date(2023, 4, 6),
    last=date(2023, 4, 11),
    pattern='%m-%d-%Y',
    reason='NSE wrote month-first Index Date for this one week; verified against cached files',
)

# Keyed by (exchange, source) - `source` is a schema-level id, not necessarily a
# provider's `source_id` (NseBhavcopySource, source_id='nse_bhavcopy', alone spans two
# different date-column schemas: legacy DD-MON-YYYY and UDiFF ISO, so those two get
# separate keys here).
DATE_FORMATS: dict[tuple[str, str], DateFormat] = {
    # NSE legacy bhavcopy `TIMESTAMP` column, e.g. "01-JAN-2024" (nse_archives.py).
    ('NSE', 'nse_bhavcopy_legacy'): DateFormat('%d-%b-%Y'),
    # NSE UDiFF bhavcopy `TradDt` column, e.g. "2024-01-01" (nse_archives.py).
    ('NSE', 'nse_bhavcopy_udiff'): DateFormat('%Y-%m-%d'),
    # NSE index file `Index Date` column, e.g. "01-01-2024" (nse_indices.py).
    ('NSE', 'nse_indices'): DateFormat('%d-%m-%Y', overrides=(_NSE_INDEX_MM_DD_GLITCH_WEEK,)),
    # NSE corporate-actions API `exDate` field, e.g. "01-Jan-2024" (corporate_actions.py).
    # No FormatOverride here: unlike the index file (one date per whole-market file),
    # each corporate action carries its own independent exDate with no shared session to
    # key an override off of, and no such deviation has been observed for this field.
    ('NSE', 'corporate_actions'): DateFormat('%d-%b-%Y'),
    # BSE UDiFF bhavcopy `TradDt` column, e.g. "2024-01-01" (bse_archives.py). BSE's
    # legacy bhavcopy has no date column at all (see
    # `archive_parsing.check_archive_member_name`'s docstring), so there is no
    # ('BSE', 'bse_bhavcopy_legacy') entry to register.
    ('BSE', 'bse_bhavcopy_udiff'): DateFormat('%Y-%m-%d'),
}


def date_format(exchange: str, source: str) -> DateFormat:
    """Look up the `DateFormat` registered for `(exchange, source)`.

    Raises `KeyError` (with a message naming the missing pair) rather than returning
    None - an unregistered `(exchange, source)` is a programming error at the call site
    (a typo, or a new source that forgot to register a format here), not a runtime data
    condition a caller should handle gracefully.
    """
    try:
        return DATE_FORMATS[(exchange, source)]
    except KeyError:
        raise KeyError(
            f'No date format registered for exchange={exchange!r} source={source!r}; add one to DATE_FORMATS in '
            'jesse/services/historical_data/india/date_formats.py'
        ) from None
