from jesse.enums import exchanges
from jesse.services.historical_data import HistoricalCandleProviderRegistry
# Imported from the India package directly rather than re-exported by
# jesse.services.historical_data: that package loads on every `import jesse`, while this
# drivers module only loads when importing candles, so a minimal process skips India too.
from jesse.services.historical_data.india import BseProvider, NseProvider


# Backtest-only (story #9): NSE/BSE data comes from the India archive layer, never live -
# this fork keeps no separate "live driver" registry now that every crypto driver is gone.
historical_provider_classes = {
    exchanges.NSE: NseProvider,
    exchanges.BSE: BseProvider,
}
historical_provider_names = list(historical_provider_classes)


def build_historical_provider_registry(
    provider_ids: tuple[str, ...] | None = None,
) -> HistoricalCandleProviderRegistry:
    """Build fresh providers so sessions and any per-instance state are never shared between imports."""
    registry = HistoricalCandleProviderRegistry()
    selected_provider_ids = tuple(historical_provider_classes) if provider_ids is None else provider_ids
    for provider_id in selected_provider_ids:
        provider_class = historical_provider_classes.get(provider_id)
        if provider_class is None:
            # Use the registry's stable typed lookup error for unknown provider IDs.
            registry.get(provider_id)
        registry.register(provider_class())
    return registry
