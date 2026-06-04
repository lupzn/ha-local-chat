"""Home Assistant Local Chat – Integration (Backend)."""
import logging
import os
import time
import uuid

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.config_entries import SOURCE_IMPORT, ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType

from .const import (
    DOMAIN,
    EVENT_CHAT_MESSAGE,
    EVENT_CHAT_MESSAGE_DELETED,
    INTEGRATION_VERSION,
    JS_FILENAME,
    MAX_HISTORY,
    MAX_MESSAGE_LENGTH,
    SERVICE_DELETE,
    SERVICE_SEND,
    STORAGE_KEY,
    STORAGE_VERSION,
    URL_BASE,
    WS_GET_MESSAGES,
)

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)

SEND_SCHEMA = vol.Schema({vol.Required("message"): cv.string})
DELETE_SCHEMA = vol.Schema({vol.Required("message_id"): cv.string})

CARD_URL = f"{URL_BASE}/{JS_FILENAME}"
CARD_URL_VERSIONED = f"{CARD_URL}?v={INTEGRATION_VERSION}"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the frontend card + websocket once; import legacy YAML if present."""
    await _async_register_frontend(hass)

    # History is sent point-to-point over WebSocket (no global broadcast → no flicker).
    websocket_api.async_register_command(hass, websocket_get_messages)

    # Legacy `ha_chat:` in configuration.yaml → migrate into a config entry once.
    if DOMAIN in config:
        hass.async_create_task(
            hass.config_entries.flow.async_init(
                DOMAIN, context={"source": SOURCE_IMPORT}, data={}
            )
        )

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up chat storage + services from a config entry (UI or YAML import)."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    data = await store.async_load()
    messages = data.get("messages", []) if data else []

    # Migration: give older messages a stable ID so they can be deleted too.
    migrated = False
    for msg in messages:
        if "id" not in msg:
            msg["id"] = uuid.uuid4().hex
            migrated = True
    if migrated:
        await store.async_save({"messages": messages})

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["messages"] = messages
    hass.data[DOMAIN]["store"] = store

    async def handle_send_message(call: ServiceCall) -> None:
        """Handle sending a chat message."""
        msg_text = (call.data.get("message") or "").strip()
        if not msg_text:
            return
        if len(msg_text) > MAX_MESSAGE_LENGTH:
            msg_text = msg_text[:MAX_MESSAGE_LENGTH]

        user_name = "System"
        user_id = None
        if call.context.user_id:
            user = await hass.auth.async_get_user(call.context.user_id)
            if user:
                user_name = user.name
                user_id = user.id

        new_msg = {
            "id": uuid.uuid4().hex,
            "timestamp": time.time(),
            "user": user_name,
            "user_id": user_id,
            "message": msg_text,
        }

        msgs = hass.data[DOMAIN]["messages"]
        msgs.append(new_msg)
        while len(msgs) > MAX_HISTORY:
            msgs.pop(0)  # drop oldest

        await store.async_save({"messages": msgs})
        hass.bus.async_fire(EVENT_CHAT_MESSAGE, {"message": new_msg})

    async def handle_delete_message(call: ServiceCall) -> None:
        """Handle deleting a chat message (author or admin only)."""
        message_id = call.data["message_id"]

        user_id = call.context.user_id
        is_admin = False
        if user_id:
            user = await hass.auth.async_get_user(user_id)
            is_admin = bool(user and user.is_admin)

        msgs = hass.data[DOMAIN]["messages"]
        target = next((m for m in msgs if m.get("id") == message_id), None)
        if target is None:
            return

        if not is_admin and target.get("user_id") != user_id:
            raise HomeAssistantError(
                "Keine Berechtigung: Nur der Autor oder ein Admin darf diese "
                "Nachricht löschen."
            )

        msgs.remove(target)
        await store.async_save({"messages": msgs})
        hass.bus.async_fire(EVENT_CHAT_MESSAGE_DELETED, {"id": message_id})

    hass.services.async_register(
        DOMAIN, SERVICE_SEND, handle_send_message, schema=SEND_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_DELETE, handle_delete_message, schema=DELETE_SCHEMA
    )

    _LOGGER.info("HA Local Chat ready – %d message(s) loaded", len(messages))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the chat services on unload."""
    hass.services.async_remove(DOMAIN, SERVICE_SEND)
    hass.services.async_remove(DOMAIN, SERVICE_DELETE)
    return True


@websocket_api.websocket_command({vol.Required("type"): WS_GET_MESSAGES})
@callback
def websocket_get_messages(hass, connection, msg) -> None:
    """Send the full chat history to the requesting client only."""
    messages = hass.data.get(DOMAIN, {}).get("messages", [])
    connection.send_result(msg["id"], {"messages": messages})


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Serve the card folder and make the card available on dashboards.

    Three layers, each best-effort, so a failure in one never blocks setup:
      1) serve the `frontend/` folder over HTTP,
      2) load the module globally via `add_extra_js_url` (works in any mode),
      3) register a real Lovelace resource (storage mode) for the card editor.
    """
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")

    # 1) Serve the folder (not a single file) — matches the canonical pattern.
    try:
        from homeassistant.components.http import StaticPathConfig

        await hass.http.async_register_static_paths(
            [StaticPathConfig(URL_BASE, frontend_dir, False)]
        )
    except ImportError:
        # Fallback for Home Assistant < 2024.7
        hass.http.register_static_path(URL_BASE, frontend_dir, False)
    except RuntimeError:
        # Already registered (e.g. on reload) — fine.
        pass

    # 2) Load the module on the frontend regardless of Lovelace mode.
    try:
        add_extra_js_url(hass, CARD_URL_VERSIONED)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("add_extra_js_url failed: %s", err)

    # 3) Register a proper Lovelace resource so the card editor lists it.
    _async_register_lovelace_resource(hass)

    _LOGGER.info("HA Local Chat card served at %s", CARD_URL_VERSIONED)


@callback
def _async_register_lovelace_resource(hass: HomeAssistant) -> None:
    """Best-effort: add the card to Lovelace resources (storage mode only)."""
    lovelace = hass.data.get("lovelace")
    if lovelace is None:
        return
    mode = getattr(lovelace, "mode", getattr(lovelace, "resource_mode", "yaml"))
    resources = getattr(lovelace, "resources", None)
    if mode != "storage" or resources is None:
        return

    async def _register() -> None:
        try:
            if not getattr(resources, "loaded", False):
                # Load the resource collection from storage if needed.
                if hasattr(resources, "async_load"):
                    await resources.async_load()
            for item in resources.async_items():
                if str(item.get("url", "")).split("?")[0] == CARD_URL:
                    return  # already registered
            await resources.async_create_item(
                {"res_type": "module", "url": CARD_URL_VERSIONED}
            )
            _LOGGER.info("HA Local Chat: Lovelace resource registered (%s)", CARD_URL)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Lovelace resource registration skipped: %s", err)

    hass.async_create_task(_register())
