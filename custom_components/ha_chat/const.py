"""Konstanten für HA Local Chat."""

DOMAIN = "ha_chat"

# Events (Event-Bus → Frontend)
EVENT_CHAT_MESSAGE = "ha_chat_message"
EVENT_CHAT_MESSAGE_DELETED = "ha_chat_message_deleted"

# Services
SERVICE_SEND = "send_message"
SERVICE_DELETE = "delete_message"

# WebSocket-Command (Historie Point-to-Point, kein globales Broadcast)
WS_GET_MESSAGES = "ha_chat/get_messages"

# Limits
MAX_HISTORY = 100          # Anzahl gespeicherter Nachrichten
MAX_MESSAGE_LENGTH = 2000  # Max. Zeichen pro Nachricht

# Storage
STORAGE_KEY = "ha_chat_history"
STORAGE_VERSION = 1

# Frontend delivery — the `frontend/` folder is served over HTTP, the card is
# auto-registered as a Lovelace resource (storage mode) and loaded as a module.
INTEGRATION_VERSION = "2.1.2"
JS_FILENAME = "ha-chat-card.js"
URL_BASE = "/ha_chat_frontend"
