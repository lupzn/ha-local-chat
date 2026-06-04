# HA Local Chat — Roadmap

A private, fully-local chat for [Home Assistant](https://www.home-assistant.io):
a backend integration plus a self-registering Lovelace card. No cloud.

## Architecture (current)

```
custom_components/ha_chat/
├── __init__.py                    ← services (send/delete), WebSocket history, Store, frontend registration
├── config_flow.py                 ← one-click UI setup (no YAML)
├── const.py                       ← events, limits, storage keys, frontend URLs
├── manifest.json
├── services.yaml                  ← send_message / delete_message
├── strings.json + translations/   ← setup dialog (en, de)
├── frontend/ha-chat-card.js       ← Lovelace card (served + auto-registered)
└── brand/                         ← icon.png, icon@2x.png (HA 2026.3+ local brand)
```

- **Setup**: config flow → a config entry; everything is registered from there.
- **Real-time**: new messages fire `ha_chat_message` on the event bus.
- **Deletes**: `ha_chat_message_deleted` event; author/admin checked server-side.
- **History**: point-to-point WebSocket command `ha_chat/get_messages`.
- **Storage**: Home Assistant `Store` keeps the last 100 messages.
- **Card delivery**: served from `frontend/` and registered as a Lovelace resource + module URL once Home Assistant has fully started.

## Shipped

- ✅ Real-time multi-user chat on the dashboard
- ✅ Persistent history (100 messages)
- ✅ Delete own messages + admin-delete-any (server-enforced)
- ✅ Emoji picker, full UTF-8
- ✅ Avatars, date separators, multi-line input, smart auto-scroll
- ✅ XSS-safe rendering
- ✅ One-click setup via config flow (no YAML)
- ✅ Self-registering card (no manual Lovelace resource)
- ✅ Visual card editor — title + height; empty title = no header
- ✅ Bundled brand icon (HA 2026.3+)

## Planned (priority order)

### Unread badge + sound — v2.3
Optional new-message sound and an unread counter when the card is off-screen.

### Message reactions — v2.4
React to a message with an emoji (👍 ❤️ 😂); counts shown under the bubble.

### @mentions + notifications — v2.4
Type `@name` to mention a user; optionally push a Home Assistant mobile
notification to the mentioned person.

### Multiple rooms / channels — v2.5
More than one chat room (e.g. *Family*, *Tech*), selectable in the card editor.

### Image & attachment support — v2.5
Paste or attach an image; stored locally and shown inline.

### Edit messages — later
Edit your own sent messages (with an "edited" marker).

### Safe Markdown — later
Render a safe subset of Markdown (bold, italic, links) without reintroducing XSS.

### History search — later
Search the chat history by text, sender, or date.

## Out of scope (deliberately)

- Cloud sync, federation, or any external server
- Bridging to third-party chat networks (Slack, WhatsApp, …)
- Replacing Home Assistant's notification system — this complements it
