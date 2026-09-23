"""Shared parsing for NSE/BSE whole-market archive files (bhavcopy-style).

NSE (story #4) and BSE (story #5) both publish a daily whole-market CSV, in one of
two schemas: a legacy per-exchange format, and UDiFF - a SEBI-mandated schema that is
byte-for-byte identical in column layout across exchanges (see
docs/india-markets/spike-sources.md §4). This module holds the format-level pieces
that behave the same regardless of which exchange served the file: zip unwrapping
(with a wrong-day member-name guard for legacy files), None-safe field access, CSV
parsing, CSV-byte decoding, date parsing/validation, and the positive-price rule a
row must pass to become a `DailyBar`.

What stays in each exchange's own module (`nse_archives.py`/`bse_archives.py`)
instead: URLs, which series/group codes are in scope, how a duplicate ticker within
one file is resolved, and the symbol catalog - all of those differ by exchange even
where the underlying file schema (UDiFF) does not.
"""
import csv
import io
import zipfile
import zlib
from datetime import date

from ..contracts import HistoricalCandle
from ..errors import HistoricalCandleValidationError, ProviderSchemaError
from .sources import DailyBar

# 3-letter uppercase English month abbreviations used by both NSE's legacy bhavcopy
# TIMESTAMP column (DD-MON-YYYY) and NSE's legacy archive URL path. Built explicitly
# (never via a locale-dependent strftime('%b')) so parsing/URL-building is identical
# regardless of the running process's locale. BSE's legacy file has no date column at
# all (see bse_archives.py), so only NSE currently consumes this for date parsing, but
# it lives here rather than in nse_archives.py since it is the DD-MON-YYYY format
# itself - not an NSE-specific rule - that these constants encode.
MONTH_ABBREVIATIONS = (
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
)

# Sentinels distinguishing a routinely-excluded row (out-of-scope series/segment, no
# trades) from one that actively fails validation - only the latter is worth counting
# and reporting, per session, via jh.debug. Shared across NSE/BSE so both sources'
# row-outcome counting means the same thing and is comparable in logs.
ROW_SKIPPED = object()
ROW_INVALID = object()


def field(row: dict[str, str | None], key: str) -> str:
    """Read one CSV field as a string, treating a short row's missing value as ''.

    `csv.DictReader` fills a row that has fewer columns than the header with None for
    the missing trailing ones; calling `.strip()` directly on that None is what used to
    raise AttributeError here. Every row field must be read through this helper instead
    of `row[key]`/`row.get(key, '')` (whose default only applies when the key itself is
    absent, not when its value is None).
    """
    value = row.get(key)
    return value if value is not None else ''


def decode_csv_bytes(payload: bytes, *, label: str) -> str:
    """Decode a raw CSV payload as text, wrapping a decode failure as ProviderSchemaError.

    `label` names the source for the error message. Every place bytes coming off the
    wire (zipped or plain) become CSV text must go through this - a raw
    `UnicodeDecodeError` must never escape to a caller.
    """
    try:
        # utf-8-sig strips a BOM if the exchange ever adds one; plain ASCII/UTF-8 files decode unaffected.
        return payload.decode('utf-8-sig')
    except UnicodeDecodeError as exc:
        raise ProviderSchemaError(f'{label} is not valid UTF-8 text') from exc


def unzip_single_csv(payload: bytes, *, label: str) -> tuple[str, str]:
    """Unwrap a single-file zip archive into (decoded text, member filename).

    The member filename is returned (not just discarded) so a caller can guard against
    a zip that unzips fine but was served under the wrong date's URL - see
    `check_archive_member_name`. `label` names the source for error messages.
    """
    try:
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            # Directory entries (e.g. a `folder/` member some zip writers emit) never
            # hold data - only count actual files when checking for exactly one CSV.
            names = [info.filename for info in archive.infolist() if not info.is_dir()]
            if len(names) != 1:
                raise ProviderSchemaError(f'Expected exactly one file inside the {label} archive, found {len(names)}')
            member_name = names[0]
            content = archive.read(member_name)
    except (zipfile.BadZipFile, zlib.error, EOFError) as exc:
        # A corrupted download (truncated transfer, bit flip, etc.) - not a bug in this
        # module and not worth a raw zipfile/zlib traceback reaching the caller.
        raise ProviderSchemaError(f'{label} archive is corrupted or not a valid zip file') from exc

    return decode_csv_bytes(content, label=f'{label} archive'), member_name


def check_archive_member_name(actual_name: str, expected_name: str, *, label: str) -> None:
    """Guard against a zip that unzips fine but holds the wrong day's file.

    Compared case-insensitively since exchanges are inconsistent about member-name
    casing (BSE's legacy member names are all-uppercase, NSE's are lowercase apart from
    the month abbreviation). This is distinct from `check_session_date`, which checks a
    parsed *row's* date column - BSE's legacy format has no date column at all, so for
    it this member-name check is the only guard against a wrong-day file.
    """
    if actual_name.strip().lower() != expected_name.strip().lower():
        raise ProviderSchemaError(
            f'{label} archive member {actual_name!r} does not match the expected {expected_name!r} for '
            'the requested session'
        )


def read_csv_rows(payload: bytes, *, label: str) -> list[dict[str, str]]:
    """Decode a plain (non-zipped) CSV payload into rows. See `read_csv_rows_from_text` for details."""
    _fieldnames, rows = read_csv_rows_from_text(decode_csv_bytes(payload, label=label))
    return rows


def read_csv_rows_from_text(text: str) -> tuple[list[str], list[dict[str, str]]]:
    reader = csv.DictReader(io.StringIO(text))
    fieldnames = reader.fieldnames
    if fieldnames is None:
        return [], []
    # Headers may carry surrounding whitespace (e.g. NSE's EQUITY_L.csv:
    # "SYMBOL,NAME OF COMPANY, SERIES, ...") and a legacy bhavcopy can have a trailing
    # empty column from a trailing comma; strip names by identity rather than by
    # position so lookups below are by header name.
    stripped_fieldnames = [name.strip() for name in fieldnames]
    reader.fieldnames = stripped_fieldnames
    rows = []
    for raw_row in reader:
        # A short row (fewer fields than the header) is filled out by DictReader with
        # None for its missing trailing columns - left as None here (not `.strip()`ed)
        # so `field()` is the single place that normalizes that into ''.
        rows.append(
            {key: (value.strip() if isinstance(value, str) else value) for key, value in raw_row.items() if key}
        )
    return stripped_fieldnames, rows


def parse_iso_date(value: str) -> date | None:
    try:
        return date.fromisoformat(value.strip())
    except ValueError:
        # Empty or malformed - a row-scoped problem (counted as invalid by the caller),
        # not the file-wide "wrong day served" problem `check_session_date` guards.
        return None


def parse_legacy_date(value: str) -> date | None:
    parts = value.strip().split('-')
    if len(parts) != 3:
        return None
    day_str, month_str, year_str = parts
    month_str = month_str.strip().upper()
    if month_str not in MONTH_ABBREVIATIONS:
        return None
    try:
        return date(int(year_str), MONTH_ABBREVIATIONS.index(month_str) + 1, int(day_str))
    except ValueError:
        return None


def check_session_date(row_date: date, session: date, *, label: str) -> None:
    # Guards against the exchange serving the wrong day's file under a requested URL -
    # every row in the file must carry the same session date we asked for. Only
    # reached once a row's date has actually parsed, so this is strictly about a
    # parseable-but-wrong date, not an empty/malformed one (see `parse_iso_date`/
    # `parse_legacy_date`).
    if row_date != session:
        raise ProviderSchemaError(f'{label} row date {row_date} does not match the requested session {session}')


def build_bar(
    ticker: str, series: str, row_date: date, open_str: str, high_str: str, low_str: str, close_str: str,
    volume_str: str,
) -> tuple[str, str, DailyBar] | object:
    try:
        open_price, high_price, low_price, close_price, volume = (
            float(open_str), float(high_str), float(low_str), float(close_str), float(volume_str),
        )
    except (TypeError, ValueError):
        # An unparseable number is the same failure mode as failing HistoricalCandle
        # validation below (a row that cannot become a valid bar) - count it the same way.
        return ROW_INVALID
    if open_price <= 0 or high_price <= 0 or low_price <= 0 or close_price <= 0:
        # A zero or negative price is never a real traded price, and it would poison
        # indicators and returns computed off it downstream. HistoricalCandle's own
        # validation doesn't check this (only finiteness/OHLC ordering), so it's
        # enforced explicitly here rather than assumed.
        return ROW_INVALID
    if volume <= 0:
        # No trades that day for this ticker means no bar, not a zero-volume bar -
        # routine and not worth counting alongside genuinely invalid rows.
        return ROW_SKIPPED
    try:
        # HistoricalCandle's own validation (finite numbers, OHLC ordering, etc.) is the
        # single source of truth for what a valid bar looks like; reuse it here instead
        # of duplicating those rules, and skip just this row - rather than aborting the
        # whole session - when it fails.
        HistoricalCandle(
            timestamp=0, open=open_price, high=high_price, low=low_price, close=close_price, volume=volume,
        )
    except HistoricalCandleValidationError:
        return ROW_INVALID
    return ticker, series, DailyBar(row_date, open_price, high_price, low_price, close_price, volume)
