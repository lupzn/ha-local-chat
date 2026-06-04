# HA Local Chat — Roadmap

A private, fully-local chat for [Home Assistant](https://www.home-assistant.io).
Backend integration + auto-registered Lovelace card, no cloud.

## Architecture (already built)

```
custom_components/ha_chat/
├── __init__.py        ← services (send/delete), WebSocket history, Store, frontend auto-register
├── const.py           ← events, limits, storage keys
├── manifest.json
├── services.yaml      ← send_message / delete_message
└── ha-chat-card.js    ← Lovelace card (auto-loaded via add_extra_js_url)
```

- **Real-time**: new messages fire `ha_chat_message` on the event bus.
- **Deletes**: `ha_chat_message_deleted` event; permission checked server-side.
- **History**: point-to-point WebSocket command `ha_chat/get_messages`.
- **Storage**: Home Assistant `Store` keeps the last 100 messages.

## Shipped — v2.0

- ✅ Real-time multi-user chat on the dashboard
- ✅ Persistent history (100 messages)
- ✅ Delete own messages + admin-delete-any (server-enforced)
- ✅ Emoji picker, full UTF-8
- ✅ Avatars, date separators, multi-line input, auto-scroll
- ✅ XSS-safe rendering
- ✅ Automatic card registration (no manual resource)
- ✅ Config flow — UI setup via *Add Integration*, no YAML (v2.1)

## Planned (priority order)

### Unread badge + sound — v2.1
Optional new-message sound and an unread counter when the card is off-screen.

### Message reactions — v2.2
React to a message with an emoji (👍 ❤️ 😂); counts shown under the bubble.

### @mentions + notifications — v2.2
Type `@name` to mention a user; optionally push a Home Assistant mobile
notification to the mentioned person.

### Multiple rooms / channels — v2.3
More than one chat room (e.g. *Family*, *Tech*), selectable in the card config.

### Image & attachment support — v2.3
Paste or attach an image; stored locally and shown inline.

### Edit messages — v2.x
Edit your own sent messages (with an "edited" marker).

### Safe Markdown — v2.x
Render a safe subset of Markdown (bold, italic, links) without reintroducing XSS.

### History search — v2.x
Search the chat history by text, sender, or date.

## Out of scope (deliberately)

- Cloud sync, federation, or any external server
- Bridging to third-party chat networks (Slack, WhatsApp, …)
- Replacing Home Assistant's notification system — this complements it
