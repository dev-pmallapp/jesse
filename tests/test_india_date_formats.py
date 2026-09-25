"""Tests for jesse/services/historical_data/india/date_formats.py: the per-(exchange,
source) date-format registry that replaced ad-hoc string-splitting date parsing
(archive_parsing.parse_iso_date/parse_legacy_date, nse_indices._parse_index_date) across
the India providers. No network access: real sample values are lifted from this repo's
own fixtures/india/*.csv|json, and the NSE index override is exercised end-to-end
through NseIndexSource with a fake HTTP client, same style as test_india_nse_indices.py.
"""
from datetime import date
from pathlib import Path

import pytest

from jesse.services.historical_data.errors import ProviderSchemaError
from jesse.services.historical_data.india.date_formats import DATE_FORMATS, DateFormat, FormatOverride, date_format
from jesse.services.historical_data.india.nse_indices import NseIndexSource, _index_url

FIXTURES_DIR = Path(__file__).parent / 'fixtures' / 'india'


class FakeIndiaHttpClient:
    """Stands in for IndiaHttpClient.get - returns scripted payloads. Mirrors
    test_india_nse_indices.py's fake (kept local rather than shared, matching this
    test suite's existing per-file convention).
    """

    def __init__(self, files: dict[str, bytes | None]):
        self._files = files

    def get(self, url: str, *, expect: str, referer: str | None = None) -> bytes | None:
        if url not in self._files:
            raise AssertionError(f'Unexpected request to {url!r}')
        return self._files[url]


_INDEX_HEADER = (
    'Index Name,Index Date,Open Index Value,High Index Value,Low Index Value,'
    'Closing Index Value,Points Change,Change(%),Volume,Turnover (Rs. Cr.),P/E,P/B,Div Yield\n'
)


def _index_source_for(session: date, index_date_value: str) -> NseIndexSource:
    text = _INDEX_HEADER + f'Nifty 50,{index_date_value},10,11,9,10.5,0.5,1.2,1000,100,20,4,1.5\n'
    client = FakeIndiaHttpClient({_index_url(session): text.encode()})
    return NseIndexSource(client=client)


# --------------------------------------------------------------------------------------
# Registry entries parse a real sample value from this repo's own fixtures.
# --------------------------------------------------------------------------------------

def test_nse_bhavcopy_legacy_format_parses_real_timestamp():
    # tests/fixtures/india/nse_bhavcopy_legacy_20240101.csv's TIMESTAMP column.
    assert date_format('NSE', 'nse_bhavcopy_legacy').parse('01-JAN-2024') == date(2024, 1, 1)


def test_nse_bhavcopy_udiff_format_parses_real_traddt():
    # tests/fixtures/india/nse_bhavcopy_udiff_20240708.csv's TradDt column.
    assert date_format('NSE', 'nse_bhavcopy_udiff').parse('2024-07-08') == date(2024, 7, 8)


def test_bse_bhavcopy_udiff_format_parses_real_traddt():
    # tests/fixtures/india/bse_bhavcopy_udiff_20240708.csv's TradDt column.
    assert date_format('BSE', 'bse_bhavcopy_udiff').parse('2024-07-08') == date(2024, 7, 8)


def test_nse_indices_format_parses_real_index_date():
    # tests/fixtures/india/nse_ind_close_all_20240101.csv's Index Date column, outside
    # the 2023-04-06..11 override window so the base DD-MM-YYYY pattern applies.
    fmt = date_format('NSE', 'nse_indices')
    assert fmt.parse('01-01-2024', session=date(2024, 1, 1)) == date(2024, 1, 1)


def test_corporate_actions_format_parses_real_exdate():
    # tests/fixtures/india/nse_corporate_actions_20240101_20240331.json's exDate field.
    assert date_format('NSE', 'corporate_actions').parse('02-Jan-2024') == date(2024, 1, 2)


def test_registry_has_exactly_the_expected_keys():
    # Guards against a silent typo/duplicate key change going unnoticed - every India
    # date column currently read anywhere in this package must be registered here.
    assert set(DATE_FORMATS) == {
        ('NSE', 'nse_bhavcopy_legacy'),
        ('NSE', 'nse_bhavcopy_udiff'),
        ('NSE', 'nse_indices'),
        ('NSE', 'corporate_actions'),
        ('BSE', 'bse_bhavcopy_udiff'),
    }


# --------------------------------------------------------------------------------------
# Unknown (exchange, source) key
# --------------------------------------------------------------------------------------

def test_unknown_key_raises_key_error():
    with pytest.raises(KeyError, match='No date format registered'):
        date_format('NSE', 'not_a_real_source')


# --------------------------------------------------------------------------------------
# Empty / garbage values -> None (row-scoped, never raises from DateFormat itself)
# --------------------------------------------------------------------------------------

@pytest.mark.parametrize('value', ['', '   ', 'not-a-date', '2024-13-40', '01/01/2024'])
def test_empty_or_garbage_values_return_none(value):
    assert date_format('NSE', 'nse_bhavcopy_udiff').parse(value) is None
    assert date_format('NSE', 'nse_bhavcopy_legacy').parse(value) is None


# --------------------------------------------------------------------------------------
# %b (month-abbreviation) parsing is case-insensitive, matching NSE's own inconsistency
# (current bhavcopy/corporate-actions responses write e.g. "30-Jan-2025"; some legacy
# exports use all-caps "JAN").
# --------------------------------------------------------------------------------------

@pytest.mark.parametrize('value', ['01-JAN-2024', '01-Jan-2024', '01-jan-2024', '01-jAn-2024'])
def test_month_abbreviation_parsing_is_case_insensitive(value):
    assert date_format('NSE', 'nse_bhavcopy_legacy').parse(value) == date(2024, 1, 1)


def test_month_abbreviation_parsing_rejects_unknown_month_name():
    assert date_format('NSE', 'nse_bhavcopy_legacy').parse('01-XXX-2024') is None


# --------------------------------------------------------------------------------------
# NSE index MM-DD-YYYY override: applies only inside the dated window (2023-04-06..11),
# never by guessing from the session or the value itself.
# --------------------------------------------------------------------------------------

def test_override_window_boundaries():
    fmt = date_format('NSE', 'nse_indices')
    assert fmt.pattern_for(date(2023, 4, 5)) == '%d-%m-%Y'
    assert fmt.pattern_for(date(2023, 4, 6)) == '%m-%d-%Y'
    assert fmt.pattern_for(date(2023, 4, 10)) == '%m-%d-%Y'
    assert fmt.pattern_for(date(2023, 4, 11)) == '%m-%d-%Y'
    assert fmt.pattern_for(date(2023, 4, 12)) == '%d-%m-%Y'


@pytest.mark.parametrize('session', [date(2023, 4, 6), date(2023, 4, 10), date(2023, 4, 11)])
def test_override_applies_inside_glitch_week(session):
    # NSE's real quirk: every row in these three files writes Index Date as
    # MM-DD-YYYY. Encoded as session.month-session.day-session.year here so the same
    # parametrization covers all three real glitch dates.
    value = f'{session.month:02d}-{session.day:02d}-{session.year}'
    source = _index_source_for(session, value)

    bars = source.fetch_session(session)

    assert bars['NIFTY'].close == 10.5


@pytest.mark.parametrize('session', [date(2023, 4, 5), date(2023, 4, 12)])
def test_override_does_not_apply_just_outside_glitch_week(session):
    # One day before/after the real glitch week: a month-first value here is a genuine
    # anomaly, not the known glitch, and must not be silently reinterpreted - it either
    # fails to parse under the base DD-MM-YYYY pattern (day <= 12, so MM-DD-YYYY-shaped
    # "04-05-2023"/"04-12-2023" both parse as *some* DD-MM date) or, once parsed, doesn't
    # equal the requested session - either way this must raise, never guess.
    value = f'{session.month:02d}-{session.day:02d}-{session.year}'
    source = _index_source_for(session, value)

    with pytest.raises(ProviderSchemaError):
        source.fetch_session(session)


def test_month_first_value_outside_override_with_invalid_day_first_reading_raises():
    # 2023-04-13, one day past the glitch week: `04-13-2023` isn't even a valid
    # DD-MM-YYYY reading (month 13), so this must raise rather than being silently
    # dropped as an unparseable-but-routine row - every row in this whole-market file
    # shares one session date, so an unparseable Index Date is file-wide suspicious.
    session = date(2023, 4, 13)
    source = _index_source_for(session, '04-13-2023')

    with pytest.raises(ProviderSchemaError):
        source.fetch_session(session)


def test_transposed_day_month_outside_override_raises():
    # A genuinely wrong-day file whose date happens to be the exact day/month transpose
    # of the requested session (session 2023-05-09, file dated 2023-09-05) must still be
    # rejected - the override never widens beyond its dated window, and DD-MM-YYYY is
    # applied uniformly outside it.
    session = date(2023, 5, 9)
    source = _index_source_for(session, '05-09-2023')

    with pytest.raises(ProviderSchemaError, match='does not match the requested session'):
        source.fetch_session(session)


# --------------------------------------------------------------------------------------
# FormatOverride / DateFormat construction sanity (no registry involved)
# --------------------------------------------------------------------------------------

def test_format_override_window_is_inclusive_on_both_ends():
    override = FormatOverride(first=date(2023, 4, 6), last=date(2023, 4, 11), pattern='%m-%d-%Y', reason='test')
    fmt = DateFormat('%d-%m-%Y', overrides=(override,))

    assert fmt.pattern_for(date(2023, 4, 6)) == '%m-%d-%Y'
    assert fmt.pattern_for(date(2023, 4, 11)) == '%m-%d-%Y'
    assert fmt.pattern_for(date(2023, 4, 5)) == '%d-%m-%Y'
    assert fmt.pattern_for(date(2023, 4, 12)) == '%d-%m-%Y'


def test_pattern_for_with_no_session_uses_base_pattern():
    # Corporate actions (corporate_actions.py) call `parse` with no session at all.
    override = FormatOverride(first=date(2023, 4, 6), last=date(2023, 4, 11), pattern='%m-%d-%Y', reason='test')
    fmt = DateFormat('%d-%m-%Y', overrides=(override,))

    assert fmt.pattern_for(None) == '%d-%m-%Y'
