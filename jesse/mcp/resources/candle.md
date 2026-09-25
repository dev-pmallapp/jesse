# Candle Management Reference

This reference covers candle import and management operations in Jesse. This fork supports NSE and BSE (spot equity, daily bars only).

## Symbol Format

Every `symbol` parameter below accepts a bare NSE/BSE ticker (`RELIANCE`), the TradingView-style form (`NSE:RELIANCE`), or the internal `BASE-QUOTE` form (`RELIANCE-INR`) - all three resolve to the same symbol. A hyphenated ticker like `BAJAJ-AUTO` also works bare and normalizes to `BAJAJ_AUTO-INR`.

## Data Requirements

Historical candle data is required for backtesting strategies. Import data for every route's exchange and symbol before running backtests.

Jesse imports and stores **one-minute candles only**. For NSE and BSE that means one 1m row per trading session, stamped at 15:29 IST and carrying the whole session's OHLCV. In backtests, optimization, Monte Carlo, significance tests and research, `1D` and `1W` candles are built from those session rows at run time, so a single import per exchange and symbol covers every timeframe a route or `get_candles()` asks for (valid timeframes: `1D` for daily and `1W` for weekly). Timeframes are never imported, so when checking coverage only confirm that the symbol's data spans the backtest dates plus warm-up.

## Import Process

DO NOT pre-check candle availability before running a backtest. Run the
backtest first and only import on a missing-data error. Pre-checking with
`get_existing_candles()` wastes time and tokens, and the backtest engine
itself is the authoritative source of whether the required data is present
for a given route, timeframe, and date range.

Correct flow:

1. Run the backtest (see `jesse://backtest_management`).
2. If — and only if — it fails with a missing-candle error, call
   `import_candles()` starting ~2 months before the user's `start_date`.
3. Poll `get_candle_import_status(import_id)` until `"finished"`, `"failed"`, or `"cancelled"`. After `"finished"`,
   retry the backtest.
4. Use `get_existing_candles()` only for explicit user-driven inspection
   (e.g. "what data do I have?"), never as a pre-flight gate.

## Tool Reference

### get_existing_candles()

Checks what candle data is currently available in the database.

**Returns:** List of available candle datasets with exchange, symbol, timeframe, and date ranges.

### search_symbols()

Finds importable symbols on NSE or BSE. Use it when the user names an Indian stock or ETF instead of an exact Jesse symbol, or when an import fails with a symbol-not-found error.

**Parameters:**
- `exchange`: Exchange name, either "NSE" or "BSE"
- `query`: Stock ticker, company name, or part of the symbol (e.g., "RELIANCE", "TCS", "infosys")
- `limit` (optional): Maximum matches, default 20, maximum 200

**Ranking:** ticker prefixes first, then names that contain the query.

**Returns:** `matches`, each with `symbol` and other details:

```python
search_symbols(exchange="NSE", query="reliance")
# {"status": "success", "match_count": 2, "matches": [
#   {"symbol": "RELIANCE-INR", "name": "Reliance Industries Limited"},
#   {"symbol": "NIFTYBEES-INR", "name": "Nifty Bees ETF"},
#   ...
# ]}
```

Pass the returned `symbol` to `import_candles()` verbatim.

### copy_candles()

Duplicates stored candles under another exchange name (and optionally another symbol) for testing or data management.

**Parameters:**
- `exchange`, `symbol`: the stored source series
- `target_exchange`: target exchange ("NSE" or "BSE")
- `target_symbol` (optional): defaults to `symbol`
- `delete_source` (optional, default false): remove the original in the same transaction

Rules: the whole stored daily series is copied, which is everything a backtest needs for any timeframe; the call is refused (HTTP 409) when the target already holds candles, so series are never merged.

**Returns:** `copied_count`, `deleted_count`, and the resolved target.

### import_candles()

Imports historical daily candle data from NSE or BSE.

**Parameters:**
- `exchange`: Exchange name ("NSE" or "BSE")
- `symbol`: Stock symbol (e.g., "RELIANCE-INR", "TCS-INR", "INFY-INR")
- `start_date`: Start date in YYYY-MM-DD format
- `import_id` (optional): Import ID for retrying failed imports

**Timeframes:** the import stores daily candles. In backtests and research modes, higher timeframes like `1W` are built from daily candles at run time. Valid timeframes for routes and `get_candles()` are `1D` (daily) and `1W` (weekly).

**Returns:** Import result with status and import ID

## Market Hours and Gapped Data

NSE and BSE are closed on weekends and holidays, so their daily series has real gaps. Jesse never fabricates candles for a closure:

- Backtests detect gapped data automatically and replay only the candles that exist. Weekly candles are built from the observed daily bars.
- Warm-up is counted in **completed observed candles** of the route's timeframe (daily or weekly), not calendar time.
- A resting order crossed by an opening gap fills at the **open price**, not at its own price.
- Metrics annualize on 252 trading days by default.

## Usage Examples

### Basic Import (NSE)
```python
result = import_candles(
    exchange="NSE",
    symbol="RELIANCE-INR",
    start_date="2024-01-01"
)
```

### Retry Failed Import
```python
# First attempt
result = import_candles(
    exchange="NSE",
    symbol="TCS-INR",
    start_date="2024-01-01"
)

# If failed, retry with same import_id
if result.get("status") != "success":
    import_id = result.get("import_id")
    retry_result = import_candles(
        exchange="NSE",
        symbol="TCS-INR",
        start_date="2024-01-01",
        import_id=import_id
    )
```

## Retry Behavior

When retrying imports with the same `import_id`:

- Previous events are automatically cleared
- Import resumes from the failure point
- Already-imported candles are skipped
- Progress monitoring starts fresh but continues efficiently
- WebSocket events are isolated per retry

## Success Response Format

```
"Successfully imported candles since '2024-01-01' until today (2.1 days imported, 1.2 days already existed in the database)."
```

The message shows both newly imported data and pre-existing data that was skipped.
