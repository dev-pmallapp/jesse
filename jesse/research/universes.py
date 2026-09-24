"""`jesse.research.universe`/`list_universes` - thin wrappers around
`jesse.services.historical_data.india.universes` (dev-pmallapp/jesse#14).

India modules must never load on a plain `import jesse`/`import jesse.research` (see
that package's own module docstrings) - every India import here happens inside the
function body, not at module level, so importing this file costs nothing until one of
these functions is actually called.
"""
from datetime import date
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    # Only for type-checkers (Pyrefly/mypy) - never imported at runtime module load.
    from jesse.services.historical_data.india.http import IndiaHttpClient
    from jesse.services.historical_data.india.universes import Universe


def universe(
    name: str,
    as_of: 'date | None' = None,
    *,
    refresh: bool = False,
    snapshot_dir: 'str | Path | None' = None,
    http_client: 'IndiaHttpClient | None' = None,
) -> 'Universe':
    """Resolve an NSE index universe's point-in-time membership.

    See `jesse.services.historical_data.india.universes.universe` for the full
    contract (rebalance-period resolution, snapshot capture, survivorship-bias
    flagging via `Universe.used_current_members`).
    """
    from jesse.services.historical_data.india.universes import universe as _universe
    return _universe(name, as_of, refresh=refresh, snapshot_dir=snapshot_dir, http_client=http_client)


def list_universes() -> 'tuple[str, ...]':
    """Canonical names of every supported NSE index universe, sorted."""
    from jesse.services.historical_data.india.universes import list_universes as _list_universes
    return _list_universes()
