"""NSE/BSE trading-hours presets for `Strategy.trading_hours()`.

Usage in a strategy::

    from jesse.markets.india import nse_trading_hours

    class MyStrategy(Strategy):
        def trading_hours(self):
            return nse_trading_hours()

The returned dict is a plain `jesse.services.trading_hours` schedule spec (see that
module's docstring for the format); `utils.filter_candles_by_hours(candles, spec)` and
`utils.is_in_trading_hours(timestamp, spec)` consume it directly, as does the
`trading_hours()` hook on `Strategy`.

Holiday coverage is 2011-2026 (see `NSE_HOLIDAYS`/`COVERED_YEARS`); `nse_trading_hours()`
raises `ValueError` if asked for a year outside that range. Dates outside the covered
range are simply not known to be holidays here and are treated as regular weekdays -
callers needing years before 2011 or after 2026 must supply their own overrides.

Important caveat for daily data: the India daily importer stores each trading session as a
single synthetic 1m candle stamped at 15:29 IST, inside the regular 09:15-15:30 window (see
`jesse.services.historical_data.india.sessions`). A special session whose window does not
contain 15:29 IST - the Muhurat sessions and the SEBI disaster-recovery Saturdays in
`SPECIAL_SESSIONS`, all of which sit outside 09:15-15:30 - will have its one daily row fall
outside the override window and therefore get dropped by `filter_candles_by_hours`. These
presets describe the real exchange schedule and are most useful once intraday (sub-daily)
India data is imported; for daily-only backtests the special-session overrides are inert.
"""
from __future__ import annotations

# Source: NSE's official trading-holiday API `https://www.nseindia.com/api/holiday-master
# ?type=trading&year=<Y>`, segment "CM" (capital market/equities), fetched 2026-09-24.
# The endpoint returns nothing for years before 2011. A few entries fall on a weekend
# (harmless - they're already outside `hours`); descriptions ending in '*' are Diwali
# Laxmi Pujan days that also carry an evening Muhurat session (see `SPECIAL_SESSIONS`).
NSE_HOLIDAYS: dict[int, tuple[tuple[str, str], ...]] = {
    2011: (
        ('2011-01-26', 'Republic Day'),
        ('2011-03-02', 'Mahashivratri'),
        ('2011-04-12', 'Ram Navmi'),
        ('2011-04-14', 'Dr. Babasaheb Ambedkar Jayanti'),
        ('2011-04-22', 'Good Friday'),
        ('2011-08-15', 'Independence Day'),
        ('2011-08-31', 'Ramzan ID'),
        ('2011-09-01', 'Ganesh Chaturthi'),
        ('2011-10-06', 'Dussera'),
        ('2011-10-26', 'Diwali (Laxmi Pujan)*'),
        ('2011-10-27', 'Diwali (Balipratipada)'),
        ('2011-11-07', 'Bakri Id'),
        ('2011-11-10', 'Gurunanak Jayanti'),
        ('2011-12-06', 'Moharram'),
    ),
    2012: (
        ('2012-01-01', 'New Year'),
        ('2012-01-26', 'Republic Day'),
        ('2012-02-20', 'Mahashivratri'),
        ('2012-03-08', 'Holi'),
        ('2012-04-01', 'Ram Navami'),
        ('2012-04-05', 'Mahavir Jayanti'),
        ('2012-04-06', 'Good Friday'),
        ('2012-04-14', 'Ambedkar Jayanti'),
        ('2012-04-28', 'Special Live Trading'),
        ('2012-05-01', 'May Day'),
        ('2012-08-15', 'Independence Day'),
        ('2012-08-20', 'Ramzan Id'),
        ('2012-09-08', 'Special Live Trading'),
        ('2012-09-19', 'Ganesh Chaturthi'),
        ('2012-10-02', 'Gandhi Jayanti'),
        ('2012-10-24', 'Dasara'),
        ('2012-10-27', 'Bakri Id'),
        ('2012-11-11', 'Dhanteras Trading'),
        ('2012-11-14', 'Diwali-Balipratipada'),
        ('2012-11-25', 'Moharram'),
        ('2012-11-28', 'Gurunanak Jayanti'),
        ('2012-12-25', 'Christmas'),
    ),
    2013: (
        ('2013-01-26', 'Republic Day'),
        ('2013-03-10', 'Mahashivratri'),
        ('2013-03-27', 'Holi'),
        ('2013-03-29', 'Good Friday'),
        ('2013-04-14', 'Dr. Ambedkar Jayanti'),
        ('2013-04-19', 'Ram Navmi'),
        ('2013-04-24', 'Mahavir Jayanti'),
        ('2013-05-01', 'May Day'),
        ('2013-08-09', 'Ramzan ID'),
        ('2013-08-15', 'Independence Day'),
        ('2013-09-09', 'Ganesh Chaturthi'),
        ('2013-10-02', 'Gandhi Jayanti'),
        ('2013-10-13', 'Dasera'),
        ('2013-10-16', 'Bakri ID'),
        ('2013-11-03', 'Diwali-Laxmi Puja*'),
        ('2013-11-04', 'Diwali-Balipratipada'),
        ('2013-11-15', 'Moharram'),
        ('2013-11-17', 'Gurunank Jayanti'),
        ('2013-12-25', 'Christmas'),
    ),
    2014: (
        ('2014-01-26', 'Republic Day'),
        ('2014-02-27', 'Mahashivratri'),
        ('2014-03-17', 'Holi'),
        ('2014-04-08', 'Ram Navmi'),
        ('2014-04-13', 'Mahavir Jayanti'),
        ('2014-04-14', 'Dr. Babasaheb Ambedkar Jayanti'),
        ('2014-04-18', 'Good Friday'),
        ('2014-04-24', 'Parlimentary Elections'),
        ('2014-05-01', 'May Day'),
        ('2014-07-29', 'Ramzan ID'),
        ('2014-08-15', 'Independence Day'),
        ('2014-08-29', 'Ganesh Chaturthi'),
        ('2014-10-02', 'Mahatma Gandhi Jayanti'),
        ('2014-10-03', 'Dasera'),
        ('2014-10-06', 'Bakri ID'),
        ('2014-10-15', 'General Assembly Elections'),
        ('2014-10-24', 'Diwali-Balipratipada'),
        ('2014-11-04', 'Moharram'),
        ('2014-11-06', 'Gurunank Jayanti'),
        ('2014-12-25', 'Christmas'),
    ),
    2015: (
        ('2015-01-26', 'Republic Day'),
        ('2015-02-17', 'Mahashivratri'),
        ('2015-02-28', 'Union Budget'),
        ('2015-03-06', 'Holi'),
        ('2015-03-28', 'Ram Navami'),
        ('2015-04-02', 'Mahavir Jayanti'),
        ('2015-04-03', 'Good Friday'),
        ('2015-04-14', 'Dr. Baba Saheb Ambedkar Jayanti'),
        ('2015-05-01', 'Maharashtra Day'),
        ('2015-07-18', 'Id-uI-Fitar (Ramzan ID)'),
        ('2015-08-15', 'Independence Day'),
        ('2015-09-17', 'Ganesh Chaturthi'),
        ('2015-09-25', 'Bakri ID'),
        ('2015-10-02', 'Mahatma Gandhi Jayanti'),
        ('2015-10-22', 'Dussehra'),
        ('2015-10-24', 'Muharram'),
        ('2015-11-12', 'Diwali-Balipratipada'),
        ('2015-11-25', 'Gurunanak Jayanti'),
        ('2015-12-25', 'Christmas'),
    ),
    2016: (
        ('2016-01-26', 'Republic Day'),
        ('2016-03-07', 'Mahashivratri'),
        ('2016-03-24', 'Holi'),
        ('2016-03-25', 'Good Friday'),
        ('2016-04-14', 'Dr. Baba Saheb Ambedkar Jayanti'),
        ('2016-04-15', 'Ram Navami'),
        ('2016-04-19', 'Mahavir Jayanti'),
        ('2016-05-01', 'Maharashtra Day'),
        ('2016-07-06', 'Id-uI-Fitar (Ramzan ID)'),
        ('2016-08-15', 'Independence Day'),
        ('2016-09-05', 'Ganesh Chaturthi'),
        ('2016-09-13', 'Bakri ID'),
        ('2016-10-02', 'Mahatma Gandhi Jayanti'),
        ('2016-10-11', 'Dasera'),
        ('2016-10-12', 'Moharram'),
        ('2016-10-30', 'Diwali-Laxmi Pujan*'),
        ('2016-10-31', 'Diwali-Balipratipada'),
        ('2016-11-14', 'Gurunanak Jayanti'),
        ('2016-12-25', 'Christmas'),
    ),
    2017: (
        ('2017-01-26', 'Republic Day'),
        ('2017-02-24', 'Mahashivratri'),
        ('2017-03-13', 'Holi'),
        ('2017-04-04', 'Ram Navami'),
        ('2017-04-09', 'Mahavir Jayanti'),
        ('2017-04-14', 'Dr.Baba Saheb Ambedkar Jayanti/ Good Friday'),
        ('2017-05-01', 'Maharashtra Day'),
        ('2017-06-26', 'Id-Ul-Fitr (Ramzan ID)'),
        ('2017-08-15', 'Independence Day'),
        ('2017-08-25', 'Ganesh Chaturthi'),
        ('2017-09-02', 'Bakri ID'),
        ('2017-09-30', 'Dasera'),
        ('2017-10-01', 'Moharram'),
        ('2017-10-02', 'Mahatama Gandhi Jayanti'),
        ('2017-10-20', 'Diwali-Balipratipada'),
        ('2017-11-04', 'Gurunanak Jayanti'),
        ('2017-12-25', 'Christmas'),
    ),
    2018: (
        ('2018-01-26', 'Republic Day'),
        ('2018-02-13', 'Mahashivratri'),
        ('2018-03-02', 'Holi'),
        ('2018-03-25', 'Ram Navami'),
        ('2018-03-29', 'Mahavir Jayanti'),
        ('2018-03-30', 'Good Friday'),
        ('2018-04-14', 'Dr.Baba Saheb Ambedkar Jayanti'),
        ('2018-05-01', 'Maharashtra Day'),
        ('2018-06-16', 'Id-Ul-Fitr (Ramzan ID)'),
        ('2018-08-15', 'Independence Day'),
        ('2018-08-22', 'Bakri ID'),
        ('2018-09-13', 'Ganesh Chaturthi'),
        ('2018-09-20', 'Moharram'),
        ('2018-10-02', 'Mahatama Gandhi Jayanti'),
        ('2018-10-18', 'Dasera'),
        ('2018-11-08', 'Diwali-Balipratipada'),
        ('2018-11-23', 'Gurunanak Jayanti'),
        ('2018-12-25', 'Christmas'),
    ),
    2019: (
        ('2019-01-26', 'Republic Day'),
        ('2019-03-04', 'Mahashivratri'),
        ('2019-03-21', 'Holi'),
        ('2019-04-13', 'Ram Navami'),
        ('2019-04-14', 'Dr.Baba Saheb Ambedkar Jayanti'),
        ('2019-04-17', 'Mahavir Jayanti'),
        ('2019-04-19', 'Good Friday'),
        ('2019-04-29', 'Parliamentary Elections'),
        ('2019-05-01', 'Maharashtra Day'),
        ('2019-06-05', 'Id-Ul-Fitr (Ramzan ID)'),
        ('2019-08-12', 'Bakri Id'),
        ('2019-08-15', 'Independence Day'),
        ('2019-09-02', 'Ganesh Chaturthi'),
        ('2019-09-10', 'Moharram'),
        ('2019-10-02', 'Mahatma Gandhi Jayanti'),
        ('2019-10-08', 'Dasera'),
        ('2019-10-21', 'General Assembly Elections in Maharashtra'),
        ('2019-10-27', 'Diwali-Laxmi Pujan*'),
        ('2019-10-28', 'Diwali-Balipratipada'),
        ('2019-11-12', 'Gurunanak Jayanti'),
        ('2019-12-25', 'Christmas'),
    ),
    2020: (
        ('2020-01-26', 'Republic Day'),
        ('2020-02-21', 'Mahashivratri'),
        ('2020-03-10', 'Holi'),
        ('2020-04-02', 'Ram Navami'),
        ('2020-04-06', 'Mahavir Jayanti'),
        ('2020-04-10', 'Good Friday'),
        ('2020-04-14', 'Dr.Baba Saheb Ambedkar Jayanti'),
        ('2020-05-01', 'Maharashtra Day'),
        ('2020-05-25', 'Id-Ul-Fitr (Ramzan ID)'),
        ('2020-08-01', 'Bakri Id'),
        ('2020-08-15', 'Independence Day'),
        ('2020-08-22', 'Ganesh Chaturthi'),
        ('2020-08-30', 'Moharram'),
        ('2020-10-02', 'Mahatma Gandhi Jayanti'),
        ('2020-10-25', 'Dasera'),
        ('2020-11-14', 'Diwali-Laxmi Pujan*'),
        ('2020-11-16', 'Diwali-Balipratipada'),
        ('2020-11-30', 'Gurunanak Jayanti'),
        ('2020-12-25', 'Christmas'),
    ),
    2021: (
        ('2021-01-26', 'Republic Day'),
        ('2021-03-11', 'Mahashivratri'),
        ('2021-03-29', 'Holi'),
        ('2021-04-02', 'Good Friday'),
        ('2021-04-14', 'Dr.Baba Saheb Ambedkar Jayanti'),
        ('2021-04-21', 'Ram Navami'),
        ('2021-04-25', 'Mahavir Jayanti'),
        ('2021-05-01', 'Maharashtra Day'),
        ('2021-05-13', 'Id-Ul-Fitr (Ramzan ID)'),
        ('2021-07-21', 'Bakri Id'),
        ('2021-08-15', 'Independence Day'),
        ('2021-08-19', 'Moharram'),
        ('2021-09-10', 'Ganesh Chaturthi'),
        ('2021-10-02', 'Mahatma Gandhi Jayanti'),
        ('2021-10-15', 'Dussehra'),
        ('2021-11-05', 'Diwali-Balipratipada'),
        ('2021-11-19', 'Gurunanak Jayanti'),
        ('2021-12-25', 'Christmas'),
    ),
    2022: (
        ('2022-01-26', 'Republic Day'),
        ('2022-03-01', 'Mahashivratri'),
        ('2022-03-18', 'Holi'),
        ('2022-04-10', 'Ram Navami'),
        ('2022-04-14', 'Dr.Baba Saheb Ambedkar Jayanti/Mahavir Jayanti'),
        ('2022-04-15', 'Good Friday'),
        ('2022-05-01', 'Maharashtra Day'),
        ('2022-05-03', 'Id-Ul-Fitr (Ramzan ID)'),
        ('2022-07-10', 'Bakri Id'),
        ('2022-08-09', 'Moharram'),
        ('2022-08-15', 'Independence Day'),
        ('2022-08-31', 'Ganesh Chaturthi'),
        ('2022-10-02', 'Mahatma Gandhi Jayanti'),
        ('2022-10-05', 'Dussehra'),
        ('2022-10-26', 'Diwali-Balipratipada'),
        ('2022-11-08', 'Gurunanak Jayanti'),
        ('2022-12-25', 'Christmas'),
    ),
    2023: (
        ('2023-01-26', 'Republic Day'),
        ('2023-02-18', 'Mahashivratri'),
        ('2023-03-07', 'Holi'),
        ('2023-03-30', 'Ram Navami'),
        ('2023-04-04', 'Mahavir Jayanti'),
        ('2023-04-07', 'Good Friday'),
        ('2023-04-14', 'Dr. Baba Saheb Ambedkar Jayanti'),
        ('2023-04-22', 'Id-Ul-Fitr (Ramzan ID)'),
        ('2023-05-01', 'Maharashtra Day'),
        ('2023-06-29', 'Bakri Id'),
        ('2023-07-29', 'Moharram'),
        ('2023-08-15', 'Independence Day'),
        ('2023-09-19', 'Ganesh Chaturthi'),
        ('2023-10-02', 'Mahatma Gandhi Jayanti'),
        ('2023-10-24', 'Dussehra'),
        ('2023-11-12', 'Diwali-Laxmi Pujan*'),
        ('2023-11-14', 'Diwali-Balipratipada'),
        ('2023-11-27', 'Gurunanak Jayanti'),
        ('2023-12-25', 'Christmas'),
    ),
    2024: (
        ('2024-01-22', 'Special Holiday'),
        ('2024-01-26', 'Republic Day'),
        ('2024-03-02', 'Special Live Trading'),
        ('2024-03-08', 'Mahashivratri'),
        ('2024-03-25', 'Holi'),
        ('2024-03-29', 'Good Friday'),
        ('2024-04-11', 'Id-Ul-Fitr (Ramadan Eid)'),
        ('2024-04-14', 'Dr. Baba Saheb Ambedkar Jayanti'),
        ('2024-04-17', 'Shri Ram Navmi'),
        ('2024-04-21', 'Shri Mahavir Jayanti'),
        ('2024-05-01', 'Maharashtra Day'),
        ('2024-05-20', 'General Parliamentary Elections'),
        ('2024-06-17', 'Bakri Id'),
        ('2024-07-17', 'Moharram'),
        ('2024-08-15', 'Independence Day'),
        ('2024-09-07', 'Ganesh Chaturthi'),
        ('2024-10-02', 'Mahatma Gandhi Jayanti'),
        ('2024-10-12', 'Dussehra'),
        ('2024-11-02', 'Balipratipada'),
        ('2024-11-15', 'Prakash Gurpurb Sri Guru Nanak Dev'),
        ('2024-11-20', 'Assembly Elections in Maharashtra'),
        ('2024-12-25', 'Christmas'),
    ),
    2025: (
        ('2025-01-26', 'Republic Day'),
        ('2025-02-26', 'Mahashivratri'),
        ('2025-03-14', 'Holi'),
        ('2025-03-31', 'Id-Ul-Fitr (Ramadan Eid)'),
        ('2025-04-06', 'Shri Ram Navami'),
        ('2025-04-10', 'Shri Mahavir Jayanti'),
        ('2025-04-14', 'Dr. Baba Saheb Ambedkar Jayanti'),
        ('2025-04-18', 'Good Friday'),
        ('2025-05-01', 'Maharashtra Day'),
        ('2025-06-07', 'Bakri Id'),
        ('2025-07-06', 'Muharram'),
        ('2025-08-15', 'Independence Day / Parsi New Year'),
        ('2025-08-27', 'Shri Ganesh Chaturthi'),
        ('2025-10-02', 'Mahatma Gandhi Jayanti/Dussehra'),
        ('2025-10-21', 'Diwali Laxmi Pujan'),
        ('2025-10-22', 'Balipratipada'),
        ('2025-11-05', 'Prakash Gurpurb Sri Guru Nanak Dev'),
        ('2025-12-25', 'Christmas'),
    ),
    2026: (
        ('2026-01-15', 'Municipal Corporation Election - Maharashtra'),
        ('2026-01-26', 'Republic Day'),
        ('2026-02-15', 'Mahashivratri'),
        ('2026-03-03', 'Holi'),
        ('2026-03-21', 'Id-Ul-Fitr (Ramadan Eid)'),
        ('2026-03-26', 'Shri Ram Navami'),
        ('2026-03-31', 'Shri Mahavir Jayanti'),
        ('2026-04-03', 'Good Friday'),
        ('2026-04-14', 'Dr. Baba Saheb Ambedkar Jayanti'),
        ('2026-05-01', 'Maharashtra Day'),
        ('2026-05-28', 'Bakri Id'),
        ('2026-06-26', 'Muharram'),
        ('2026-08-15', 'Independence Day'),
        ('2026-09-14', 'Ganesh Chaturthi'),
        ('2026-10-02', 'Mahatma Gandhi Jayanti'),
        ('2026-10-20', 'Dussehra'),
        ('2026-11-08', 'Diwali Laxmi Pujan*'),
        ('2026-11-10', 'Diwali-Balipratipada'),
        ('2026-11-24', 'Prakash Gurpurb Sri Guru Nanak Dev'),
        ('2026-12-25', 'Christmas'),
    ),
}

# NSE/BSE equity ("Capital Market") normal-market session.
IST_TIMEZONE = 'Asia/Kolkata'
REGULAR_SESSION = '09:15-15:30'

# Trading days that NSE lists as holidays in NSE_HOLIDAYS but that actually traded, plus a
# few genuine non-holiday special sessions - each entry replaces the plain closure with the
# real window(s) that traded. Verified against NSE's published bhavcopy archive (a bhavcopy
# exists for the date) unless noted otherwise; see the story write-up for the one-off check.
SPECIAL_SESSIONS: dict[str, tuple[str, ...]] = {
    # Muhurat (Samvat new-year) sessions: a short symbolic evening session. Times below are
    # confirmed from NSE circulars; Muhurat is held every year but only these three years'
    # timings have been verified here, so earlier years (and the not-yet-announced 2026-11-08)
    # are deliberately left as closed, matching NSE_HOLIDAYS.
    '2023-11-12': ('18:15-19:15',),
    '2024-11-01': ('18:00-19:00',),
    '2025-10-21': ('13:45-14:45',),
    # Budget-day Saturdays on which NSE ran a full regular session (bhavcopy confirmed).
    '2020-02-01': (REGULAR_SESSION,),
    '2025-02-01': (REGULAR_SESSION,),
    '2015-02-28': (REGULAR_SESSION,),
    # SEBI-mandated Business Continuity Plan (disaster-recovery) live trading sessions run
    # from the DR site, split into two short windows (bhavcopy confirmed for all three).
    '2024-01-20': ('09:15-10:00', '11:30-12:30'),
    '2024-03-02': ('09:15-10:00', '11:30-12:30'),
    '2024-05-18': ('09:15-10:00', '11:30-12:30'),
}

COVERED_YEARS = range(min(NSE_HOLIDAYS), max(NSE_HOLIDAYS) + 1)


def _trading_hours(start_year: int | None, end_year: int | None) -> dict:
    """Shared builder behind `nse_trading_hours`/`bse_trading_hours` (same calendar for both)."""
    first_year, last_year = min(COVERED_YEARS), max(COVERED_YEARS)
    start_year = first_year if start_year is None else start_year
    end_year = last_year if end_year is None else end_year
    if start_year > end_year:
        raise ValueError(f"trading hours: start_year {start_year} is after end_year {end_year}")
    if start_year < first_year or end_year > last_year:
        raise ValueError(
            f"trading hours: years {start_year}-{end_year} are outside the covered range "
            f"{first_year}-{last_year}"
        )

    overrides = {
        date_text: list(windows)
        for date_text, windows in SPECIAL_SESSIONS.items()
        if start_year <= int(date_text[:4]) <= end_year
    }
    closed = [
        date_text
        for year in range(start_year, end_year + 1)
        for date_text, _description in NSE_HOLIDAYS[year]
        if date_text not in overrides
    ]
    return {
        'timezone': IST_TIMEZONE,
        'hours': {'Mon-Fri': REGULAR_SESSION},
        'closed': closed,
        'overrides': overrides,
    }


def nse_trading_hours(start_year: int | None = None, end_year: int | None = None) -> dict:
    """NSE equity trading-hours schedule for `Strategy.trading_hours()`.

    Defaults to the full covered range (`COVERED_YEARS`). Returns a fresh dict on every
    call - callers may mutate the result without affecting the module's constants.
    """
    return _trading_hours(start_year, end_year)


def bse_trading_hours(start_year: int | None = None, end_year: int | None = None) -> dict:
    """BSE equity trading-hours schedule.

    NSE and BSE share the same equity-segment holiday calendar and regular-session times,
    so this simply reuses the NSE builder.
    """
    return _trading_hours(start_year, end_year)
