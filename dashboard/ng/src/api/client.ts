// Thin POST-JSON client mirroring the auth/error-handling contract every hand-written
// `jesse/dashboard_patches/*.template.js` page already implements (see e.g.
// universe_scan_page.template.js's file header for the full rationale) - kept
// behavior-equivalent so porting one of those pages into dashboard/ng changes nothing
// about how it talks to the server.

const MAIN_STORE_KEY = 'main';

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

/** Pinia's default persistedstate storage key is the store's own id ("main"). Reads the
 * persisted auth token directly out of localStorage instead of importing the upstream
 * `main` Pinia store module - this app is an isolated Vue instance (see README.md) with
 * no access to upstream's own store instances, only to whatever they've persisted. */
function getAuthToken(): string {
  try {
    const raw = window.localStorage.getItem(MAIN_STORE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return (parsed && parsed.authToken) || '';
  } catch {
    return '';
  }
}

/** Mirrors a real logout (mainStore.setAuthToken('')) from outside the store: blank the
 * persisted token, then hard-navigate home so the app shell boots into its own login
 * gate on next load - there is no separate `/login` route, the gate is a v-if in the
 * upstream app shell. */
function redirectToLogin(): void {
  try {
    const raw = window.localStorage.getItem(MAIN_STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.authToken = '';
    window.localStorage.setItem(MAIN_STORE_KEY, JSON.stringify(parsed));
  } catch {
    try {
      window.localStorage.removeItem(MAIN_STORE_KEY);
    } catch {
      /* best effort */
    }
  }
  window.location.href = '/';
}

/** POSTs JSON to `path` with the raw (non-"Bearer ") Authorization header the dashboard's
 * own fetch helper uses (see REVERSE_ENGINEERING.md ยง3), and redirects to the login gate
 * on a 401 instead of resolving - callers never need to special-case auth failures. */
export async function api<T = unknown>(path: string, body?: unknown): Promise<ApiResult<T>> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: getAuthToken() },
    body: JSON.stringify(body || {}),
  });
  if (res.status === 401) {
    redirectToLogin();
    throw new Error('unauthorized');
  }
  const data = (await res.json()) as T;
  return { ok: res.ok, status: res.status, data };
}

/** Turns a failed response body into a readable message, whether it's this API's own
 * contract shape (`{message: ...}`) or FastAPI's default request-validation body
 * (`{detail: [{loc: [...], msg: ...}, ...]}`, raised automatically for a field that
 * fails Pydantic validation before the endpoint's own handler ever runs - e.g. a wildly
 * out-of-range number FastAPI itself rejects). Ported from
 * portfolio_page.template.js's formatServerErrorMessage. */
export function formatServerErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as { message?: unknown; detail?: unknown };
  if (typeof d.message === 'string' && d.message) return d.message;
  if (Array.isArray(d.detail)) {
    return d.detail
      .map((item) => {
        const entry = (item ?? {}) as { loc?: unknown; msg?: unknown };
        const loc = Array.isArray(entry.loc) ? entry.loc.filter((p) => p !== 'body').join('.') : '';
        return (loc ? `${loc}: ` : '') + (typeof entry.msg === 'string' ? entry.msg : 'invalid value');
      })
      .join('; ');
  }
  return null;
}
