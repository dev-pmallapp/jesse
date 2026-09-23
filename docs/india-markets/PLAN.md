# Indian Markets Support — Plan

Status: **draft, not started** · Scope owner: orchestrator (Opus) · Last updated: 2026-09-23

## Goal

Research, screening and backtesting of Indian instruments for **swing trading**. No live
trading (jesse-live is out of scope).

In scope: NSE/BSE equities, ETFs, indices (incl. smart-beta such as NIFTY200 Alpha 30),
mutual funds, corporate bonds (attribute screening), and fundamentals for screening.
Out of scope: F&O / options, intraday product rules (MIS square-off), live broker adapters.

## Decisions

| # | Decision | Choice |
|---|----------|--------|
| D1 | Primary market-data source | **Dhan API v2** (`/v2/charts/historical`, `/v2/charts/intraday`, scrip master for security IDs) |
| D2 | Naming | **TradingView style** at the user surface: `NSE:RELIANCE`, `BSE:RELIANCE`, `NSE:NIFTY`, `AMFI:<scheme_code>`. Internally exchange=`NSE`, symbol=`RELIANCE-INR` so `jh.quote_asset()` and INR settlement work unchanged |
| D3 | Bar resolution | **Daily-first.** One 1m row per session stamped at the session close carries the day's OHLCV; the existing sparse-market engine aggregates it to correct 1D/1W candles. Routes on these markets must be `>= 1D` (validated) |
| D4 | Mutual funds source | **AMFI NAV history** (official, free); NAV stored as a flat candle (O=H=L=C, volume 0) |
| D5 | Fundamentals | Point-in-time store keyed by **filing date**, not period end; CSV import first, automated source second (see Phase 3) |

Why D3: the engine only backtests from 1m rows (`source_timeframe` / `native_timeframes` exist in
`historical_data/contracts.py` but nothing consumes them). Minute history for a 500-stock universe
is hundreds of millions of rows, Dhan intraday depth is limited, and MFs/bonds have no intraday
data. Swing strategies fill against daily high/low anyway. Native non-1m sources can come later.

## Existing groundwork to reuse

- `jesse/services/historical_data/contracts.py` — provider contract, `AssetClass`, `InstrumentType`, `AdjustmentMode`, `SymbolCatalogEntry`
- `jesse/services/historical_data/massive_stocks.py` — reference provider (credentials, rate limiting, catalog, earliest-timestamp discovery)
- `jesse/modes/import_candles_mode/drivers/__init__.py` — `historical_provider_classes` registration
- `jesse/info.py` — per-exchange `asset_class`, `instrument_type`, `simulation_model`, `annualization`, backtest-only `modes`
- Sparse-market replay in `backtest_mode.py` / `candle_service.py`
- `jesse/services/trading_hours.py` — timezone, holidays, overrides
- `jesse/models/DataProviderCredentials.py` — per-provider credential storage
- `jesse/research/` — backtest / candles / import helpers the screener builds on

## Phases

### Phase 1 — NSE/BSE equities, ETFs, indices (data + backtest)

0. **Probe Dhan** (before any code): record real responses for historical daily/intraday and the
   scrip master. Answer: are prices split/bonus adjusted? how far back does daily go? rate limits?
   timestamp format/timezone? index and ETF coverage (e.g. NIFTY200 Alpha 30 and its ETFs)?
   Recorded payloads become test fixtures.
1. `jesse/services/historical_data/india/dhan.py` — `DhanProvider(HistoricalCandleProvider)`:
   scrip-master cache (symbol → security ID, segment, instrument type), daily fetch, IST→UTC,
   half-open ranges, credential loader (client ID + access token), pacing.
2. Daily-as-sparse-1m storage (D3) and a route validator rejecting `< 1D` on these exchanges.
3. `NSE` / `BSE` entries in `enums` and `info.py`: `settlement_currency='INR'`,
   `annualization=252`, backtesting only, `asset_class` equity.
4. TradingView symbol helper: `parse_tv_symbol('NSE:RELIANCE') -> ('NSE', 'RELIANCE-INR')` and back.
5. `jesse/markets/india.py` — NSE/BSE trading-hours preset + per-year holiday data.
6. Tests: provider contract tests on recorded fixtures; symbol helper; a sparse daily INR backtest
   via a test strategy (`jesse-strategy-tests` skill).

Done when: `NSE:RELIANCE`, `NSE:NIFTY`, `NSE:NIFTYBEES` import and backtest on 1D.

### Phase 2 — Screener and costs

1. Universes: named symbol lists from NSE index-constituent CSVs, custom lists, or "all imported
   on an exchange". **Survivorship bias:** constituent files are current-only — reports must say so.
2. `jesse.research.screen(universe, date_or_range, score_fn, filters)` → ranked table (+ CSV),
   computed with Jesse indicators over stored candles.
3. Batch backtest of a shortlist (one run per symbol) with an aggregate report.
4. Delivery (CNC) cost preset: STT, stamp duty, exchange txn charge, SEBI fee, GST, DP charge per
   sell, Dhan brokerage. Rates carry effective dates. Requires a per-fill cost hook alongside the
   existing flat `fee_rate` (crypto exchanges keep the flat fee).
5. Corporate-action adjustment (splits/bonus) only if Phase 1 probe shows Dhan data is unadjusted.

### Phase 3 — Fundamentals for screening

Fundamentals are not candles, so they get their own store and provider contract.

1. **Point-in-time store** — table `fundamentals(exchange, symbol, metric, period_end, period_type
   [Q/FY/TTM], filed_at, value, currency, source)`. Queries are `as_of`-based and only return rows
   with `filed_at <= as_of`, so backtests and historical screens never see results before they were
   public (no look-ahead). Restated figures are new rows with a later `filed_at`.
2. **Provider contract** — `FundamentalsProvider` mirroring `HistoricalCandleProvider`
   (capabilities: metrics offered, history depth, point-in-time or not).
3. **Sources, in order:**
   - **CSV import** (always available): a documented column schema so any export can be loaded.
   - **Automated source** — decision pending: NSE/BSE XBRL financial-results and
     shareholding-pattern filings (official, free, carries filing timestamps; needs an XML parser on
     the stdlib and robust fetching) **vs.** a paid vendor API. Dhan does not provide fundamentals.
     Scraping sites whose terms prohibit it (e.g. Screener.in) is excluded.
4. **Metrics** — reported: revenue, EBITDA, net profit, EPS, total equity, total debt, cash,
   shares outstanding, promoter holding %, promoter pledge %. Derived at `as_of` using that day's
   close: market cap, P/E (TTM), P/B, EV/EBITDA, ROE, ROCE, debt/equity, revenue and profit growth
   (YoY / 3y CAGR).
5. **Access** — screener filters (`pe < 25`, `roe > 15`, `promoter_pledge == 0`), and a
   strategy-facing `self.fundamental(metric)` that is point-in-time at `self.time` (precise typing
   per AGENTS.md).
6. Tests: as-of correctness (no look-ahead), restatements, TTM derivation, CSV schema validation.

### Phase 4 — Mutual funds

1. AMFI NAV provider (`AMFI` exchange) + scheme catalog with category/sub-category.
2. Fund metrics: rolling returns, max drawdown, volatility, benchmark comparison.
3. Exit-load cost rule by holding period.

### Phase 5 — Corporate bonds (attribute screening)

1. Bond attributes from the Dhan scrip master (coupon, maturity, face value, ISIN) where present.
2. YTM from last traded price; attribute-based screening only — prints are too sparse to backtest.
3. Credit ratings need a separate source (not in Dhan).

### Later / optional

- Session-anchored intraday buckets (09:15-based 1h/30m) if intraday research is ever needed.
- Dashboard views for screener output (dashboard-v1 — separate repo, confirm first).

## Execution

Per phase: Opus writes specs → `implementer` → `tester` → `reviewer` → `doc-writer`.
One `feat/india-*` branch per PR, PRs against `dev-pmallapp/jesse` master.

## Open questions

- Dhan Data API plan active on the account? (historical endpoints are gated)
- Phase 3 automated fundamentals source: NSE/BSE XBRL filings or a paid vendor?
- Which universes matter first (NIFTY 50 / 200 / 500, NIFTY200 Alpha 30, custom)?
