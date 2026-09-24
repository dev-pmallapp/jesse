"""
Jesse Credential Management Tools

MCP tools for the credentials the Dashboard manages under "Exchange API Keys":

- get_exchange_api_keys: List stored exchange API keys (masked)
- store_exchange_api_key: Add an exchange API key for Jesse Live
- delete_exchange_api_key: Remove an exchange API key

Secrets are write-only: no tool ever returns a stored key.
All tools require authentication via Jesse admin password.
"""

from typing import Optional

from jesse.mcp.tools.services.credentials import (
    delete_exchange_api_key_service,
    get_exchange_api_keys_service,
    store_exchange_api_key_service,
)


def register_credentials_tools(mcp):
    """Register the credential management tools with the MCP server."""

    @mcp.tool()
    def get_exchange_api_keys() -> dict:
        """List the exchange API keys stored for Jesse Live.

        Each entry has `id`, `exchange`, `name`, and masked `api_key`/`api_secret` values.
        Use the `id` with delete_exchange_api_key(). Stored secrets are never returned in full.
        """
        return get_exchange_api_keys_service()

    @mcp.tool()
    def store_exchange_api_key(
        exchange: str,
        name: str,
        api_key: str,
        api_secret: str,
        additional_fields: Optional[dict[str, str]] = None,
    ) -> dict:
        """Store an exchange API key so Jesse Live can trade on that exchange.

        - `exchange`: a live-trading exchange name exactly as Jesse lists it. Jesse's
          open-source `live_trading_exchanges` is empty until a live-trading plugin
          (e.g. jesse-live) registers one; check that list before calling this tool.
        - `name`: a unique label the user will recognize, e.g. "Main NSE account".
        - `additional_fields`: only for exchanges whose plugin requires extra secrets
          beyond `api_key`/`api_secret` - check that exchange's own documentation.

        Only pass secrets the user has explicitly provided in this conversation. The response
        contains masked values only; never repeat the full key or secret back to the user.
        """
        return store_exchange_api_key_service(
            exchange=exchange,
            name=name,
            api_key=api_key,
            api_secret=api_secret,
            additional_fields=additional_fields,
        )

    @mcp.tool()
    def delete_exchange_api_key(id: str) -> dict:
        """Delete one stored exchange API key by the `id` from get_exchange_api_keys().

        Confirm with the user first: a live session using this key cannot be started again
        until a new key is stored.
        """
        return delete_exchange_api_key_service(id)
