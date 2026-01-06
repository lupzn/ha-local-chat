"""Die Chat-Integration."""
import logging
import time
from homeassistant.core import HomeAssistant, ServiceCall, Context
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType

from .const import (
    DOMAIN,
    EVENT_CHAT_MESSAGE,
    SERVICE_SEND,
    MAX_HISTORY,
    STORAGE_KEY,
    STORAGE_VERSION,
)

_LOGGER = logging.getLogger(__name__)

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Setup der Integration via YAML (oder minimalen Load)."""
    
    # 1. Speicher initialisieren (JSON Datei im .storage Ordner)
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    
    # Laden der alten Nachrichten beim Start
    data = await store.async_load()
    if data is None:
        messages = []
    else:
        messages = data.get("messages", [])

    # Speichern wir die Nachrichten im hass.data, damit wir schnell zugreifen können
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["messages"] = messages

    async def handle_send_message(call: ServiceCall):
        """Handler für das Senden einer Nachricht."""
        msg_text = call.data.get("message")
        
        # User identifizieren
        user_name = "System"
        user_id = None
        
        if call.context.user_id:
            user = await hass.auth.async_get_user(call.context.user_id)
            if user:
                user_name = user.name
                user_id = user.id

        # Neue Nachricht Objekt
        new_msg = {
            "timestamp": time.time(),
            "user": user_name,
            "user_id": user_id,
            "message": msg_text
        }

        # Nachricht anhängen und Liste begrenzen
        current_msgs = hass.data[DOMAIN]["messages"]
        current_msgs.append(new_msg)
        
        if len(current_msgs) > MAX_HISTORY:
            current_msgs.pop(0) # Älteste löschen

        # 1. Persistent speichern
        await store.async_save({"messages": current_msgs})

        # 2. Event feuern (für das Frontend)
        hass.bus.async_fire(EVENT_CHAT_MESSAGE, {"message": new_msg})

    # Service registrieren
    hass.services.async_register(DOMAIN, SERVICE_SEND, handle_send_message)

    # Service um Historie abzurufen (für neue Clients)
    async def handle_get_history(call: ServiceCall):
        """Sendet die gesamte Historie an den Aufrufer (via Event)."""
        # Wir feuern ein spezielles Event nur für den Client, 
        # aber einfachheitshalber senden wir hier einfach ein Bulk-Event.
        # Im Frontend filtern wir das.
        hass.bus.async_fire(f"{EVENT_CHAT_MESSAGE}_history", {"messages": hass.data[DOMAIN]["messages"]})

    hass.services.async_register(DOMAIN, "get_history", handle_get_history)

    return True