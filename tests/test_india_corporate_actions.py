"""Tests for jesse/services/historical_data/india/corporate_actions.py and the
split/bonus price adjustment it drives in provider.py (story #7, plus the fix-up round
that followed the live smoke check). No network access: `NseCorporateActionsClient` is
exercised against a fake `IndiaHttpClient`-alike, and
`CorporateActionsStore`/`IndiaExchangeProvider` are exercised against fake
client/source/store doubles with injectable clocks - see
docs/india-markets/spike-sources.md §5 and tests/fixtures/india/
nse_corporate_actions_20240101_20240331.json for the real payload shapes this encodes.
"""
import json
import threading
import time
from datetime import date
from pathlib import Path

import pytest

import jesse.services.historical_data.india.corporate_actions as corporate_actions_module
from jesse.services.historical_data.contracts import AdjustmentMode, HistoricalCandleRange, HistoricalCandleRequest
from jesse.services.historical_data.errors import ProviderRequestError, ProviderSchemaError, ProviderUnavailableError
from jesse.services.historical_data.india.bse_archives import BseBhavcopySource, _udiff_url as _bse_udiff_url
from jesse.services.historical_data.india.corporate_actions import (
    _CORPORATE_ACTIONS_HEADERS,
    _CORPORATE_ACTIONS_REFERER,
    _CORPORATE_ACTIONS_URL_TEMPLATE,
    _NSE_HOMEPAGE_URL,
    CorporateActionsStore,
    NseCorporateActionsClient,
    UnparsedCorporateAction,
    parse_subject,
)
from jesse.services.historical_data.india.nse_archives import (
    NseBhavcopySource,
    _EQUITY_MASTER_URL,
    _ETF_MASTER_URL,
)
from jesse.services.historical_data.india.provider import IndiaExchangeProvider
from jesse.services.historical_data.india.sessions import session_row_timestamp
from jesse.services.historical_data.india.sources import DailyBar, IndiaDailySource

FIXTURES_DIR = Path(__file__).parent / 'fixtures' / 'india'

_ACTIONS_2024 = json.loads((FIXTURES_DIR / 'nse_corporate_actions_20240101_20240331.json').read_text())

# The three ALLCARGO ISIN/ex-date facts every ALLCARGO-related test below shares -
# straight from the fixture JSON (ALLCARGO's "Bonus 3:1" record, ex 02-Jan-2024).
ALLCARGO_ISIN = 'INE418H01029'
ALLCARGO_EX_DATE = date(2024, 1, 2)
# NESTLEIND's ISIN as it appears in the fixture's Jan-2024 split record (the OLD ISIN,
# per the live smoke check - see CorporateActionsStore's docstring for the reissue
# this module discovered).
NESTLEIND_ISIN = 'INE239A01016'
# NESTLEIND's ISIN as NSE's CURRENT security master reports it - live-verified
# (2026-09-23) to genuinely differ from the fixture's action-record ISIN above.
NESTLEIND_NEW_ISIN = 'INE239A01024'


def _read_fixture(name: str) -> str:
    return (FIXTURES_DIR / name).read_text()


def _actions_url(year: int) -> str:
    return _CORPORATE_ACTIONS_URL_TEMPLATE.format(
        from_date=date(year, 1, 1).strftime('%d-%m-%Y'),
        to_date=date(year, 12, 31).strftime('%d-%m-%Y'),
    )


class FakeIndiaHttpClient:
    """Stands in for IndiaHttpClient - returns scripted payloads and records, in one
    ordered log, both `.get()` calls (with their `referer`/`extra_headers`) and
    `.prime_cookies()` calls, so a test can assert priming happens before/around the
    request it protects. `fail_first_for` names URLs whose FIRST `.get()` raises a
    403 `ProviderRequestError` (simulating an expired/rejected cookie) before
    succeeding on any later call - see the cookie re-prime-and-retry tests.
    """

    def __init__(self, files: dict[str, object] | None = None, *, fail_first_for: set[str] | None = None):
        self._files = files if files is not None else {}
        self._fail_first_for = set(fail_first_for) if fail_first_for else set()
        self.calls: list[tuple] = []

    def get(self, url: str, *, expect: str, referer: str | None = None, extra_headers: dict | None = None):
        self.calls.append(('get', url, expect, referer, extra_headers))
        if url in self._fail_first_for:
            self._fail_first_for.discard(url)
            raise ProviderRequestError('www.nseindia.com rejected the request with HTTP 403')
        if url not in self._files:
            raise AssertionError(f'Unexpected GET to {url!r}')
        return self._files[url]

    def prime_cookies(self, url: str) -> None:
        self.calls.append(('prime', url))


class FakeCorporateActionsClient:
    """Stands in for NseCorporateActionsClient at the CorporateActionsStore boundary -
    `records_by_year` maps a year to either its raw records (list[dict]) or an
    Exception instance to raise for that year (simulating a failed fetch). A year not
    present at all defaults to an empty list, so tests don't need to enumerate every
    year in CORPORATE_ACTIONS_FIRST_YEAR..current_year explicitly.
    """

    def __init__(self, records_by_year: dict[int, object]):
        self._records_by_year = records_by_year
        self.calls: list[int] = []

    def fetch_year(self, year: int) -> list[dict]:
        self.calls.append(year)
        result = self._records_by_year.get(year, [])
        if isinstance(result, Exception):
            raise result
        return result


def _bonus_record(isin: str, symbol: str, ex_date_str: str, ratio: str = '1:1') -> dict:
    return {
        'isin': isin, 'symbol': symbol, 'exDate': ex_date_str, 'subject': f'Bonus {ratio}',
        'comp': symbol, 'faceVal': '1', 'series': 'EQ',
    }


def _range(start: date, end_exclusive: date) -> HistoricalCandleRange:
    return HistoricalCandleRange(session_row_timestamp(start), session_row_timestamp(end_exclusive))


# --------------------------------------------------------------------------------------
# parse_subject
# --------------------------------------------------------------------------------------

def test_parse_subject_matches_every_real_fixture_subject():
    # Every subject actually present in the fixture (bonus, two face-value splits, three
    # dividend variants) - dividends must parse to no action, not raise.
    expected = {
        'Bonus 3:1': [('bonus', 0.25)],
        'Face Value Split (Sub-Division) - From Rs10/- Per Share To Rs 5/- Per Share': [('split', 0.5)],
        'Face Value Split (Sub-Division) - From Rs10/- Per Share To Re 1/- Per Share': [('split', 0.1)],
        'Interim Dividend - Rs 7 Per Share': [],
        'Interim Dividend - Re 0.01 Per Share': [],
        'Interim Dividend - Rs 8 Per Share': [],
    }
    seen_subjects = {record['subject'] for record in _ACTIONS_2024}
    assert seen_subjects == set(expected)  # guards against the fixture silently gaining a new subject
    for subject, actions in expected.items():
        assert parse_subject(subject) == actions


@pytest.mark.parametrize('subject, expected', [
    ('Bonus 1:1', [('bonus', 0.5)]),
    ('Bonus Issue 1:2', [('bonus', 2 / 3)]),
    ('bonus  1 : 1', [('bonus', 0.5)]),  # case/spacing tolerance
    ('Bonus issue in the ratio of 2:1', [('bonus', 1 / 3)]),
])
def test_parse_subject_bonus_variants(subject, expected):
    assert parse_subject(subject) == expected


@pytest.mark.parametrize('subject, expected_factor', [
    ('Face Value Split - From Rs.10/- To Re.1/-', 0.1),   # "Rs." / "Re." with periods
    ('Sub-Division - From Rs 10/- Per Share To Rs 2/- Per Share', 0.2),
])
def test_parse_subject_split_variants(subject, expected_factor):
    assert parse_subject(subject) == [('split', expected_factor)]


def test_parse_subject_consolidation_when_face_value_rises():
    subject = 'Consolidation of Shares - From Rs 2/- Per Share To Rs 10/- Per Share'
    assert parse_subject(subject) == [('consolidation', 5.0)]


@pytest.mark.parametrize('subject', [
    'Interim Dividend - Rs 7 Per Share',
    'Final Dividend - Rs 2 Per Share',
    'Rights 1:5 - Rs 10 Per Share',  # 'rights' isn't a split/bonus/consolidation keyword
    'Annual General Meeting',
])
def test_parse_subject_ignores_non_split_bonus_actions(subject):
    assert parse_subject(subject) == []


@pytest.mark.parametrize('subject', [
    'Stock Split 5:1',                                  # 'split' mentioned, ratio phrasing (not From/To)
    'Reverse Stock Split',                               # 'split' mentioned, no ratio/amount at all
    'Sub-Division of Equity Shares',                      # mentioned, no numbers at all
    'Bonus (ratio to be announced)',                      # 'bonus' mentioned, no parseable a:b
])
def test_parse_subject_raises_for_unparseable_mentions(subject):
    with pytest.raises(UnparsedCorporateAction):
        parse_subject(subject)


@pytest.mark.parametrize('subject', [
    'Bonus 0:1',
    'Bonus 1:0',
    'Face Value Split - From Rs 10/- To Rs 10/-',  # unchanged face value - not a real split
])
def test_parse_subject_raises_for_degenerate_matched_ratios(subject):
    # A matched bonus/split clause whose numbers are nonsensical (a zero term, or "From
    # X To X") must not be silently skipped - it's a parsing/data problem, same as an
    # unmatched mention.
    with pytest.raises(UnparsedCorporateAction):
        parse_subject(subject)


@pytest.mark.parametrize('subject', [
    'Bonus Debentures 3:1',
    'Issue of Bonus Debentures in the ratio 1:1',
    'Issue of NCDs 1:1',
    'Preference Share Bonus 1:1',
    # NSE's abbreviations for preference-share classes (story #82: TVSMOTOR's real
    # ex-25-Aug-2025 subject, plus common variants) - none of these change the ordinary
    # share count, so must parse the same as any other debt/preference distribution.
    'Scheme Of Arrangement - Bonus Ncrps 4:1',  # the real TVSMOTOR subject
    'Bonus NCRPS 1:1',
    'Bonus Issue Of Ncrps',
    'Bonus Crps 1:10',
    'Bonus RPS 1:1',
    'Bonus OCRPS 2:1',
    'Bonus CCPS 1:1',  # compulsorily convertible - still a preference share at issue
])
def test_parse_subject_ignores_debt_and_preference_distributions(subject):
    # A bonus/rights debenture/NCD/bond/preference-share issue is a debt/preference
    # distribution, not an equity split/bonus - out of scope, same as a dividend, even
    # though the ratio phrasing would otherwise match `_BONUS_RE`.
    assert parse_subject(subject) == []


def test_parse_subject_still_parses_ordinary_bonus_after_ncrps_fix():
    # Guards against a too-broad debt/preference regex change swallowing genuine
    # ordinary-equity bonuses (e.g. matching "bonus" itself, or any "...rps"-ending word).
    assert parse_subject('Bonus 4:1') == [('bonus', 0.2)]


@pytest.mark.parametrize('subject', [
    # An equity bonus bundled with a preference/debt bonus in ONE clause, joined by a
    # connector `_CLAUSE_SPLIT_RE` doesn't split on ('&', a bare comma, or nothing) - the
    # clause can't be safely attributed to "just skip the debt leg", so it must raise
    # rather than silently drop the equity leg (story #82 follow-up).
    'Scheme of Arrangement - Bonus Equity Shares 1:1 & Bonus NCRPS 4:1',
    'Bonus 1:1, Bonus NCRPS 4:1',
    'Bonus Equity 1:1 Bonus Ncrps 4:1',
])
def test_parse_subject_raises_for_mixed_equity_and_debt_bundled_in_one_clause(subject):
    with pytest.raises(UnparsedCorporateAction):
        parse_subject(subject)


@pytest.mark.parametrize('subject', [
    # Same equity+NCRPS mix, but joined by a connector the splitter DOES split on - each
    # half becomes its own clause, so the debt leg is safely skippable and only the
    # equity bonus survives.
    'Bonus 1:1 / Bonus NCRPS 4:1',
    'Bonus 1:1 and Bonus NCRPS 4:1',
])
def test_parse_subject_splits_mixed_equity_and_debt_when_connector_is_split_on(subject):
    assert parse_subject(subject) == [('bonus', 0.5)]


def test_parse_subject_multi_action_split_on_slash_semicolon_and_and():
    # Real multi-action subjects are not in the fixture; this exercises the clause
    # splitter itself against all three documented separators, making sure the
    # unspaced '/' inside "Rs10/-" is never mistaken for one.
    subject = 'Bonus 1:1 / Interim Dividend - Rs 2 Per Share; Face Value Split - From Rs10/- To Rs 5/-'
    assert parse_subject(subject) == [('bonus', 0.5), ('split', 0.5)]

    assert parse_subject('Bonus 1:1 and Interim Dividend - Rs 2 Per Share') == [('bonus', 0.5)]


def test_parse_subject_multi_action_raises_when_any_clause_is_unparseable():
    # The bonus clause alone would parse fine, but the whole subject must still raise -
    # a partially-parsed multi-action subject must never look like "fully handled".
    subject = 'Bonus 1:1 and Stock Split (Reverse)'
    with pytest.raises(UnparsedCorporateAction):
        parse_subject(subject)


def test_parse_subject_mixed_equity_bonus_and_debenture_counts_only_the_equity_bonus():
    subject = 'Bonus 1:1 and Bonus Debentures 3:1'
    assert parse_subject(subject) == [('bonus', 0.5)]


# --------------------------------------------------------------------------------------
# NseCorporateActionsClient - requests/schema
# --------------------------------------------------------------------------------------

def test_fetch_year_sends_the_expected_referer_and_headers():
    client = FakeIndiaHttpClient({_actions_url(2024): _ACTIONS_2024})
    nse_client = NseCorporateActionsClient(client=client)

    records = nse_client.fetch_year(2024)

    get_calls = [call for call in client.calls if call[0] == 'get']
    assert get_calls == [
        ('get', _actions_url(2024), 'json', _CORPORATE_ACTIONS_REFERER, _CORPORATE_ACTIONS_HEADERS),
    ]
    assert len(records) == len(_ACTIONS_2024)


def test_fetch_year_builds_a_calendar_year_from_date_to_date_range():
    client = FakeIndiaHttpClient({_actions_url(2020): []})
    nse_client = NseCorporateActionsClient(client=client)

    nse_client.fetch_year(2020)

    requested_url = next(call[1] for call in client.calls if call[0] == 'get')
    assert 'from_date=01-01-2020' in requested_url
    assert 'to_date=31-12-2020' in requested_url


def test_fetch_year_raises_unavailable_when_payload_missing():
    client = FakeIndiaHttpClient({_actions_url(2024): None})
    nse_client = NseCorporateActionsClient(client=client)

    with pytest.raises(ProviderUnavailableError):
        nse_client.fetch_year(2024)


def test_fetch_year_raises_schema_error_for_non_list_payload():
    client = FakeIndiaHttpClient({_actions_url(2024): {'not': 'a list'}})
    nse_client = NseCorporateActionsClient(client=client)

    with pytest.raises(ProviderSchemaError):
        nse_client.fetch_year(2024)


def test_fetch_year_raises_schema_error_for_record_missing_required_field():
    incomplete = [{'symbol': 'FOO', 'exDate': '01-Jan-2024', 'subject': 'Bonus 1:1'}]  # no 'isin'
    client = FakeIndiaHttpClient({_actions_url(2024): incomplete})
    nse_client = NseCorporateActionsClient(client=client)

    with pytest.raises(ProviderSchemaError):
        nse_client.fetch_year(2024)


def test_fetch_year_raises_schema_error_for_record_with_null_required_field():
    # 'isin' is present but null - present-but-None must be caught the same as absent.
    records = [{'isin': None, 'symbol': 'FOO', 'exDate': '01-Jan-2024', 'subject': 'Bonus 1:1'}]
    client = FakeIndiaHttpClient({_actions_url(2024): records})
    nse_client = NseCorporateActionsClient(client=client)

    with pytest.raises(ProviderSchemaError):
        nse_client.fetch_year(2024)


# --------------------------------------------------------------------------------------
# NseCorporateActionsClient - cookie priming interval and 401/403 re-prime
# --------------------------------------------------------------------------------------

def test_fetch_year_primes_cookies_once_across_a_cold_multi_year_load():
    clock = [0.0]
    years = range(2020, 2025)
    files = {_actions_url(year): [] for year in years}
    client = FakeIndiaHttpClient(files)
    nse_client = NseCorporateActionsClient(client=client, monotonic=lambda: clock[0])

    for year in years:
        nse_client.fetch_year(year)

    prime_calls = [call for call in client.calls if call[0] == 'prime']
    assert prime_calls == [('prime', _NSE_HOMEPAGE_URL)]  # exactly one, before anything else
    assert client.calls[0] == ('prime', _NSE_HOMEPAGE_URL)


def test_fetch_year_reprimes_after_the_cookie_interval_elapses():
    clock = [0.0]
    client = FakeIndiaHttpClient({_actions_url(2024): []})
    nse_client = NseCorporateActionsClient(client=client, monotonic=lambda: clock[0])

    nse_client.fetch_year(2024)
    clock[0] += corporate_actions_module._COOKIE_PRIME_INTERVAL_SECONDS - 1  # still inside the interval
    nse_client.fetch_year(2024)
    assert len([c for c in client.calls if c[0] == 'prime']) == 1  # not yet re-primed

    clock[0] += 2  # now past the interval
    nse_client.fetch_year(2024)
    assert len([c for c in client.calls if c[0] == 'prime']) == 2


def test_fetch_year_reprimes_and_retries_once_on_403():
    client = FakeIndiaHttpClient({_actions_url(2024): _ACTIONS_2024}, fail_first_for={_actions_url(2024)})
    nse_client = NseCorporateActionsClient(client=client)

    records = nse_client.fetch_year(2024)

    assert len(records) == len(_ACTIONS_2024)  # succeeded despite the first 403
    assert len([c for c in client.calls if c[0] == 'prime']) == 2  # initial prime + the re-prime
    assert len([c for c in client.calls if c[0] == 'get']) == 2  # the failed attempt + the retry


class _AlwaysBadRequestClient:
    """A `.get()` that always 400s - re-priming cookies can never fix a malformed
    request, so this must NOT trigger the 401/403 retry path.
    """

    def __init__(self):
        self.get_calls = 0
        self.prime_calls = 0

    def get(self, url, *, expect, referer=None, extra_headers=None):
        self.get_calls += 1
        raise ProviderRequestError('www.nseindia.com rejected the request with HTTP 400')

    def prime_cookies(self, url):
        self.prime_calls += 1


def test_fetch_year_does_not_retry_a_non_auth_rejection():
    client = _AlwaysBadRequestClient()
    nse_client = NseCorporateActionsClient(client=client)

    with pytest.raises(ProviderRequestError):
        nse_client.fetch_year(2024)

    assert client.get_calls == 1  # no retry
    assert client.prime_calls == 1  # no re-prime attempted either


# --------------------------------------------------------------------------------------
# CorporateActionsStore
# --------------------------------------------------------------------------------------

@pytest.fixture
def narrow_first_year(monkeypatch):
    """Restricts CORPORATE_ACTIONS_FIRST_YEAR to 2024 for a test - avoids every store
    test walking the real (wide) default range just to reach "the" year it cares about.
    """
    monkeypatch.setattr(corporate_actions_module, 'CORPORATE_ACTIONS_FIRST_YEAR', 2024)


def test_factor_before_is_one_on_ex_date_and_applies_strictly_before_it(narrow_first_year):
    client = FakeCorporateActionsClient({2024: _ACTIONS_2024})
    store = CorporateActionsStore(client=client, today=lambda: date(2024, 6, 1))

    assert store.factor_before(ALLCARGO_ISIN, None, date(2023, 12, 29)) == 0.25  # well before ex-date
    assert store.factor_before(ALLCARGO_ISIN, None, date(2024, 1, 1)) == 0.25    # the day before ex-date
    assert store.factor_before(ALLCARGO_ISIN, None, ALLCARGO_EX_DATE) == 1.0     # on the ex-date itself


def test_factor_before_compounds_multiple_actions_for_the_same_isin(narrow_first_year):
    isin = 'INE000000001'
    records = [
        _bonus_record(isin, 'TESTCO', '10-Jan-2024', ratio='1:1'),  # factor 0.5
        _bonus_record(isin, 'TESTCO', '20-Feb-2024', ratio='1:1'),  # factor 0.5
    ]
    store = CorporateActionsStore(client=FakeCorporateActionsClient({2024: records}), today=lambda: date(2024, 6, 1))

    assert store.factor_before(isin, None, date(2024, 1, 5)) == pytest.approx(0.25)   # before both ex-dates
    assert store.factor_before(isin, None, date(2024, 1, 15)) == pytest.approx(0.5)   # between the two ex-dates
    assert store.factor_before(isin, None, date(2024, 3, 1)) == pytest.approx(1.0)    # after both ex-dates


def test_factor_before_and_unparsed_for_return_defaults_when_both_keys_are_none(narrow_first_year):
    store = CorporateActionsStore(client=FakeCorporateActionsClient({}), today=lambda: date(2024, 6, 1))

    assert store.factor_before(None, None, date(2024, 1, 1)) == 1.0
    assert store.unparsed_for(None, None) == []


def test_store_loads_years_from_first_year_through_current_year_in_order(monkeypatch):
    monkeypatch.setattr(corporate_actions_module, 'CORPORATE_ACTIONS_FIRST_YEAR', 2022)
    client = FakeCorporateActionsClient({})
    store = CorporateActionsStore(client=client, today=lambda: date(2024, 6, 1))

    store.factor_before('ANY-ISIN', None, date(2024, 1, 1))

    assert client.calls == [2022, 2023, 2024]


def test_current_year_is_refreshed_after_its_ttl_but_not_before(narrow_first_year):
    clock = [1_000.0]
    client = FakeCorporateActionsClient({2024: []})
    store = CorporateActionsStore(client=client, today=lambda: date(2024, 6, 1), monotonic=lambda: clock[0])

    store.factor_before('ANY-ISIN', None, date(2024, 1, 1))
    assert client.calls == [2024]

    clock[0] += corporate_actions_module._CURRENT_YEAR_CACHE_TTL_SECONDS - 1  # still inside the TTL
    store.factor_before('ANY-ISIN', None, date(2024, 1, 1))
    assert client.calls == [2024]  # not re-fetched

    clock[0] += 2  # now past the TTL
    store.factor_before('ANY-ISIN', None, date(2024, 1, 1))
    assert client.calls == [2024, 2024]  # re-fetched


def test_past_years_are_cached_forever_unlike_the_current_year(monkeypatch):
    monkeypatch.setattr(corporate_actions_module, 'CORPORATE_ACTIONS_FIRST_YEAR', 2023)
    clock = [1_000.0]
    client = FakeCorporateActionsClient({2023: [], 2024: []})
    store = CorporateActionsStore(client=client, today=lambda: date(2024, 6, 1), monotonic=lambda: clock[0])

    store.factor_before('ANY-ISIN', None, date(2024, 1, 1))
    assert client.calls == [2023, 2024]

    clock[0] += corporate_actions_module._CURRENT_YEAR_CACHE_TTL_SECONDS * 10  # far past any TTL
    store.factor_before('ANY-ISIN', None, date(2024, 1, 1))

    # 2023 (a fully elapsed past year) is fetched exactly once across both calls; only
    # 2024 (the current year) is fetched again.
    assert client.calls == [2023, 2024, 2024]


def test_failed_fetch_is_not_cached_and_is_retried_on_the_next_call(narrow_first_year):
    client = FakeCorporateActionsClient({2024: ProviderUnavailableError('down')})
    store = CorporateActionsStore(client=client, today=lambda: date(2024, 6, 1))

    with pytest.raises(ProviderUnavailableError):
        store.factor_before('ANY-ISIN', None, date(2024, 1, 1))

    # NSE "recovers" before the next call.
    client._records_by_year[2024] = _ACTIONS_2024

    assert store.factor_before(ALLCARGO_ISIN, None, date(2024, 1, 1)) == 0.25  # succeeded on retry


def test_unparsed_for_records_subjects_that_could_not_be_parsed(narrow_first_year):
    isin = 'INE000000002'
    records = [{'isin': isin, 'symbol': 'TESTCO', 'exDate': '10-Jan-2024', 'subject': 'Stock Split 5:1'}]
    store = CorporateActionsStore(client=FakeCorporateActionsClient({2024: records}), today=lambda: date(2024, 6, 1))

    assert store.unparsed_for(isin, None) == ['Stock Split 5:1']
    # An unparsed subject contributes no factor of its own - it is provider.py's job to
    # refuse adjustment altogether when `unparsed_for` is non-empty, not this store's.
    assert store.factor_before(isin, None, date(2024, 1, 1)) == 1.0


def test_concurrent_callers_do_not_double_fetch_the_same_year(narrow_first_year):
    isin = 'INE000000005'
    record = _bonus_record(isin, 'TESTCO3', '10-Jan-2024', ratio='1:1')

    class _SlowFakeClient(FakeCorporateActionsClient):
        def fetch_year(self, year):
            time.sleep(0.05)  # gives the second thread a real chance to contend for the lock
            return super().fetch_year(year)

    client = _SlowFakeClient({2024: [record]})
    store = CorporateActionsStore(client=client, today=lambda: date(2024, 6, 1))

    results: list[float] = []
    results_lock = threading.Lock()

    def call():
        result = store.factor_before(isin, None, date(2024, 1, 5))
        with results_lock:
            results.append(result)

    threads = [threading.Thread(target=call) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=5)

    assert client.calls.count(2024) == 1  # the store's lock prevented a double-fetch
    assert results == [pytest.approx(0.5)] * 4


# --------------------------------------------------------------------------------------
# CorporateActionsStore - ISIN reissue (fix A) and dedup (fix B)
# --------------------------------------------------------------------------------------

def test_factor_before_matches_by_symbol_when_isin_was_reissued(narrow_first_year):
    # The action record carries the OLD isin (as NSE's real feed does for NESTLEIND's
    # Jan-2024 split - see the module docstring); a "current" security master would
    # report a NEW isin for the same company. Matching by symbol - unaffected by an
    # ISIN reissue - is what recovers the action despite the mismatch.
    symbol = 'NESTLEIND'
    records = [_bonus_record(NESTLEIND_ISIN, symbol, '05-Jan-2024', ratio='9:1')]  # factor 0.1
    records[0]['subject'] = 'Bonus 9:1'
    store = CorporateActionsStore(client=FakeCorporateActionsClient({2024: records}), today=lambda: date(2024, 6, 1))

    # The "current" (reissued) ISIN alone finds nothing - it doesn't match the record's
    # OLD ISIN ...
    assert store.factor_before(NESTLEIND_NEW_ISIN, None, date(2024, 1, 4)) == 1.0
    # ... but the symbol alone finds it ...
    assert store.factor_before(None, symbol, date(2024, 1, 4)) == pytest.approx(0.1)
    # ... and passing both together (as the provider does) also finds it, deduped to
    # one hit rather than double-applying it.
    assert store.factor_before(NESTLEIND_NEW_ISIN, symbol, date(2024, 1, 4)) == pytest.approx(0.1)


def test_factor_before_dedupes_a_repeated_record_within_one_year(narrow_first_year):
    # NSE's feed can repeat a record verbatim within one year's payload.
    isin = 'INE000000003'
    record = _bonus_record(isin, 'TESTCO', '10-Jan-2024', ratio='1:1')  # factor 0.5
    store = CorporateActionsStore(
        client=FakeCorporateActionsClient({2024: [record, dict(record)]}), today=lambda: date(2024, 6, 1),
    )

    # If not deduped this would compound to 0.5 * 0.5 = 0.25.
    assert store.factor_before(isin, None, date(2024, 1, 5)) == pytest.approx(0.5)


def test_factor_before_dedupes_the_same_action_reached_via_isin_and_symbol(narrow_first_year):
    isin = 'INE000000004'
    symbol = 'TESTCO2'
    record = _bonus_record(isin, symbol, '10-Jan-2024', ratio='1:1')  # factor 0.5
    store = CorporateActionsStore(client=FakeCorporateActionsClient({2024: [record]}), today=lambda: date(2024, 6, 1))

    # Both keys resolve to the SAME underlying record (the ordinary, non-reissued case)
    # - must still count once, not compound to 0.25.
    assert store.factor_before(isin, symbol, date(2024, 1, 5)) == pytest.approx(0.5)


# --------------------------------------------------------------------------------------
# isin_for / symbol_for_isin - NSE bhavcopy / BSE bhavcopy
# --------------------------------------------------------------------------------------

def test_nse_bhavcopy_isin_for_reads_equity_and_etf_master_files():
    client = FakeIndiaHttpClient({
        _ETF_MASTER_URL: _read_fixture('nse_eq_etfseclist.csv').encode(),
        _EQUITY_MASTER_URL: _read_fixture('nse_equity_l.csv').encode(),
    })
    source = NseBhavcopySource(client=client)

    assert source.isin_for('RELIANCE') == 'INE002A01018'
    assert source.isin_for('niftybees') == 'INF204KB14I2'  # ETF master file, case-insensitive
    assert source.isin_for('DOES-NOT-EXIST') is None


def test_nse_bhavcopy_symbol_for_isin_is_the_reverse_of_isin_for():
    client = FakeIndiaHttpClient({
        _ETF_MASTER_URL: _read_fixture('nse_eq_etfseclist.csv').encode(),
        _EQUITY_MASTER_URL: _read_fixture('nse_equity_l.csv').encode(),
    })
    source = NseBhavcopySource(client=client)

    assert source.symbol_for_isin('INE002A01018') == 'RELIANCE'
    assert source.symbol_for_isin('  ine002a01018 ') == 'RELIANCE'  # strip/upper tolerance
    assert source.symbol_for_isin('INE_DOES_NOT_EXIST') is None


def test_bse_isin_for_reads_from_the_cached_recent_udiff_rows():
    today = date(2024, 7, 8)
    client = FakeIndiaHttpClient({_bse_udiff_url(today): _read_fixture('bse_bhavcopy_udiff_20240708.csv').encode()})
    source = BseBhavcopySource(client=client, today=lambda: today)

    assert source.isin_for('RELIANCE') == 'INE002A01018'
    assert source.isin_for('DOES-NOT-EXIST') is None


# --------------------------------------------------------------------------------------
# IndiaExchangeProvider - end-to-end adjustment
# --------------------------------------------------------------------------------------

class _AllcargoFakeSource(IndiaDailySource):
    """Raw (unadjusted) ALLCARGO bars, straight from
    tests/fixtures/india/nse_bhavcopy_legacy_allcargo_unadjusted_proof.csv - stands in
    for NseBhavcopySource so this test is about the provider+store adjustment math, not
    about re-proving bhavcopy parsing (already covered in test_india_nse_bhavcopy.py).
    """

    source_id = 'fake-allcargo'
    exchange = 'NSE'
    prices_adjusted = False

    def __init__(self):
        self._bars = [
            DailyBar(date(2023, 12, 29), 315.05, 323.00, 313.65, 321.70, 1_115_298.0),
            DailyBar(date(2024, 1, 1), 328.90, 346.85, 326.00, 329.05, 5_617_549.0),
            DailyBar(date(2024, 1, 2), 86.00, 98.00, 85.65, 90.10, 25_954_115.0),
        ]

    def fetch_daily_bars(self, ticker, sessions):
        return [bar for bar in self._bars if bar.session in sessions]

    def isin_for(self, ticker):
        return ALLCARGO_ISIN


class _NestleindFakeBseSource(IndiaDailySource):
    """A single synthetic BSE bar for NESTLEIND, reporting the CURRENT (reissued) ISIN
    - the same ISIN BSE and NSE's live security master both give it today, distinct
    from the OLD ISIN the fixture's action record carries (see NESTLEIND_ISIN vs
    NESTLEIND_NEW_ISIN). Proves the shared, symbol-backstopped store adjusts a BSE
    price series using NSE-sourced actions despite the reissue.
    """

    source_id = 'fake-bse-nestle'
    exchange = 'BSE'
    prices_adjusted = False

    def __init__(self):
        self._bar = DailyBar(date(2024, 1, 4), 27000.0, 27200.0, 26800.0, 27116.40, 1000.0)

    def fetch_daily_bars(self, ticker, sessions):
        return [self._bar] if self._bar.session in sessions else []

    def isin_for(self, ticker):
        return NESTLEIND_NEW_ISIN


class _FakeNseSymbolMaster:
    """Stands in for NseBhavcopySource at the provider's `nse_symbol_master` boundary."""

    def __init__(self, mapping: dict[str, str]):
        self._mapping = mapping

    def symbol_for_isin(self, isin):
        return self._mapping.get(isin)


class _IndexFakeSource(IndiaDailySource):
    """An index source whose `isin_for` would fail the test if ever called - indices
    must never even reach ISIN lookup (see IndiaExchangeProvider._resolve_adjustment).
    """

    source_id = 'fake-index'
    exchange = 'NSE'
    prices_adjusted = False

    def __init__(self):
        self._bar = DailyBar(date(2023, 12, 29), 100.0, 105.0, 99.0, 104.0, 1.0)

    def fetch_daily_bars(self, ticker, sessions):
        return [self._bar] if self._bar.session in sessions else []

    def is_index(self, ticker):
        return True

    def isin_for(self, ticker):
        raise AssertionError('isin_for must not be called for an index symbol')


class _NoIsinFakeSource(IndiaDailySource):
    source_id = 'fake-no-isin'
    exchange = 'BSE'
    prices_adjusted = False

    def __init__(self):
        self._bar = DailyBar(date(2024, 1, 1), 50.0, 51.0, 49.0, 50.5, 10.0)

    def fetch_daily_bars(self, ticker, sessions):
        return [self._bar] if self._bar.session in sessions else []

    def isin_for(self, ticker):
        return None  # e.g. a BSE-only company NSE's masters never listed


class _KnownIsinFakeSource(IndiaDailySource):
    """Same shape as `_NoIsinFakeSource`, but with a resolvable ISIN - pairs with
    `_UnparsedActionsStore` below to isolate "unparsed subject" from "unknown ISIN".
    """

    source_id = 'fake-known-isin'
    exchange = 'BSE'
    prices_adjusted = False

    def __init__(self):
        self._bar = DailyBar(date(2024, 1, 1), 50.0, 51.0, 49.0, 50.5, 10.0)

    def fetch_daily_bars(self, ticker, sessions):
        return [self._bar] if self._bar.session in sessions else []

    def isin_for(self, ticker):
        return 'INE_SOME_ISIN'


class _PennyStockFakeSource(IndiaDailySource):
    source_id = 'fake-penny'
    exchange = 'NSE'
    prices_adjusted = False

    def __init__(self):
        self._bar = DailyBar(date(2024, 1, 1), 0.05, 0.05, 0.05, 0.05, 1000.0)

    def fetch_daily_bars(self, ticker, sessions):
        return [self._bar] if self._bar.session in sessions else []

    def isin_for(self, ticker):
        return 'INE_PENNY_ISIN'


class _UnparsedActionsStore:
    """A minimal CorporateActionsStore double whose security always has an unparsed
    subject - used to prove provider.py refuses to guess a factor in that case.
    """

    def factor_before(self, isin, nse_symbol, session):
        raise AssertionError('factor_before must not be consulted once unparsed_for is non-empty')

    def unparsed_for(self, isin, nse_symbol):
        return ['Stock Split 5:1 (could not parse)']


class _FixedFactorStore:
    def __init__(self, factor: float):
        self._factor = factor

    def unparsed_for(self, isin, nse_symbol):
        return []

    def factor_before(self, isin, nse_symbol, session):
        return self._factor


class _OnceUnparsedThenCleanStore:
    """Returns an unparsed subject on its first `unparsed_for` call, then none - used to
    prove `adjustment_warnings` reflects only the most recent fetch (fix D).
    """

    def __init__(self):
        self.call_count = 0

    def unparsed_for(self, isin, nse_symbol):
        self.call_count += 1
        return ['Stock Split 5:1'] if self.call_count == 1 else []

    def factor_before(self, isin, nse_symbol, session):
        return 1.0


@pytest.fixture
def allcargo_store(narrow_first_year) -> CorporateActionsStore:
    # `narrow_first_year` keeps this to loading just 2024 - the fixture-derived actions
    # (ALLCARGO's bonus, NESTLEIND's split) are all dated within it.
    return CorporateActionsStore(client=FakeCorporateActionsClient({2024: _ACTIONS_2024}), today=lambda: date(2024, 6, 1))


def test_split_adjusted_request_adjusts_allcargo_prices_and_volume_around_the_bonus(allcargo_store):
    provider = IndiaExchangeProvider('NSE', source=_AllcargoFakeSource(), corporate_actions_store=allcargo_store)
    request = HistoricalCandleRequest(
        'ALLCARGO-INR', '1m', _range(date(2023, 12, 29), date(2024, 1, 3)),
        adjustment_mode=AdjustmentMode.SPLIT_ADJUSTED,
    )

    batch = provider.fetch_candles(request)

    assert [round(candle.close, 4) for candle in batch.candles] == [80.425, 82.2625, 90.10]
    assert [round(candle.open, 4) for candle in batch.candles] == [
        round(315.05 * 0.25, 4), round(328.90 * 0.25, 4), 86.00,
    ]
    # Volume divided by the same factor (0.25) for the two pre-ex-date sessions, and
    # left untouched on the ex-date itself.
    assert batch.candles[0].volume == pytest.approx(1_115_298.0 / 0.25)
    assert batch.candles[1].volume == pytest.approx(5_617_549.0 / 0.25)
    assert batch.candles[2].volume == pytest.approx(25_954_115.0)


def test_none_adjustment_mode_returns_raw_allcargo_prices(allcargo_store):
    provider = IndiaExchangeProvider('NSE', source=_AllcargoFakeSource(), corporate_actions_store=allcargo_store)
    request = HistoricalCandleRequest(
        'ALLCARGO-INR', '1m', _range(date(2023, 12, 29), date(2024, 1, 3)), adjustment_mode=AdjustmentMode.NONE,
    )

    batch = provider.fetch_candles(request)

    assert [candle.close for candle in batch.candles] == [321.70, 329.05, 90.10]
    assert batch.candles[0].volume == 1_115_298.0


def test_index_symbol_is_never_adjusted(allcargo_store):
    provider = IndiaExchangeProvider('NSE', source=_IndexFakeSource(), corporate_actions_store=allcargo_store)
    request = HistoricalCandleRequest(
        'NIFTY-INR', '1m', _range(date(2023, 12, 29), date(2023, 12, 30)), adjustment_mode=AdjustmentMode.SPLIT_ADJUSTED,
    )

    batch = provider.fetch_candles(request)  # would raise via _IndexFakeSource.isin_for if adjustment were attempted

    assert batch.candles[0].close == 104.0
    assert provider.adjustment_warnings('NIFTY-INR') == []


def test_unknown_isin_gives_unadjusted_bars_and_a_warning(allcargo_store):
    provider = IndiaExchangeProvider('BSE', source=_NoIsinFakeSource(), corporate_actions_store=allcargo_store)
    request = HistoricalCandleRequest(
        'SOMECO-INR', '1m', _range(date(2024, 1, 1), date(2024, 1, 2)), adjustment_mode=AdjustmentMode.SPLIT_ADJUSTED,
    )

    batch = provider.fetch_candles(request)

    assert batch.candles[0].close == 50.5  # unadjusted
    warnings = provider.adjustment_warnings('SOMECO-INR')
    assert len(warnings) == 1
    assert 'unknown to NSE corporate actions' in warnings[0]


def test_unparsed_corporate_action_gives_unadjusted_bars_and_a_warning():
    provider = IndiaExchangeProvider('BSE', source=_KnownIsinFakeSource(), corporate_actions_store=_UnparsedActionsStore())
    request = HistoricalCandleRequest(
        'SOMECO-INR', '1m', _range(date(2024, 1, 1), date(2024, 1, 2)), adjustment_mode=AdjustmentMode.SPLIT_ADJUSTED,
    )

    batch = provider.fetch_candles(request)

    assert batch.candles[0].close == 50.5  # unadjusted
    warnings = provider.adjustment_warnings('SOMECO-INR')
    assert len(warnings) == 1
    assert 'unparsed corporate-action subject' in warnings[0]


def test_adjustment_warnings_reflect_only_the_most_recent_fetch():
    provider = IndiaExchangeProvider('BSE', source=_KnownIsinFakeSource(), corporate_actions_store=_OnceUnparsedThenCleanStore())
    request = HistoricalCandleRequest(
        'SOMECO-INR', '1m', _range(date(2024, 1, 1), date(2024, 1, 2)), adjustment_mode=AdjustmentMode.SPLIT_ADJUSTED,
    )

    provider.fetch_candles(request)
    assert len(provider.adjustment_warnings('SOMECO-INR')) == 1  # warned on the first fetch

    provider.fetch_candles(request)
    assert provider.adjustment_warnings('SOMECO-INR') == []  # the second fetch had nothing to warn about


def test_bse_adjusts_nestleind_despite_isin_reissue_via_symbol_match(allcargo_store):
    # allcargo_store's NESTLEIND action record carries the OLD isin (per the fixture);
    # BSE (and NSE's own CURRENT security master) both report a DIFFERENT (reissued)
    # isin - the live-confirmed NESTLEIND pattern (see CorporateActionsStore's
    # docstring). Matching by symbol as well as ISIN is what recovers the action.
    nse_symbol_master = _FakeNseSymbolMaster({NESTLEIND_NEW_ISIN: 'NESTLEIND'})
    provider = IndiaExchangeProvider(
        'BSE', source=_NestleindFakeBseSource(), corporate_actions_store=allcargo_store,
        nse_symbol_master=nse_symbol_master,
    )
    request = HistoricalCandleRequest(
        'NESTLEIND-INR', '1m', _range(date(2024, 1, 4), date(2024, 1, 5)), adjustment_mode=AdjustmentMode.SPLIT_ADJUSTED,
    )

    batch = provider.fetch_candles(request)

    assert batch.candles[0].close == pytest.approx(2711.64)  # 27116.40 * 0.1
    assert batch.candles[0].volume == pytest.approx(10000.0)  # 1000.0 / 0.1
    assert provider.adjustment_warnings('NESTLEIND-INR') == []


def test_capabilities_advertise_split_adjusted_for_a_raw_price_source():
    provider = IndiaExchangeProvider('NSE', source=_AllcargoFakeSource())

    assert provider.capabilities.adjustment_modes == (AdjustmentMode.SPLIT_ADJUSTED,)
    assert provider.capabilities.default_adjustment_mode == AdjustmentMode.SPLIT_ADJUSTED


def test_extreme_adjustment_factor_keeps_unrounded_price_instead_of_a_fabricated_zero():
    # 0.05 * 0.0001 = 0.000005, which rounds to 0.0000 at 4dp - the fallback must keep
    # the full-precision value instead of reporting a "free" price.
    provider = IndiaExchangeProvider(
        'NSE', source=_PennyStockFakeSource(), corporate_actions_store=_FixedFactorStore(0.0001),
    )
    request = HistoricalCandleRequest(
        'PENNY-INR', '1m', _range(date(2024, 1, 1), date(2024, 1, 2)), adjustment_mode=AdjustmentMode.SPLIT_ADJUSTED,
    )

    batch = provider.fetch_candles(request)

    candle = batch.candles[0]
    assert candle.close == pytest.approx(0.000005)
    assert candle.open == pytest.approx(0.000005)
    # HistoricalCandle's own OHLC-ordering invariant still holds (construction would
    # have raised HistoricalCandleValidationError otherwise).
    assert candle.high >= max(candle.open, candle.close)
    assert candle.low <= min(candle.open, candle.close)
