"""HTTP client shared by NSE/BSE archive fetchers.

Encodes the quirks confirmed in docs/india-markets/spike-sources.md:
- NSE/BSE/niftyindices report "not published" (a holiday, or a slug/date that never
  existed) as either a plain HTTP 404, or an HTTP 200 whose body is an HTML page
  (BSE and niftyindices serve their Angular SPA shell for any unmatched route) -
  callers must never treat `status == 200` alone as success.
- `www.nseindia.com` sits behind an Akamai bot-mitigation layer that 403s a bare
  homepage GET, but that response still sets the session cookies its JSON API needs;
  `prime_cookies` captures those cookies without raising on the 403.
"""
import time
from collections.abc import Callable
from threading import Lock
from typing import Any, Literal
from urllib.parse import urlparse

import requests

from ..errors import ProviderRateLimitError, ProviderRequestError, ProviderUnavailableError

# NSE/BSE archive hosts respond quickly; this bounds a hung connection without
# stalling a whole import on one unresponsive request.
INDIA_REQUEST_TIMEOUT_SECONDS = 15
# One retry after a connection failure/5xx, then one more - enough to ride out a
# transient blip without turning a genuine outage into a long stall.
INDIA_REQUEST_RETRIES = 2
# 2s then 4s: gentle enough not to look like abuse, short enough not to stall imports.
INDIA_RETRY_BACKOFF_SECONDS = (2.0, 4.0)
# No rate limiting was observed in the source-probe spike, but 1s/host is the spacing
# used defensively during that probe - kept as the default so a real import doesn't
# hammer NSE/BSE hosts even though nothing currently requires it.
INDIA_DEFAULT_MIN_HOST_INTERVAL_SECONDS = 1.0

# A realistic desktop-Chrome UA; several NSE/BSE endpoints are more permissive with one
# (see spike-sources.md), and none of them require anything more elaborate.
INDIA_DEFAULT_HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ),
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
}

# Process-local per-host pacing shared by every production IndiaHttpClient instance.
_india_host_schedule: dict[str, float] = {}
_india_host_schedule_lock = Lock()


class IndiaHttpClient:
    """A `requests.Session` wrapper that paces per host and sniffs NSE/BSE soft-404s."""

    def __init__(
        self,
        *,
        session: requests.Session | None = None,
        sleep: Callable[[float], None] = time.sleep,
        monotonic: Callable[[], float] = time.monotonic,
        min_host_interval_seconds: float = INDIA_DEFAULT_MIN_HOST_INTERVAL_SECONDS,
        referer: str | None = None,
    ) -> None:
        self._session = session or requests.Session()
        self._sleep = sleep
        self._monotonic = monotonic
        self._min_host_interval_seconds = min_host_interval_seconds
        self._referer = referer
        # An injected session is a test fixture; giving it its own pacing schedule keeps
        # it from waiting on (or polluting) the real global schedule other instances share.
        if session is None:
            self._host_schedule = _india_host_schedule
            self._host_schedule_lock = _india_host_schedule_lock
        else:
            self._host_schedule = {}
            self._host_schedule_lock = Lock()

    def get(
        self,
        url: str,
        *,
        expect: Literal['csv', 'json', 'zip'],
        referer: str | None = None,
    ) -> bytes | Any | None:
        """Fetch `url`, returning None when the resource is not published (see module docstring)."""
        host = urlparse(url).netloc
        headers = dict(INDIA_DEFAULT_HEADERS)
        resolved_referer = referer if referer is not None else self._referer
        if resolved_referer is not None:
            headers['Referer'] = resolved_referer

        for attempt in range(INDIA_REQUEST_RETRIES + 1):
            self._wait_for_host_slot(host)
            try:
                response = self._session.get(url, headers=headers, timeout=INDIA_REQUEST_TIMEOUT_SECONDS)
            except requests.RequestException as exc:
                # Catches connection/timeout failures as well as mid-download breakage
                # (e.g. ChunkedEncodingError on a truncated zip) and other transport-level
                # requests errors - none of these should ever escape as raw requests
                # exceptions (mirrors massive_stocks.py's `_request_json`).
                if attempt < INDIA_REQUEST_RETRIES:
                    self._sleep(INDIA_RETRY_BACKOFF_SECONDS[attempt])
                    continue
                raise ProviderUnavailableError(f'{host} is currently unavailable') from exc

            try:
                if response.status_code == 404:
                    return None
                if response.status_code == 429:
                    raise ProviderRateLimitError(f'{host} rate limited the request')
                if response.status_code >= 500:
                    if attempt < INDIA_REQUEST_RETRIES:
                        self._sleep(INDIA_RETRY_BACKOFF_SECONDS[attempt])
                        continue
                    raise ProviderUnavailableError(f'{host} is currently unavailable')
                if response.status_code >= 400:
                    raise ProviderRequestError(f'{host} rejected the request with HTTP {response.status_code}')
                if _looks_like_html(response):
                    # BSE/niftyindices soft-404: HTTP 200 with the site's SPA shell instead of the file.
                    return None
                return _parse_payload(response, expect)
            finally:
                response.close()

        raise ProviderUnavailableError(f'{host} is currently unavailable')

    def prime_cookies(self, url: str) -> None:
        """GET `url` and keep whatever cookies it sets, regardless of status code.

        `www.nseindia.com` answers a plain homepage GET with 403 but still sets the
        Akamai cookies its corporate-actions API requires - raising on a non-2xx here
        would throw those cookies away.
        """
        host = urlparse(url).netloc
        self._wait_for_host_slot(host)
        headers = dict(INDIA_DEFAULT_HEADERS)
        if self._referer is not None:
            headers['Referer'] = self._referer
        # requests.Session persists Set-Cookie headers regardless of status code, so no
        # explicit cookie handling is needed beyond issuing the request on `self._session`.
        try:
            response = self._session.get(url, headers=headers, timeout=INDIA_REQUEST_TIMEOUT_SECONDS)
        except requests.RequestException as exc:
            # A single attempt is enough here: priming cookies is a cheap, idempotent
            # preamble the caller retries by retrying its own higher-level request.
            raise ProviderUnavailableError(f'{host} is currently unavailable') from exc
        response.close()

    def _wait_for_host_slot(self, host: str) -> None:
        while True:
            now = self._monotonic()
            with self._host_schedule_lock:
                next_allowed_at = self._host_schedule.get(host, 0.0)
                if next_allowed_at <= now:
                    self._host_schedule[host] = now + self._min_host_interval_seconds
                    return
                delay = next_allowed_at - now
            self._sleep(delay)


def _looks_like_html(response: requests.Response) -> bool:
    content_type = response.headers.get('Content-Type', '')
    if 'text/html' in content_type.lower():
        return True
    return response.content.lstrip()[:1] == b'<'


def _parse_payload(response: requests.Response, expect: Literal['csv', 'json', 'zip']) -> bytes | Any | None:
    if expect == 'zip':
        body = response.content
        return body if body.startswith(b'PK') else None
    if expect == 'csv':
        return response.content
    if expect == 'json':
        try:
            return response.json()
        except requests.exceptions.JSONDecodeError:
            return None
    # `expect` is a Literal checked by the type checker; a fourth value is a caller bug, not a live provider error.
    raise ValueError(f'Unsupported expect value: {expect!r}')
