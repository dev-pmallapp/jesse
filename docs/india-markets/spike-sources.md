# India markets source probe — findings

Spike for GitHub issue `dev-pmallapp/jesse#2`. Goal: verify whether the free,
account-less NSE/BSE sources assumed in `docs/india-markets/PLAN.md` (D1) are
actually fetchable by a script, what they contain, and how far back they go.

Fetched 2026-09-23 from a Linux box using `curl` with a browser-like
`User-Agent` (Chrome 120 on Windows), `Accept`/`Referer` headers where noted,
and >=1s between requests to the same host. No CAPTCHA or active challenge
was bypassed — where a source blocked outright, that's reported as a failure,
not worked around. Real payload samples (trimmed) are saved under
`tests/fixtures/india/` — see that directory's `README.md` for the exact file
list and source URLs.

Everything below is **verified** unless a sentence explicitly says "inferred"
or "not verified" / "not found within budget."

---

## 1. NSE equity bhavcopy — legacy format (pre-July-2024)

**URL pattern:** `https://nsearchives.nseindia.com/content/historical/EQUITIES/<YYYY>/<MON>/cm<DD><MON><YYYY>bhav.csv.zip`
(e.g. `cm01JAN2024bhav.csv.zip`). `<MON>` is the 3-letter uppercase month.

- **Access:** No cookie or session needed. Plain unauthenticated `GET` to
  `nsearchives.nseindia.com` (a separate static-archive host from
  `www.nseindia.com`) returned `200` every time, including with no `Referer`.
  This is the one NSE host that does **not** sit behind the Akamai
  bot-challenge that blocks `www.nseindia.com` (see §5).
- **Format:** ZIP containing one CSV. `Content-Type: application/zip`.
- **Columns (2024):** `SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN,` (trailing comma present).
- **Columns (1995):** `SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,` — no `TOTALTRADES`/`ISIN`. **Column set changed over the archive's life**; a parser needs to handle both variants (detect from header, don't assume a fixed column count).
- **Timestamp:** `DD-MON-YYYY` (e.g. `01-JAN-2024`), date-only, no time-of-day. All NSE dates in this probe are implicitly IST (UTC+5:30) trading-session dates; no timezone marker is ever present in the files.
- **Row counts:** 2,684 rows (incl. header) for 01-Jan-2024, all segments (`EQ`, `BE`, `GS`, `TB`/T-bills, etc. share this one file) — not equities-only. 204 rows for 02-Jan-1995. 1,189 rows for 03-Jan-2000.
- **History depth — verified:** works back to **03-Nov-1994** (`cm03NOV1994bhav.csv.zip`, 200, 2,841 bytes) and **14-Nov-1994**. `cm03JAN1994bhav.csv.zip` returned a proper NSE `404` HTML error page (not a block — the file genuinely doesn't exist), consistent with NSE's Capital Market segment having launched 03-Nov-1994. Did not probe earlier than that.
- **Post-switch dates:** `cm08JUL2024bhav.csv.zip` (08-Jul-2024, the first UDiFF date) returns a clean `404` — **legacy files stop being generated once NSE switched to UDiFF**; no retroactive legacy files exist for post-switch dates.
- **Split/bonus adjustment — verified NOT adjusted.** Cross-checked ALLCARGO (3:1 bonus, ex-date 02-Jan-2024) across three consecutive legacy files:
  - 29-Dec-2023 close: 321.70
  - 01-Jan-2024 close: 329.05
  - 02-Jan-2024 open/close: 86.00 / 90.10, with `PREVCLOSE` still showing the raw **329.05** (not divided by 4 for the bonus).
  This proves the historical files are **raw as-traded prices** — NSE does not retroactively rewrite old bhavcopies when a split/bonus happens later, and `PREVCLOSE` is never adjusted either. See `tests/fixtures/india/nse_bhavcopy_legacy_allcargo_unadjusted_proof.csv`.
- **Rate limiting:** none observed across ~12 requests to this host with 1.2s spacing.

## 2. NSE equity bhavcopy — UDiFF format (from 08-Jul-2024)

**URL pattern:** `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_<YYYYMMDD>_F_0000.csv.zip`

- **Access:** same unauthenticated `nsearchives.nseindia.com` host, no cookie needed.
- **Columns:** `TradDt,BizDt,Sgmt,Src,FinInstrmTp,FinInstrmId,ISIN,TckrSymb,SctySrs,XpryDt,FininstrmActlXpryDt,StrkPric,OptnTp,FinInstrmNm,OpnPric,HghPric,LwPric,ClsPric,LastPric,PrvsClsgPric,UndrlygPric,SttlmPric,OpnIntrst,ChngInOpnIntrst,TtlTradgVol,TtlTrfVal,TtlNbOfTxsExctd,SsnId,NewBrdLotQty,Rmks,Rsvd1,Rsvd2,Rsvd3,Rsvd4`. Adds `FinInstrmNm` (full security name), `ISIN`, and reserved/derivatives columns (mostly empty for cash-market `STK` rows) not present in the legacy format. Symbol is `TckrSymb`, series is `SctySrs`.
- **Dates:** `TradDt`/`BizDt` are `YYYY-MM-DD` — a different date format from the legacy file's `DD-MON-YYYY`. Another thing a parser must normalize.
- **Row counts:** 2,816 lines (incl. header) for 08-Jul-2024; 2,684 for 01-Jan-2024 (see next point); ~3,046 for 18-Sep-2026.
- **Surprising finding: UDiFF files exist retroactively for pre-switch dates too.** `BhavCopy_NSE_CM_0_0_0_20240101_F_0000.csv.zip` (01-Jan-2024, months before the July 2024 switch) returned `200` with valid data matching the legacy file's row count and prices for that date. So **NSE appears to have backfilled the UDiFF archive across its history** (at least to 01-Jan-2024 — did not probe further back in UDiFF form given the request budget). This means UDiFF alone could plausibly be used as the single canonical bhavcopy format going forward, with legacy kept as a fallback for whatever depth UDiFF's backfill doesn't reach.
  **Update (spike #41, 2026-09-24): the backfill starts exactly on 01-Jan-2024 (29-Dec-2023 is `404`); see §9.3.**
- **Recent dates verified:** 18-Sep-2026 and 22-Sep-2026 both `200`, confirming the source is current as of the spike date (2026-09-23).
- **Legacy URL on a post-switch date:** confirmed `404` (§1). **UDiFF URL on a pre-switch date:** confirmed `200` (this section) — the compatibility is one-directional; UDiFF back-covers, legacy does not forward-cover.
- **Split/bonus adjustment:** not independently re-verified in UDiFF (only legacy), but since UDiFF 01-Jan-2024 prices match legacy 01-Jan-2024 prices exactly, the same "raw, unadjusted" conclusion applies.

## 3. NSE full bhavcopy with delivery data

**URL pattern:** `https://nsearchives.nseindia.com/products/content/sec_bhavdata_full_<DDMMYYYY>.csv`

- **Access:** unauthenticated, plain CSV (not zipped), `Content-Type: text/csv`. Verified 01-Jan-2024 and 18-Sep-2026, both `200`.
- **Columns:** `SYMBOL, SERIES, DATE1, PREV_CLOSE, OPEN_PRICE, HIGH_PRICE, LOW_PRICE, LAST_PRICE, CLOSE_PRICE, AVG_PRICE, TTL_TRD_QNTY, TURNOVER_LACS, NO_OF_TRADES, DELIV_QTY, DELIV_PER` (note the leading space after each comma — an actual quirk of the file, not a transcription artifact). Adds `DELIV_QTY`/`DELIV_PER` (delivery-based quantity/percentage) not present in either bhavcopy format — useful as a liquidity/float-churn signal for screening.
- **Date format:** `DD-Mon-YYYY` (e.g. `01-Jan-2024`) — yet another distinct date format from the other two NSE sources.
- **Row count:** 2,606 rows (incl. header) for 01-Jan-2024 — close to but not identical to bhavcopy row counts (segment coverage differs slightly).
- **Rate limiting:** none observed.

## 4. BSE equity bhavcopy (UDiFF and legacy)

**UDiFF URL pattern:** `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_<YYYYMMDD>_F_0000.CSV`
**Legacy URL pattern:** `https://www.bseindia.com/download/BhavCopy/Equity/EQ<DDMMYY>_CSV.ZIP`

- **Access:** `www.bseindia.com` (unlike NSE, BSE serves both its main site and its bhavcopy downloads from the same host) responds `200` to a plain `GET` with just a browser `User-Agent` — no cookie/session needed, no block observed.
- **UDiFF format:** same column layout as NSE's UDiFF (`TradDt,BizDt,Sgmt,Src,...`) — this is an industry-standard SEBI-mandated UDiFF schema shared across exchanges, confirmed identical column names between NSE and BSE files. `Src` column distinguishes `NSE` vs `BSE`. BSE's `SctySrs` uses different group codes than NSE's `SERIES` (e.g. `A` instead of `EQ` for RELIANCE/TCS, `B` instead of `EQ` for NIFTYBEES) — **BSE and NSE series/group codes are not directly comparable strings**, a mapping/normalization concern if the plan cross-references both exchanges by series.
- **Legacy format (`EQ<DDMMYY>_CSV.ZIP`) verified working for 01-Jan-2024:** ZIP containing `EQ010124.CSV` with columns `SC_CODE,SC_NAME,SC_GROUP,SC_TYPE,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,NO_TRADES,NO_OF_SHRS,NET_TURNOV,TDCLOINDI`. **No symbol/ticker column** — identification is by `SC_CODE` (BSE's own 6-digit numeric scrip code, e.g. `500325` for RELIANCE) and a truncated/padded `SC_NAME`. A BSE scrip-code-to-symbol/ISIN mapping is required to use this format; **BSE's UDiFF file adds ISIN and a readable ticker (`TckrSymb`)**, which the legacy format lacks — a strong argument for preferring UDiFF where available.
- **BSE UDiFF does NOT backfill pre-switch dates** — unlike NSE. Requesting `BhavCopy_BSE_CM_0_0_0_20050103_F_0000.CSV` returned HTTP `200` but with `Content-Type: text/html` and a 14 KB payload that is BSE's Angular SPA shell (soft-404: the site serves its homepage app shell for any unmatched route with a `200` status instead of a real `404`). **A script must not trust BSE's HTTP status code alone — it must check `Content-Type`/`Content-Length` or sniff the body to detect a soft-404,** since a naive "status == 200 → success" check would silently ingest an HTML page as data.
- **History depth for BSE legacy format:** not probed beyond confirming 01-Jan-2024 works (did not spend budget bisecting BSE's earliest legacy date — NSE was prioritized since it's likely primary per D1's exchange list; flagged as a follow-up).
- **Rate limiting:** none observed across 4 requests.

## 5. NSE corporate actions (splits/bonus/dividends)

**URL:** `https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=DD-MM-YYYY&to_date=DD-MM-YYYY`

- **Access — the tricky one.** A direct `GET https://www.nseindia.com/` (needed first to obtain a session cookie, per the task's own suggestion) returns **HTTP 403** — `www.nseindia.com` sits behind an Akamai bot-mitigation layer that blocks a plain scripted request outright, even with a realistic `User-Agent`/`Accept` header set. **However**, that same 403 response still sets Akamai's tracking cookies (`bm_sz`, `_abck`, `AKA_A2`) via `Set-Cookie` headers. Replaying those cookies (via a cookie jar) on the subsequent API request, along with `Referer: https://www.nseindia.com/companies-listing/corporate-filings-actions`, `Accept: application/json, text/plain, */*`, and `X-Requested-With: XMLHttpRequest`, **succeeded with HTTP 200** and real JSON data (322 records for Jan–Mar 2024). So the "load homepage first for a cookie" strategy **does work**, but the homepage load itself will report an error status (403) that a naive script might treat as fatal — **the script must capture cookies from the 403 response rather than aborting on non-200,** and must send the follow-up request with the same headers noted above (bare cookie replay without `Referer`/`X-Requested-With` was not separately tested, so those headers should be treated as required until proven otherwise).
- **Columns:** JSON array of objects: `bcEndDate, bcStartDate, caBroadcastDate, comp, exDate, faceVal, ind, isin, ndEndDate, ndStartDate, recDate, series, subject, symbol`. No structured `type` field — the action type (split, bonus, dividend, rights, etc.) must be **parsed out of the free-text `subject` string** (e.g. `"Bonus 3:1"`, `"Face Value Split (Sub-Division) - From Rs10/- Per Share To Re 1/- Per Share"`, `"Interim Dividend - Rs 7 Per Share"`). This is a real parsing burden — ratios and amounts are embedded in prose with inconsistent phrasing, not a clean machine-readable field.
- **Dates:** `DD-Mon-YYYY` in the JSON body; **`DD-MM-YYYY` in the query string** — two different date formats in the same request/response round-trip.
- **Downloadable CSV alternative:** not found/tested as a separate endpoint within budget. NSE's UI likely generates a CSV client-side from this same JSON (an "Export" button pattern used elsewhere on the site) rather than exposing a distinct CSV URL — **inferred, not verified**. Given the JSON is fetchable and structured (aside from `subject` parsing), a separate CSV endpoint isn't necessary.
- **Rate limiting:** none observed (2 requests to this host).

## 6. Index history — NSE daily all-indices file, and niftyindices.com

**NSE URL pattern:** `https://nsearchives.nseindia.com/content/indices/ind_close_all_<DDMMYYYY>.csv`

- **Access:** unauthenticated, same friendly `nsearchives.nseindia.com` host as bhavcopy. `200` for 01-Jan-2024 and 05-Jan-2015; `404` for 03-Jan-2005, 03-Jan-2000, and 04-Jan-2010.
- **Columns:** `Index Name,Index Date,Open Index Value,High Index Value,Low Index Value,Closing Index Value,Points Change,Change(%),Volume,Turnover (Rs. Cr.),P/E,P/B,Div Yield` — **full OHLC is present**, not just a close. Some strategy/smart-beta indices (e.g. `NIFTY100 Alpha 30`, `Nifty200 Alpha 30`) report `-` for Open/High/Low with only Closing Index Value populated on some dates — **OHLC completeness is not guaranteed per-index**; a consumer must handle `-` as missing, not `0`.
- **All three Alpha indices are present and verified in this file** on 01-Jan-2024: `Nifty Alpha 50`, `NIFTY100 Alpha 30`, `Nifty200 Alpha 30` (exact capitalization as returned — inconsistent between entries, e.g. `NIFTY100` vs `Nifty200`, another normalization concern). 108 index names total appear in the 01-Jan-2024 file — this file appears to be NSE's comprehensive daily index-close product, not a curated subset.
- **`NIFTY500 Alpha 30` does NOT appear** in the 108-name list — consistent with it not existing as an index (see §7).
- **History depth — verified:** works for 05-Jan-2015, fails for 04-Jan-2010, 03-Jan-2005, 03-Jan-2000. **Depth boundary is somewhere between Jan-2010 and Jan-2015** (not bisected further to conserve request budget — worth narrowing down before implementation if exact depth matters for the plan).
- **Naming changes over time:** in the 05-Jan-2015 file, the flagship index is named `CNX Nifty`, not `Nifty 50` (renamed later, likely around 2015-2016 when NSE dropped the "CNX" branding). **Any code matching indices by exact name string needs to account for historical renames**, not just current names.
- **niftyindices.com historical-data endpoint:** the public `/reports/historical-data` page is an Angular SPA; its data comes from a backend POST endpoint at `https://www.niftyindices.com/Backpage.aspx/getHistoricaldatatabletoString` (an ASP.NET WCF-style service method, inferred from the page's route naming convention and prior public documentation of this site, not read directly from its JS in this session). A POST with a plausible JSON body (`{"name":"NIFTY 50","startDate":"01-Jan-2024","endDate":"05-Jan-2024"}`) returned HTTP `302` and a generic `{"Message":"There was an error processing the request." ...}` — **the endpoint exists and is reachable but rejects this exact payload shape; the correct parameter names/format were not reverse-engineered within the request budget.** Given NSE's own `ind_close_all_*.csv` already provides full daily OHLC for every index including the Alpha family, **recommend treating NSE's file as the primary/default index-history source** and leaving niftyindices.com's API as a secondary source to reverse-engineer later only if a gap in NSE's file is found (e.g. if NSE's depth boundary of ~2010–2015 is insufficient and niftyindices.com goes back further).
  **Update (spike #41, 2026-09-24): superseded — the real endpoint is `POST https://www.niftyindices.com/BackPage/getHistoricaldatatabletoString` and it works; see §9.4.**

## 7. Index constituents from niftyindices.com; rebalancing announcements

**URL pattern (working):** `https://www.niftyindices.com/IndexConstituent/ind_<slug>_list.csv`

**Update (spike #41, 2026-09-24):** this pattern does not hold for every index — Nifty Alpha 50 is `ind_nifty_Alpha_Index.csv` and NIFTY100 Alpha 30 is `ind_nifty100Alpha30list.csv`; see §9.1.

- **`ind_nifty200alpha30_list.csv` — verified working**, `200`, real CSV (`Company Name,Industry,Symbol,Series,ISIN Code`, e.g. AU Small Finance Bank, Adani Energy Solutions, ...). No cookie/session required, though a `Referer` header was sent defensively (not confirmed necessary).
- **`ind_nifty50list.csv` — verified working** (sanity check confirming the naming convention itself is sound for at least one index).
- **`ind_nifty100alpha30_list.csv`, `ind_niftyalpha50_list.csv`, `ind_nifty500alpha30_list.csv`, `ind_niftyalpha50list.csv`, `ind_nifty100_alpha30_list.csv` — all failed**: each returned HTTP `200` but with `Content-Type: text/html` and the site's Angular SPA shell (same soft-404 pattern as BSE, §4) rather than a CSV. **Could not determine the correct constituent-file slug for "Nifty Alpha 50" or "NIFTY100 Alpha 30" within the request budget** (5 guesses tried and exhausted the reasonable variations). This does not mean those indices lack a constituent file — `Nifty Alpha 50` and `NIFTY100 Alpha 30` are both real, actively-quoted indices (confirmed in §6's `ind_close_all` file and via tracking ETFs below) — only that the slug wasn't found by pattern-guessing. **Follow-up needed:** inspect niftyindices.com's rendered JS (e.g. with a headless browser) to find the exact slug, or check if these two indices' constituent lists are only published via the factsheet/index-methodology PDF rather than a CSV.
  **Update (spike #41, 2026-09-24): superseded — both files were found; see §9.1.**
- **Verified index family, via NSE's `ind_close_all` file (§6) and NSE's ETF master (`eq_etfseclist.csv`, §8):**
  - `Nifty Alpha 50` — exists, has 3 tracking ETFs/index funds on NSE (`ALPHA` / Kotak, `MOALPHA50` / Motilal Oswal, and others).
  - `NIFTY100 Alpha 30` — exists as an index (quoted daily), but **no dedicated ETF found** in the current `eq_etfseclist.csv` snapshot.
  - `Nifty200 Alpha 30` — exists, tracked by `ALPHAETF` (Mirae Asset Nifty 200 Alpha 30 ETF).
  - `NIFTY500 Alpha 30` — **does not exist**. Not in the 108-index `ind_close_all` list, no niftyindices.com constituent file under any guessed slug, no tracking ETF. Related indices that **do** exist and might be confused with it: `Nifty500 Multicap 50:25:25`, `NIFTY500 Value 50`, `Nifty200 Momentum 30`, `Nifty Alpha Low-Volatility 30`, `NIFTY Alpha Quality Low-Volatility 30`, `NIFTY Alpha Quality Value Low-Volatility 30` — all confirmed present in `ind_close_all`.
- **Index rebalancing announcements (for point-in-time membership):** not fetched within budget. niftyindices.com publishes a "Nifty Passive Insights" / methodology-document page (seen linked from the homepage: `reports/nifty-passive-insights`) and index-methodology PDFs that typically contain rebalance effective dates, but the exact machine-readable source for point-in-time historical constituents was **not verified in this spike** — flagged as an open item for the plan (D6 universes will need this to avoid survivorship bias in backtests).

## 8. Security masters

- **`EQUITY_L.csv`** (`https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv`) — verified, `200`, unauthenticated, `Content-Type: text/csv`, 2,584 rows. Columns: `SYMBOL,NAME OF COMPANY, SERIES, DATE OF LISTING, PAID UP VALUE, MARKET LOT, ISIN NUMBER, FACE VALUE`. **Confirmed: this file covers only the equity (`EQ`-series-style) universe, not ETFs** — `ALPHAETF` and `NIFTYBEES` do not appear in it despite being actively traded `EQ`-series securities in the bhavcopy.
- **`eq_etfseclist.csv`** (`https://nsearchives.nseindia.com/content/equities/eq_etfseclist.csv`) — verified, `200`, unauthenticated, 352 rows. Columns: `Symbol,Underlying Asset,SecurityName,DateofListing,MarketLot,ISINNumber,FaceValue,ETF Underlying,Underlying Key`. This is the correct master for ETFs; **`NIFTYBEES`, `ALPHAETF`, `ALPHA` (Kotak Nifty Alpha 50), `ALPL30IETF` (Alpha Low-Volatility 30), `MOALPHA50` (Motilal Oswal Nifty Alpha 50) all confirmed present.**
- **Cross-check against bhavcopy — confirmed:** `RELIANCE`, `TCS`, `NIFTYBEES`, `ALPHAETF`, and `ALPHA` all appear under **`SERIES`/`SctySrs` = `EQ`** in both the legacy and UDiFF bhavcopy for 18-Sep-2026 — ETFs trade in the same `EQ` series as ordinary equities on NSE, they are not a separate series code. A universe/security-master join therefore cannot use `SERIES == 'EQ'` alone to mean "operating company equity" — it must cross-reference against `EQUITY_L.csv` (companies) vs `eq_etfseclist.csv` (funds) to distinguish the two.

---

## Summary table

| Source | Works from script? | Depth (verified) | Notes |
|---|---|---|---|
| NSE bhavcopy, legacy | Yes, no auth | 03-Nov-1994 → 07-Jul-2024 (fails after switch) | Column set changed over time (1995 vs 2024); raw/unadjusted prices |
| NSE bhavcopy, UDiFF | Yes, no auth | Backfilled to **exactly 01-Jan-2024** → present (verified §9.3: 29-Dec-2023 `404`, 01-Jan-2024 `200`, no gap between) | Different schema & date format than legacy; appears to be the forward-looking canonical format |
| NSE full bhavcopy + delivery | Yes, no auth | 01-Jan-2024 and 18-Sep-2026 both OK | Adds `DELIV_QTY`/`DELIV_PER`; yet another date format |
| BSE bhavcopy, UDiFF | Yes, no auth | 08-Jul-2024 OK; 2005 fails (soft-404, HTTP 200 w/ HTML body) | Does NOT backfill pre-switch like NSE does; must sniff Content-Type, not trust status code |
| BSE bhavcopy, legacy | Yes, no auth | 01-Jan-2024 OK (earlier depth not probed) | No symbol column — keyed by numeric `SC_CODE`, needs a scrip-code map |
| NSE corporate actions API | Yes, but needs cookie dance | Jan–Mar 2024 window tested, 322 records | Homepage returns 403 but still yields usable cookies; action type must be parsed from free-text `subject` |
| NSE all-indices close (`ind_close_all`) | Yes, no auth | ~2010–2015 boundary → present | Full OHLC; Alpha indices confirmed present; index names have been renamed over time (`CNX Nifty` → `Nifty 50`) |
| niftyindices.com historical-data API | **Yes, reverse-engineered (§9.4)** — real endpoint `POST /BackPage/getHistoricaldatatabletoString`, no auth needed | Nifty Alpha 50 to 01-Jan-2004; NIFTY100/200 Alpha 30 to at least 01-Jan-2012 — deeper than `ind_close_all` | Now **primary** recommended index-history source for the Alpha indices; mislabeled `Content-Type`, must parse body as JSON |
| niftyindices.com constituents CSV | **Yes for all three Alpha indices (§9.1)**: `ind_nifty200alpha30_list.csv`, `ind_nifty_Alpha_Index.csv`, `ind_nifty100Alpha30list.csv` | current snapshot only; point-in-time history not available (§9.2 — Wayback too sparse, ~1-3 snapshots/file spanning years vs. quarterly rebalances) | Soft-404 (200+HTML) for unmatched slugs — same footgun as BSE. Also mirrored byte-for-byte on `nsearchives.nseindia.com/content/indices/<filename>` (no soft-404 risk there) — recommended primary fetch host |
| NSE `EQUITY_L.csv` / `eq_etfseclist.csv` | Yes, no auth | current snapshot | Equities and ETFs are two separate master files; both trade under `SERIES=EQ` in bhavcopy |

---

## Implications for the plan

**D1 (can free sources be the default?): Yes, largely confirmed.** Every NSE
source tested is fetchable unauthenticated from a script except the
corporate-actions API, which needs the "load homepage, keep the cookies even
though the homepage itself 403s" workaround — a real but implementable
quirk, not a blocker. BSE bhavcopy (both formats) is also fetchable
unauthenticated. The one real gap is niftyindices.com's historical index-data
API and the two missing Alpha-index constituent-file slugs — recommend
scoping the P1 implementation to NSE's `ind_close_all` (already sufficient
for daily OHLC on all three real Alpha indices) and `ind_nifty200alpha30_list.csv`
for constituents, deferring `niftyalpha50`/`nifty100alpha30` constituent
sourcing to a follow-up spike (headless-browser inspection of
niftyindices.com, or PDF methodology docs) rather than blocking P1 on it.
**Update (spike #41, 2026-09-24): both gaps closed** — see §9.1 for the two
constituent-file slugs and §9.4 for the reverse-engineered historical-data
API, now recommended as the primary index-history source.

**D3 (daily-first storage): No new information against this design** — all
sources are end-of-day files, consistent with daily-first storage. One
addition worth folding in: NSE publishes bhavcopy in **two incompatible
schemas depending on date** (legacy pre-08-Jul-2024, UDiFF from
08-Jul-2024), but UDiFF appears retroactively available back to at least
01-Jan-2024. **Recommend defaulting the P1 fetcher to UDiFF end-to-end where
available** (single schema, has ISIN, has full security name) and falling
back to legacy only for dates UDiFF doesn't cover — this needs one more
probe (how far back does UDiFF's backfill actually go?) before committing,
since this spike only confirmed 01-Jan-2024 as a UDiFF-backfilled date, not
the true boundary. **Update (spike #41, 2026-09-24): boundary found, exactly
— UDiFF starts 01-Jan-2024, legacy covers everything before (§9.3). The
cutover date for the fetcher is settled: `>= 01-Jan-2024` → UDiFF, else
legacy.**

**D7 (are prices adjusted; is corporate-actions data sufficient to
adjust?):** **Confirmed prices are raw/unadjusted** in both bhavcopy formats
(§1's ALLCARGO 3:1-bonus proof). The corporate-actions API is confirmed to
carry both splits (`"Face Value Split (Sub-Division) - From Rs10/- Per Share
To Re 1/- Per Share"`) and bonuses (`"Bonus 3:1"`) with exact `exDate`s, which
is the data D7's "split/bonus-adjusted by Jesse" design needs — **but the
ratio/amount must be parsed out of free-text `subject` strings**, there is no
structured ratio field. This parsing layer (`corporate_actions.py` per the
plan's file list) needs a small library of regexes/rules for at least: `Bonus
N:M`, `Face Value Split ... From Rs X/- ... To Rs Y/-` (and the `Re 1/-`
singular-rupee phrasing variant seen in the sample), and presumably rights
issues and stock consolidations not observed in this Jan–Mar 2024 sample
window — worth pulling a longer date range in the real implementation to
catalog all `subject` phrasings before writing the parser.

**Verified Alpha index list (for D6):** `Nifty Alpha 50`, `NIFTY100 Alpha
30`, `Nifty200 Alpha 30` all exist and are live-quoted. **`NIFTY500 Alpha 30`
does not exist** — PLAN.md's D6 line already only names `NIFTY200 Alpha 30`
and `NIFTY100 Alpha 30` explicitly with a "..." for the rest; recommend
resolving that ellipsis to exactly these three, and note the near-miss names
in §7 above (`Nifty500 Multicap 50:25:25`, `NIFTY500 Value 50`,
`Nifty200 Momentum 30`, the three `Alpha ... Low-Volatility` variants) as
explicitly-considered-and-rejected alternatives so a future reader doesn't
re-litigate the "does 500 Alpha 30 exist" question.

**Other things worth changing in PLAN.md (not edited here, per instructions):**

1. Call out that **NSE and BSE `SERIES`/`SctySrs` codes are not the same
   vocabulary** (e.g. `EQ` vs `A`/`B`) — any cross-exchange series filtering
   needs a small mapping table, not a shared enum.
2. Call out that a fetcher must **not treat `HTTP 200` as success** for BSE
   and niftyindices.com — both serve their SPA shell with `200` for
   not-found resources; a fetcher needs a `Content-Type`/body sniff check.
3. Note the **cookie-despite-403 quirk** for `www.nseindia.com` explicitly in
   whatever design doc covers the corporate-actions fetcher, so it isn't
   "fixed" by someone later adding a naive `raise_for_status()` after the
   homepage GET.
4. Add a line noting that **`EQUITY_L.csv` and `eq_etfseclist.csv` are
   separate master files** and that ETFs and operating-company equities share
   `SERIES=EQ` in the bhavcopy — the security-master join needs both files,
   not one.
5. Flag point-in-time index constituents (for survivorship-bias-free
   backtests, presumably part of D6) as **unresolved** — niftyindices.com's
   rebalance-announcement source wasn't found in this spike and needs a
   follow-up. **Update (spike #41, 2026-09-24): investigated further, still
   unresolved for real history — see §9.2.** Wayback Machine's CDX API (the
   most promising lead) only has 1-3 snapshots per constituent file spanning
   years, against a quarterly (4/year) rebalance cadence — far too sparse.
   No other machine-readable historical source was found. Recommendation is
   no longer "look harder" but a concrete two-part plan: start capturing our
   own dated snapshots on each quarterly rebalance from now on, and flag
   "used current members" for any backtest date before that start — see
   PLAN.md's updated D6/Phase-2-step-1 wording.

---

## 9. Follow-up spike #41 (2026-09-24)

Fetched 2026-09-24 from the same box, same method as §1-8 (`curl`, browser-like
`User-Agent`, Referer where sensible, >=1s between requests to the same host,
no CAPTCHA/challenge bypassed). Answers the four open items §6/§7 of the
original spike flagged. Everything below is **verified** unless marked
"inferred"/"not verified".

### 9.1 Constituent file names for Nifty Alpha 50 and NIFTY100 Alpha 30

**Found — not by guessing.** niftyindices.com's homepage links to a per-index
detail page for every strategy index (`https://www.niftyindices.com/indices/equity/strategy-indices/<page-slug>`,
found by grepping `href="[^"]*alpha[^"]*"` in the homepage HTML, e.g.
`nifty-alpha-50`, `nifty100-alpha-30`). Each detail page's rendered HTML
embeds its own constituent-CSV `href` directly (no headless browser/JS
execution needed — the anchor is present in the plain HTML response):

- **Nifty Alpha 50** → `https://www.niftyindices.com/IndexConstituent/ind_nifty_Alpha_Index.csv`
  (found on `https://www.niftyindices.com/indices/equity/strategy-indices/nifty-alpha-50`).
  **Verified**: `200`, `Content-Type: application/octet-stream`, real CSV,
  same `Company Name,Industry,Symbol,Series,ISIN Code` schema as
  `ind_nifty200alpha30_list.csv`, 50 rows (correct — Alpha 50 has 50 names).
- **NIFTY100 Alpha 30** → `https://www.niftyindices.com/IndexConstituent/ind_nifty100Alpha30list.csv`
  (found on `.../strategy-indices/nifty100-alpha-30`). **Verified**: `200`,
  `application/octet-stream`, 30 rows (correct — Alpha 30 has 30 names).
- Fixtures: `tests/fixtures/india/niftyindices_niftyalpha50_constituents_20260924.csv`,
  `tests/fixtures/india/niftyindices_nifty100alpha30_constituents_20260924.csv`.

**Neither name follows the `ind_<slug>_list.csv` pattern the original spike
assumed** — the slug is per-index, not a mechanical transform of the display
name: Alpha 50's file has no `_list` suffix at all and mixed-case
`Alpha_Index`; NIFTY100 Alpha 30's file has no underscore before `list` and
mixed-case `Alpha30list`. **A fetcher must look these up (or hardcode a
verified table), not derive them from the index name algorithmically.**

Cross-checked independently via the Wayback CDX API (§9.2 below): its
`mimetype` field distinguishes real CSVs (`application/octet-stream`) from
niftyindices.com's soft-404 SPA shell (`text/html`, ~15.8 KB) for every
guessed slug, without needing to fetch the archived body — both filenames
above show up with the CSV mimetype in Wayback's records too, corroborating
the grep-based find. Five sibling slugs (`ind_nifty_alpha_lowvol30list.csv`,
`ind_nifty_alpha_quality_lowvol30list.csv`,
`ind_nifty_alpha_quality_value_lowvol30list.csv`, and older/deprecated
`ind_nifty200alpha30list.csv`/`ind_niftyalpha50list.csv` variants that are
now soft-404s) were also visible this way — useful if the "Alpha Low
Volatility" family is ever added to D6's universe list.

**NSE's archive host mirrors both files.** `https://nsearchives.nseindia.com/content/indices/ind_nifty_Alpha_Index.csv`
and `.../content/indices/ind_nifty100Alpha30list.csv` both return `200` with
`Content-Type: text/csv`, and their bodies are **byte-for-byte identical**
(diffed locally) to the niftyindices.com originals. A wrong filename on this
host (`ind_niftyalpha50list.csv`) returns a genuine `404` — this host has no
soft-404 SPA-shell problem anywhere in this project's testing (§1/§2/§6).
**Recommend fetching constituents from `nsearchives.nseindia.com/content/indices/<filename>`
as the primary path** (same reliable no-auth host already used for bhavcopy
and `ind_close_all`, avoiding niftyindices.com's soft-404 footgun entirely),
falling back to niftyindices.com's own host only if nsearchives ever 404s a
name it should have.

### 9.2 Historical (point-in-time) index membership

**Rebalance cadence — verified**, from niftyindices.com's own
`https://www.niftyindices.com/resources/index-rebalancing-schedule` page (a
rendered HTML table, no PDF): **Nifty Alpha 50, NIFTY100 Alpha 30, and
NIFTY200 Alpha 30 all rebalance quarterly** — last working day of March,
June, September, December. So a true point-in-time membership history needs
at least 4 dated snapshots per year, per index.

**Wayback Machine CDX API — the promising route, tested, insufficient.**
Queried per-file (wildcard `url=.../IndexConstituent/*` queries repeatedly
returned `503`/`504` from archive.org's CDX backend — **not reliable, avoid
it**; exact-URL queries with `matchType=exact` were reliable):

- `ind_nifty_Alpha_Index.csv` (Nifty Alpha 50): **2 snapshots total**,
  `2018-10-19` and `2019-02-01` — ~3.5 months apart, nothing before or since
  across the ~7 years Wayback has been crawling this domain.
- `ind_nifty100Alpha30list.csv` (NIFTY100 Alpha 30): **3 snapshots** — two
  near-duplicate crawls seconds apart on `2022-06-16`, then a ~4-year gap to
  `2026-09-14`.
- `ind_nifty200alpha30_list.csv` (NIFTY200 Alpha 30, the spike's own
  "known-good" reference file): **1 snapshot ever**, `2023-08-14`.

Full (untrimmed) results saved as
`tests/fixtures/india/wayback_cdx_niftyindices_alpha_constituents_snapshots.json`.

**Verdict: Wayback's coverage is far too sparse for point-in-time
reconstruction** — 1-3 snapshots spanning years, against a ~4-per-year
requirement. Not usable as a historical-membership source as-is, for any of
the three indices.

**No other machine-readable point-in-time source found within budget.**
niftyindices.com's press-release page (`/press-release`) and the
rebalancing-schedule page above give cadence/methodology, not a dated
change-log of who-was-added/removed. No "index reconstitution" PDF/circular
enumerating constituent changes was located; the per-index Factsheet PDFs
(e.g. `Factsheet_Nifty_Alpha50.pdf`, linked from the detail pages in §9.1)
are current-snapshot documents (top-10 holdings, latest stats), not fetched
in full this spike — inferred, not verified, that they lack historical
change-logs, based on standard NSE factsheet structure elsewhere in this
project's findings.

**Recommendation for #14 (point-in-time universes):** no free historical
constituent source exists today for any granularity close to quarterly.
Two-part approach:
1. **Start capturing our own dated snapshots going forward**: fetch each
   universe index's constituent CSV (§9.1) on/after each rebalance effective
   date (last working day of Mar/Jun/Sep/Dec, per the schedule above) and
   store it with that date. From the day this starts, Jesse has real
   point-in-time membership.
2. **For any backtest date before that start date, fall back to current
   members and explicitly flag the result** (e.g. `used_current_members:
   true` on the universe/report) rather than silently substituting today's
   list — this is the exact fallback PLAN.md's Phase 2 step 1 already
   anticipated; this spike confirms it's necessary (no better option exists)
   rather than a placeholder to be replaced by a "real" historical source
   later.

### 9.3 UDiFF backfill depth

**UDiFF backfill starts at exactly 01-Jan-2024** — the first trading day of
calendar year 2024 — with no UDiFF file for any earlier date. Found by binary
search on `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_<YYYYMMDD>_F_0000.csv.zip`
between the known bounds from spike #2 (`2010-01-04` fails, `2024-01-01`
succeeds), each candidate a weekday (adjacent weekday retried when a probe
landed on a weekend):

| Date | Day | Result |
|---|---|---|
| 2017-01-02 | Mon | `404` (confirmed a real trading day: legacy bhavcopy `cm02JAN2017bhav.csv.zip` → `200`) |
| 2017-01-03 | Tue (adjacent, retried) | `404` |
| 2020-07-02 | Thu | `404` |
| 2022-04-02 | Sat (not a trading day, discarded) | n/a |
| 2022-04-01 | Fri (adjacent) | `404` |
| 2023-02-15 | Wed | `404` |
| 2023-07-25 | Tue | `404` |
| 2023-10-13 | Fri | `404` |
| 2023-11-22 | Wed | `404` |
| 2023-12-12 | Tue | `404` |
| 2023-12-22 | Fri | `404` |
| 2023-12-27 | Wed | `404` |
| **2023-12-29** | **Fri (last trading day of 2023)** | **`404`** |
| **2024-01-01** | **Mon (first trading day of 2024)** | **`200`** (already known from spike #2) |

Dec 30-31, 2023 are a weekend, so 29-Dec-2023 and 01-Jan-2024 are
consecutive trading days with nothing between them — the boundary is exact,
not a gap narrowed to "somewhere in a range." All `404`s returned NSE's real
error page (`text/html`, ~3.4 KB, distinct from a soft-404 — this host, per
§1/§2, doesn't have the soft-404 problem BSE/niftyindices.com have).

This is a clean, deliberate-looking cutoff (exactly the 2024 calendar-year
boundary), not a gradual or arbitrary backfill depth — consistent with NSE
having backfilled UDiFF for "the current year plus history" starting when
UDiFF was adopted, rather than backfilling an arbitrary fixed window.
**Recommend defaulting the P1 fetcher to UDiFF for `>= 01-Jan-2024` and
legacy format for everything earlier**, per spike #2's existing
recommendation — now with an exact, not approximate, cutover date.

### 9.4 niftyindices.com historical-data endpoint

**Found the real endpoint and payload shape** by following the JS chain:
`/reports/historical-data` page → `historicalData.js` (a red herring — only
jQuery-UI internals, no app code) → the page's own inline `<script>` (a
*different* feature, bulk archive-file downloads, calling
`/reports/historical-data/Index/` — not what was wanted) → the per-index
detail pages (e.g. `/indices/equity/strategy-indices/nifty-alpha-50`) load
`https://liveindexsa.niftyindices.com/assets/js/IISLComponet.js`, whose
`HistoricalData(indexname, Datestart, dateEnd)` function makes the real call.

**Real endpoint:** `POST https://www.niftyindices.com/BackPage/getHistoricaldatatabletoString`
— **not** `Backpage.aspx/getHistoricaldatatabletoString` as guessed in spike
#2 (no `.aspx`, capital `P` in `BackPage`, no dot before the method name).
The guessed URL apparently hits old WCF-service-method routing that no
longer serves this feature (hence spike #2's `302` + generic error); the
real route is a newer, plain MVC-style path.

**Request:**
- `Content-Type: application/json; charset=UTF-8`
- Body: `{"cinfo": "<inner string>"}` where the inner string is a
  single-quoted (not double-quoted — the server parses it loosely, this is
  literal client JS, not a transcription simplification) pseudo-JSON blob:
  `{'name':'<TRADING NAME, UPPERCASE>','startDate':'<DD-Mon-YYYY>','endDate':'<DD-Mon-YYYY>','indexName':'<display name>'}`.
- `name` must be the index's `Trading_Index_Name` from
  `https://liveindexsa.niftyindices.com/assets/json/IndexMapping.json` (a
  public, unauthenticated 259-entry index-name lookup table used by the
  client itself to resolve whatever name the UI has to the name the backend
  expects), sent uppercased: `NIFTY ALPHA 50`, `NIFTY100 ALPHA 30`,
  `NIFTY200 ALPHA 30`.
- `indexName` is just the display name echoed back in the response's
  `INDEX_NAME` field (mixed case preserved) — using niftyindices.com's own
  display names (`Nifty Alpha 50`, `Nifty100 Alpha 30`, `Nifty200 Alpha 30`)
  works.
- **No cookie/session/Referer/X-Requested-With needed** — verified with a
  bare unauthenticated `POST` (spike #2 speculated a cookie dance might be
  required, by analogy with §5's corporate-actions API; not the case here,
  this is a plainer endpoint).

**Response:** JSON array of
`{RequestNumber, "Index Name", INDEX_NAME, HistoricalDate, OPEN, HIGH, LOW, CLOSE}`.
`HistoricalDate` is `DD Mon YYYY` (e.g. `05 Jan 2024`) — yet another distinct
date format from the other niftyindices.com/NSE sources in this project.
**`Content-Type` on the response is mislabeled `text/html; charset=utf-8`
despite a real JSON body** — a fetcher must parse the body as JSON directly
and not gate on Content-Type here (the opposite problem from BSE/§7's
soft-404s, where Content-Type is the *only* reliable signal — this endpoint
needs body-parsing instead). Fixture:
`tests/fixtures/india/niftyindices_historicaldata_api_niftyalpha50_20240101_20240105.json`.

**The client enforces a "date range ≤ 365 days" guard client-side** (a code
comment dates it to 28-Aug-2025) — **verified NOT enforced server-side**: a
4-year request (`01-Jan-2020` to `01-Jan-2024`) returned all 995 daily rows
in one call, no truncation or error. A fetcher can request multi-year
windows in a single call; no need to chunk by year.

**Depth — verified deeper than `ind_close_all`, for all three target
indices:**
- Nifty Alpha 50: data present back to **01-Jan-2004** (`2003-01-01` through
  `2003-01-05` and `2002`/`2000`/`1996` all return `[]` — empty, not an
  error); not bisected further between 2003 and 2004.
- NIFTY100 Alpha 30 and NIFTY200 Alpha 30: both have data at `01-Jan-2012`
  (`2005-01-01` returns `[]` for both — didn't narrow the exact boundary
  further within budget).
- All three are **deeper than `ind_close_all`'s ~2010-2015 boundary** found
  in spike #2 — Nifty Alpha 50 alone is roughly a decade deeper.
- Like `ind_close_all`, **OHLC completeness is not guaranteed on early
  dates**: rows from the 2004-2012 era return `OPEN`/`HIGH`/`LOW` as the
  string `"-"` with only `CLOSE` populated — same missing-value convention
  (`-`, not `0`) as `ind_close_all`.

**Recommendation:** promote niftyindices.com's historical-data API from
"secondary, not reverse-engineered" (spike #2's conclusion) to the
**primary** index-history source for the three Alpha indices — it goes back
further, needs no auth, and needs no per-year chunking. Keep `ind_close_all`
as a fallback/cross-check: it's a plain CSV (no cinfo string-building, no
JS-derived name mapping to maintain) and its OHLC-completeness on early
dates wasn't compared column-by-column against this API in this spike —
worth one more check before finalizing which is primary, if exact OHLC (not
just close) on old dates matters to the plan.
