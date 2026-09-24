"""Tests for jesse/markets/india.py: NSE/BSE trading-hours presets (`nse_trading_hours`,
`bse_trading_hours`) and the underlying `NSE_HOLIDAYS`/`SPECIAL_SESSIONS` data, plus the
interaction with the India daily-row stamping convention in
`jesse.services.historical_data.india.sessions`. No network access anywhere.
"""
import datetime as dt
import json
import subprocess
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
import pytest

from jesse import utils
from jesse.markets.india import (
    COVERED_YEARS,
    NSE_HOLIDAYS,
    SPECIAL_SESSIONS,
    bse_trading_hours,
    nse_trading_hours,
)
from jesse.services.historical_data.india.sessions import session_row_timestamp
from jesse.services.trading_hours import TradingHours, is_in_trading_hours

IST = ZoneInfo('Asia/Kolkata')


def ist_ms(year, month, day, hour=0, minute=0) -> int:
    return int(dt.datetime(year, month, day, hour, minute, tzinfo=IST).timestamp() * 1000)


# ---- presets construct into a valid TradingHours schedule ----------------------------

def test_nse_and_bse_presets_construct_for_the_default_range():
    TradingHours(nse_trading_hours())
    TradingHours(bse_trading_hours())


def test_nse_and_bse_presets_construct_for_a_sub_range():
    TradingHours(nse_trading_hours(2024, 2024))
    TradingHours(bse_trading_hours(2024, 2024))


# ---- NSE_HOLIDAYS data integrity ------------------------------------------------------

def test_covered_years_are_contiguous_2011_to_2026():
    assert list(COVERED_YEARS) == list(range(2011, 2027))
    assert set(NSE_HOLIDAYS) == set(COVERED_YEARS)


@pytest.mark.parametrize('year', list(range(2011, 2027)))
def test_holiday_dates_are_valid_iso_dates_in_their_year_sorted_and_unique(year):
    entries = NSE_HOLIDAYS[year]
    dates = [dt.date.fromisoformat(date_text) for date_text, _description in entries]
    for d in dates:
        assert d.year == year
    assert dates == sorted(dates), f'{year}: entries are not sorted'
    assert len(dates) == len(set(dates)), f'{year}: duplicate holiday date'


# ---- schedule behaviour via is_in_trading_hours ---------------------------------------

def test_regular_weekday_open_and_closed_boundaries():
    # 2024-01-23 is a regular Tuesday, no holiday/override.
    spec = nse_trading_hours()
    assert is_in_trading_hours(ist_ms(2024, 1, 23, 9, 15), spec) is True
    assert is_in_trading_hours(ist_ms(2024, 1, 23, 15, 29), spec) is True
    assert is_in_trading_hours(ist_ms(2024, 1, 23, 9, 14), spec) is False
    assert is_in_trading_hours(ist_ms(2024, 1, 23, 15, 30), spec) is False


def test_weekend_is_closed():
    spec = nse_trading_hours()
    # 2024-01-21 is a Sunday.
    assert is_in_trading_hours(ist_ms(2024, 1, 21, 11, 0), spec) is False


@pytest.mark.parametrize('holiday', ['2024-01-22', '2024-01-26'])
def test_holidays_closed_all_day(holiday):
    spec = nse_trading_hours()
    year, month, day = (int(part) for part in holiday.split('-'))
    assert is_in_trading_hours(ist_ms(year, month, day, 9, 30), spec) is False
    assert is_in_trading_hours(ist_ms(year, month, day, 15, 0), spec) is False


def test_muhurat_2024_11_01_open_in_the_evening_window_closed_at_regular_close():
    spec = nse_trading_hours()
    assert is_in_trading_hours(ist_ms(2024, 11, 1, 18, 30), spec) is True
    assert is_in_trading_hours(ist_ms(2024, 11, 1, 15, 29), spec) is False


def test_muhurat_2025_10_21_open_at_14_00():
    spec = nse_trading_hours()
    assert is_in_trading_hours(ist_ms(2025, 10, 21, 14, 0), spec) is True


def test_disaster_recovery_saturday_2024_03_02_two_windows():
    spec = nse_trading_hours()
    assert is_in_trading_hours(ist_ms(2024, 3, 2, 9, 30), spec) is True
    assert is_in_trading_hours(ist_ms(2024, 3, 2, 12, 0), spec) is True
    assert is_in_trading_hours(ist_ms(2024, 3, 2, 10, 30), spec) is False


def test_budget_saturday_2025_02_01_full_regular_session():
    spec = nse_trading_hours()
    assert is_in_trading_hours(ist_ms(2025, 2, 1, 15, 29), spec) is True


def test_muhurat_2023_11_12_open_at_18_30():
    spec = nse_trading_hours()
    assert is_in_trading_hours(ist_ms(2023, 11, 12, 18, 30), spec) is True


# ---- closed/overrides invariants -------------------------------------------------------

def test_closed_and_overrides_never_overlap():
    spec = nse_trading_hours()
    assert set(spec['closed']).isdisjoint(spec['overrides'])


def test_every_special_session_date_in_range_appears_in_overrides():
    spec = nse_trading_hours()
    first_year, last_year = min(COVERED_YEARS), max(COVERED_YEARS)
    for date_text in SPECIAL_SESSIONS:
        if first_year <= int(date_text[:4]) <= last_year:
            assert date_text in spec['overrides']


def test_sub_range_only_contains_dates_within_those_years():
    spec = nse_trading_hours(2024, 2024)
    for date_text in spec['closed']:
        assert date_text.startswith('2024-'), date_text
    for date_text in spec['overrides']:
        assert date_text.startswith('2024-'), date_text


# ---- daily-row stamping convention (see the module docstring's caveat) ----------------

def test_regular_trading_day_session_row_timestamp_is_inside_the_schedule():
    """A regular day's synthetic daily candle is stamped at 15:29 IST, which sits inside
    the 09:15-15:30 regular session, so `filter_candles_by_hours` keeps it."""
    spec = nse_trading_hours()
    row_timestamp = session_row_timestamp(dt.date(2024, 1, 23))
    assert is_in_trading_hours(row_timestamp, spec) is True


def test_muhurat_2024_11_01_session_row_timestamp_falls_outside_the_schedule():
    """Caveat from the jesse/markets/india.py module docstring: the Muhurat override
    window (18:00-19:00 IST) replaces the regular session entirely and does not contain
    the 15:29 IST daily-row stamp, so a Muhurat day's synthetic daily candle is dropped by
    `filter_candles_by_hours` for daily-only backtests."""
    spec = nse_trading_hours()
    row_timestamp = session_row_timestamp(dt.date(2024, 11, 1))
    assert is_in_trading_hours(row_timestamp, spec) is False


def test_filter_candles_by_hours_keeps_regular_row_and_drops_muhurat_row():
    spec = nse_trading_hours()
    regular_row = session_row_timestamp(dt.date(2024, 1, 23))
    muhurat_row = session_row_timestamp(dt.date(2024, 11, 1))
    candles = np.zeros((2, 6))
    candles[:, 0] = [regular_row, muhurat_row]

    kept = utils.filter_candles_by_hours(candles, spec)

    assert list(kept[:, 0]) == [regular_row]


# ---- bse == nse, fresh objects per call -------------------------------------------------

def test_bse_trading_hours_equals_nse_trading_hours():
    assert bse_trading_hours() == nse_trading_hours()


def test_each_call_returns_fresh_objects():
    first = nse_trading_hours()
    first['closed'].append('mutated')
    first['overrides']['mutated'] = ['09:00-10:00']

    second = nse_trading_hours()

    assert 'mutated' not in second['closed']
    assert 'mutated' not in second['overrides']


# ---- validation --------------------------------------------------------------------------

def test_start_year_after_end_year_raises():
    with pytest.raises(ValueError, match='after'):
        nse_trading_hours(2020, 2015)


def test_years_outside_covered_range_raise_naming_the_covered_range():
    with pytest.raises(ValueError, match=r'2011-2026'):
        nse_trading_hours(2005, 2015)
    with pytest.raises(ValueError, match=r'2011-2026'):
        nse_trading_hours(2020, 2030)


def test_start_and_end_year_default_to_none_meaning_the_full_range():
    assert nse_trading_hours(None, None) == nse_trading_hours()


# ---- JSON compatibility ---------------------------------------------------------------

def test_nse_trading_hours_is_json_dumpable():
    json.dumps(nse_trading_hours())


# ---- import isolation: jesse.markets.india must not pull in the India historical-data
# package (network/archive-cache heavy), mirroring test_india_exchange_registration.py's
# check for plain `import jesse`. Run in a fresh subprocess so this test file's own
# module-level import of jesse.services.historical_data.india.sessions above doesn't make
# the assertion trivially true within this process.
# -----------------------------------------------------------------------------------------

def test_import_markets_india_does_not_load_historical_data_india():
    result = subprocess.run(
        [
            sys.executable, '-c',
            "import jesse.markets.india, sys; "
            "assert 'jesse.services.historical_data.india' not in sys.modules",
        ],
        cwd=str(Path(__file__).resolve().parents[1]),
        capture_output=True,
        text=True,
        timeout=60,
    )

    assert result.returncode == 0, f'stdout={result.stdout!r} stderr={result.stderr!r}'
