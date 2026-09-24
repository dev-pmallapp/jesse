from jesse.enums import exchanges as exchanges_enums, timeframes
from jesse.services.env import ENV_VALUES, is_dev_env


if is_dev_env():
    JESSE_API_URL = ENV_VALUES.get('JESSE_API_URL', 'http://localhost:8040/api')
    JESSE_API2_URL = ENV_VALUES.get('JESSE_API2_URL', 'http://localhost:8080')
    JESSE_WEBSITE_URL = ENV_VALUES.get('JESSE_WEBSITE_URL', 'http://localhost:8040')
else:
    JESSE_API_URL = 'https://api1.jesse.trade/api'
    JESSE_API2_URL = 'https://api2.jesse.trade'
    JESSE_WEBSITE_URL = 'https://jesse.trade'

exchange_info = {
    exchanges_enums.NSE: {
        "name": exchanges_enums.NSE,
        "url": "https://www.nseindia.com",
        # NSE is a historical data source (backed by historical_data/india), so execution fees remain a run setting.
        "fee": 0.0,
        "type": "spot",
        "supported_leverage_modes": [],
        # Only 1D and 1W are usable: `daily_bars_only` below rejects every other timeframe
        # (see validators.py; 1W is Monday-anchored via `jh.timeframe_bucket_start`).
        "supported_timeframes": [timeframes.DAY_1, timeframes.WEEK_1],
        "modes": {
            "backtesting": True,
            "live_trading": False,
        },
        "required_live_plan": "premium",
        "settlement_currency": "INR",
        "asset_class": "equity",
        "instrument_type": "stock",
        "simulation_model": "spot",
        "annualization": 252,
        # `is_daily_bars_only`/`_validate_daily_bars_only_timeframes` (services/validators.py) reject any
        # route outside `DAILY_BARS_ONLY_ALLOWED_TIMEFRAMES`: the India source layer stores exactly one
        # 1m row per session, stamped at 15:29 IST.
        "daily_bars_only": True,
    },
    exchanges_enums.BSE: {
        "name": exchanges_enums.BSE,
        "url": "https://www.bseindia.com",
        # BSE is a historical data source (backed by historical_data/india), so execution fees remain a run setting.
        "fee": 0.0,
        "type": "spot",
        "supported_leverage_modes": [],
        # Only 1D and 1W are usable: `daily_bars_only` below rejects every other timeframe
        # (see validators.py; 1W is Monday-anchored via `jh.timeframe_bucket_start`).
        "supported_timeframes": [timeframes.DAY_1, timeframes.WEEK_1],
        "modes": {
            "backtesting": True,
            "live_trading": False,
        },
        "required_live_plan": "premium",
        "settlement_currency": "INR",
        "asset_class": "equity",
        "instrument_type": "stock",
        "simulation_model": "spot",
        "annualization": 252,
        # `is_daily_bars_only`/`_validate_daily_bars_only_timeframes` (services/validators.py) reject any
        # route outside `DAILY_BARS_ONLY_ALLOWED_TIMEFRAMES`: the India source layer stores exactly one
        # 1m row per session, stamped at 15:29 IST.
        "daily_bars_only": True,
    },
}

# Defensive defaults for any exchange entry that doesn't declare its own classification
# and simulation assumptions (every current NSE/BSE entry above already does).
for _exchange in exchange_info.values():
    _exchange.setdefault('asset_class', 'equity')
    _exchange.setdefault('instrument_type', 'perpetual' if _exchange['type'] == 'futures' else 'spot')
    _exchange.setdefault('simulation_model', 'perpetual_futures' if _exchange['type'] == 'futures' else 'spot')
    _exchange.setdefault('annualization', 365)

# list of supported exchanges for backtesting
backtesting_exchanges = [k for k, v in exchange_info.items() if v['modes']['backtesting'] is True]
backtesting_exchanges = list(sorted(backtesting_exchanges))

# list of supported exchanges for live trading
live_trading_exchanges = [k for k, v in exchange_info.items() if v['modes']['live_trading'] is True]
live_trading_exchanges = list(sorted(live_trading_exchanges))

# used for backtesting, and live trading when local candle generation is enabled:
jesse_supported_timeframes = [
    timeframes.MINUTE_1,
    timeframes.MINUTE_3,
    timeframes.MINUTE_5,
    timeframes.MINUTE_15,
    timeframes.MINUTE_30,
    timeframes.MINUTE_45,
    timeframes.HOUR_1,
    timeframes.HOUR_2,
    timeframes.HOUR_3,
    timeframes.HOUR_4,
    timeframes.HOUR_6,
    timeframes.HOUR_8,
    timeframes.HOUR_12,
    timeframes.DAY_1,
]
