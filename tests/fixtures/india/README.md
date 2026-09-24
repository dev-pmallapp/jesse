# India markets source-probe fixtures

Real payloads fetched during the source-probe spike for GitHub issue
`dev-pmallapp/jesse#2` (see `docs/india-markets/spike-sources.md` for full
findings). Every file below is **trimmed** to a header plus a handful of rows
(kept < 20 KB) — none of these are complete bhavcopies. Fetched 2026-09-23
using ordinary browser-like headers (`curl`, custom `User-Agent`), no
authentication beyond what's noted per source in the findings doc.

Where the original was a `.zip`/`.CSV.ZIP`, the file here is the **unzipped**
CSV text (compression noted below, not preserved in the fixture).

| File | Source | Original format | Fetch date used |
|---|---|---|---|
| `nse_bhavcopy_legacy_20240101.csv` | `https://nsearchives.nseindia.com/content/historical/EQUITIES/2024/JAN/cm01JAN2024bhav.csv.zip` | CSV inside ZIP | 01-Jan-2024 |
| `nse_bhavcopy_legacy_19950102.csv` | `https://nsearchives.nseindia.com/content/historical/EQUITIES/1995/JAN/cm02JAN1995bhav.csv.zip` | CSV inside ZIP | 02-Jan-1995 (older column layout — no `ISIN`/`TOTALTRADES`) |
| `nse_bhavcopy_legacy_allcargo_unadjusted_proof.csv` | Same legacy URL pattern, three dates (29-Dec-2023, 01-Jan-2024, 02-Jan-2024) concatenated | CSV inside ZIP | Evidence that bhavcopy prices are **not** retroactively split/bonus-adjusted — see finding under D7 in the findings doc (ALLCARGO 3:1 bonus, ex-date 02-Jan-2024) |
| `nse_bhavcopy_udiff_20240708.csv` | `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv.zip` | CSV inside ZIP | 08-Jul-2024 (first UDiFF date) |
| `nse_bhavcopy_udiff_20260918.csv` | Same UDiFF URL pattern | CSV inside ZIP | 18-Sep-2026 (recent), includes `ALPHA` and `ALPHAETF` |
| `nse_sec_bhavdata_full_20240101.csv` | `https://nsearchives.nseindia.com/products/content/sec_bhavdata_full_01012024.csv` | plain CSV, not zipped | 01-Jan-2024 (adds `DELIV_QTY`/`DELIV_PER`) |
| `bse_bhavcopy_udiff_20240708.csv` | `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_20240708_F_0000.CSV` | plain CSV, not zipped | 08-Jul-2024 |
| `bse_bhavcopy_legacy_20240101.csv` | `https://www.bseindia.com/download/BhavCopy/Equity/EQ010124_CSV.ZIP` | CSV inside ZIP | 01-Jan-2024 |
| `nse_corporate_actions_20240101_20240331.json` | `https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=01-01-2024&to_date=31-03-2024` | JSON, needs session cookie (see findings doc) | Jan–Mar 2024, filtered to a face-value split (NESTLEIND), a bonus (ALLCARGO), a second split (PGIL) and two dividends |
| `nse_ind_close_all_20240101.csv` | `https://nsearchives.nseindia.com/content/indices/ind_close_all_01012024.csv` | plain CSV, not zipped | 01-Jan-2024, filtered to Nifty 50/500/Bank + all 3 verified Alpha indices |
| `nse_ind_close_all_20150105.csv` | Same URL pattern | plain CSV | 05-Jan-2015 — shows the index was named `CNX Nifty` at that time (renamed to `Nifty 50` later) |
| `niftyindices_nifty200alpha30_constituents_20260923.csv` | `https://www.niftyindices.com/IndexConstituent/ind_nifty200alpha30_list.csv` | plain CSV (kept whole — already 1.9 KB) | fetched 2026-09-23, current constituents |
| `nse_equity_l.csv` | `https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv` | plain CSV | current security master, filtered rows |
| `nse_eq_etfseclist.csv` | `https://nsearchives.nseindia.com/content/equities/eq_etfseclist.csv` | plain CSV | current ETF master, filtered rows |
| `niftyindices_niftyalpha50_constituents_20260924.csv` | `https://www.niftyindices.com/IndexConstituent/ind_nifty_Alpha_Index.csv` | plain CSV (kept whole — 3.2 KB) | fetched 2026-09-24, current constituents (50 rows) — spike #41, correct slug for "Nifty Alpha 50" found via the index page's rendered `href`, not by pattern-guessing |
| `niftyindices_nifty100alpha30_constituents_20260924.csv` | `https://www.niftyindices.com/IndexConstituent/ind_nifty100Alpha30list.csv` | plain CSV (kept whole — 2 KB) | fetched 2026-09-24, current constituents (30 rows) — spike #41, correct slug for "NIFTY100 Alpha 30" |
| `niftyindices_historicaldata_api_niftyalpha50_20240101_20240105.json` | `https://www.niftyindices.com/BackPage/getHistoricaldatatabletoString` (POST) | JSON, pretty-printed (original is compact) | fetched 2026-09-24, 5-day OHLC window for Nifty Alpha 50 — spike #41, the real endpoint path (`/BackPage/...`, no `.aspx`, no session/cookie needed) superseding the guessed `Backpage.aspx/...` path from spike #2 |
| `wayback_cdx_niftyindices_alpha_constituents_snapshots.json` | `https://web.archive.org/cdx/search/cdx?url=niftyindices.com/IndexConstituent/<file>&output=json` (one query per file, combined here) | JSON, pretty-printed, combined from 3 queries | fetched 2026-09-24 — spike #41, full (not trimmed further) Wayback snapshot history for the Alpha 50 / NIFTY100 Alpha 30 / NIFTY200 Alpha 30 constituent CSVs, evidence for the "too sparse for point-in-time membership" finding |

All fixtures are trimmed samples for tests/reference only — treat row counts,
totals, etc. as non-representative of the full file.
