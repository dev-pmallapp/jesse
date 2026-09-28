"""Tests for `jesse.services.equity_catalog` (dev-pmallapp/jesse - equities dashboard
follow-up: search-as-you-type was too slow re-fetching the NSE/BSE catalog and
re-scanning every cached universe snapshot on every request).

Each `_TTLCache` instance is process-local module state, so every test clears both
caches first (via the `clear_caches` autouse fixture) - otherwise an earlier test's
cached value would leak into a later one.
"""
from unittest.mock import patch

import pytest

from jesse.services import equity_catalog


@pytest.fixture(autouse=True)
def clear_caches():
    equity_catalog.clear_caches()
    yield
    equity_catalog.clear_caches()


class _FakeClock:
    """An injectable `monotonic`-shaped clock a test can advance explicitly, instead of
    sleeping for real to exercise TTL expiry."""

    def __init__(self, start: float = 0.0):
        self.now = start

    def __call__(self) -> float:
        return self.now

    def advance(self, seconds: float) -> None:
        self.now += seconds


# --------------------------------------------------------------- get_catalog_entries --

def test_second_call_within_ttl_does_not_refetch():
    calls = []

    def fake_list_symbol_entries(self):
        calls.append(1)
        return ('entry-1',)

    clock = _FakeClock()
    with patch('jesse.services.historical_data.india.exchange_providers.NseProvider.list_symbol_entries', fake_list_symbol_entries):
        first = equity_catalog.get_catalog_entries('NSE', monotonic=clock)
        second = equity_catalog.get_catalog_entries('NSE', monotonic=clock)

    assert first == ('entry-1',)
    assert second == ('entry-1',)
    assert len(calls) == 1


def test_a_failed_fetch_is_not_cached_and_the_next_call_retries():
    calls = []

    def flaky_list_symbol_entries(self):
        calls.append(1)
        if len(calls) == 1:
            raise ValueError('transient provider failure')
        return ('entry-1',)

    clock = _FakeClock()
    with patch('jesse.services.historical_data.india.exchange_providers.NseProvider.list_symbol_entries', flaky_list_symbol_entries):
        with pytest.raises(ValueError):
            equity_catalog.get_catalog_entries('NSE', monotonic=clock)

        # Still well inside the TTL window - a cached failure would return stale/empty
        # data (or re-raise from a cached exception) instead of retrying.
        clock.advance(1.0)
        result = equity_catalog.get_catalog_entries('NSE', monotonic=clock)

    assert result == ('entry-1',)
    assert len(calls) == 2


def test_ttl_expiry_refetches():
    calls = []

    def fake_list_symbol_entries(self):
        calls.append(1)
        return (f'entry-{len(calls)}',)

    clock = _FakeClock()
    with patch('jesse.services.historical_data.india.exchange_providers.NseProvider.list_symbol_entries', fake_list_symbol_entries):
        first = equity_catalog.get_catalog_entries('NSE', monotonic=clock)

        clock.advance(equity_catalog.CATALOG_CACHE_TTL_SECONDS - 1)
        still_cached = equity_catalog.get_catalog_entries('NSE', monotonic=clock)

        clock.advance(2)  # now past the TTL
        refetched = equity_catalog.get_catalog_entries('NSE', monotonic=clock)

    assert first == ('entry-1',)
    assert still_cached == ('entry-1',)  # no refetch yet
    assert refetched == ('entry-2',)  # TTL expired -> refetched
    assert len(calls) == 2


def test_nse_and_bse_are_cached_independently():
    nse_calls, bse_calls = [], []

    def fake_nse(self):
        nse_calls.append(1)
        return ('NSE-entry',)

    def fake_bse(self):
        bse_calls.append(1)
        return ('BSE-entry',)

    clock = _FakeClock()
    with patch('jesse.services.historical_data.india.exchange_providers.NseProvider.list_symbol_entries', fake_nse), \
         patch('jesse.services.historical_data.india.exchange_providers.BseProvider.list_symbol_entries', fake_bse):
        nse_result = equity_catalog.get_catalog_entries('NSE', monotonic=clock)
        bse_result = equity_catalog.get_catalog_entries('BSE', monotonic=clock)
        # Second round - neither should refetch.
        equity_catalog.get_catalog_entries('NSE', monotonic=clock)
        equity_catalog.get_catalog_entries('BSE', monotonic=clock)

    assert nse_result == ('NSE-entry',)
    assert bse_result == ('BSE-entry',)
    assert len(nse_calls) == 1
    assert len(bse_calls) == 1


# --------------------------------------------------------- get_cached_universe_members --

def test_members_index_second_call_does_not_rescan():
    calls = []

    def fake_read_snapshot(universe_dir, snapshot_date, canonical_name):
        calls.append(canonical_name)
        return ()

    clock = _FakeClock()
    with patch('jesse.services.historical_data.india.universes._list_snapshot_dates', return_value=[]):
        first = equity_catalog.get_cached_universe_members(monotonic=clock)
        second = equity_catalog.get_cached_universe_members(monotonic=clock)

    assert first == {}
    assert second == {}
    # `_list_snapshot_dates` (patched above to always report "nothing captured yet")
    # would be called once per universe on every uncached scan - confirm the second
    # call reused the cached (empty) result instead of re-scanning.
    with patch('jesse.services.historical_data.india.universes._list_snapshot_dates') as mocked:
        mocked.return_value = []
        equity_catalog.get_cached_universe_members(monotonic=clock)
        assert mocked.call_count == 0


def test_members_index_ttl_expiry_rescans():
    scan_count = []

    def fake_list_snapshot_dates(universe_dir):
        scan_count.append(1)
        return []

    clock = _FakeClock()
    with patch('jesse.services.historical_data.india.universes._list_snapshot_dates', fake_list_snapshot_dates):
        equity_catalog.get_cached_universe_members(monotonic=clock)
        calls_after_first = len(scan_count)

        clock.advance(equity_catalog.MEMBERS_CACHE_TTL_SECONDS + 1)
        equity_catalog.get_cached_universe_members(monotonic=clock)

    assert calls_after_first > 0
    assert len(scan_count) > calls_after_first
