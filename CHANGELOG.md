# Changelog

All notable changes to **Home Assistant Local Chat** are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [2.1.1] — 2026-06-04

### Fixed
- 🖼️ **Integration icon** is now bundled in `custom_components/ha_chat/brand/` (`icon.png`, `icon@2x.png`). Home Assistant 2026.3+ serves it via the built-in local brands proxy, so the icon shows in Home Assistant and HACS **without** a `home-assistant/brands` PR.

## [2.1.0] — 2026-06-04

### Added
- 🧩 **Config flow** — set up from **Settings → Devices & Services → Add Integration**, no `configuration.yaml` needed. An existing `ha_chat:` YAML block is imported automatically.
- English + German translations for the setup dialog.

### Changed
- Backend split into `async_setup` (registers the card + WebSocket once) and `async_setup_entry` (storage + services per entry), with a clean `async_unload_entry`.

## [2.0.1] — 2026-06-04

### Fixed
- 🖼️ **Icon** — replaced the non-square JPEG (mislabeled `.png`) with proper transparent PNGs (`icon.png` 256², `icon@2x.png` 512²) for HACS, the integration page, and the README.

### Docs
- Added a **Troubleshooting** section (card picker / "custom element doesn't exist") and a manual-resource fallback.
- Backend logs an INFO line once the card is served, to aid setup diagnostics.

## [2.0.0] — 2026-06-04

A full rewrite into a real chat. **Breaking:** the Lovelace card now registers
itself — remove the old manual `www` copy and `/local/ha-chat-card.js` resource
after upgrading (see the README).

### Added
- 🗑️ **Delete messages** — authors can delete their own; admins can delete any. Enforced server-side via the new `ha_chat.delete_message` service.
- 😊 **Emoji picker** in the card, with full UTF-8 support.
- 👤 **Avatars** with initials and a per-name colour.
- 🧱 **Date separators** (Today / Yesterday / date), **multi-line input** (Shift+Enter), and smart **auto-scroll**.
- 🔌 **Automatic card registration** via `add_extra_js_url` — no manual Lovelace resource needed.
- ⚙️ Card options `title` and `height`.
- 📝 `ROADMAP.md`, `PRIVACY.md`, `CHANGELOG.md`, and `NOTICE`.

### Fixed
- 🔴 **Stored XSS** — messages are now rendered as text instead of via `innerHTML`.
- **Encoding** — the card file is now UTF-8; umlauts and emoji no longer break.
- **History flicker** — history is fetched point-to-point via a WebSocket command instead of a global event broadcast.

### Changed
- Persistent history raised from 50 to 100 messages.
- Messages now carry a stable unique `id` (existing history is migrated on load).
- Added a backend message length limit (2000 chars) and whitespace handling.
- Relicensed to **Apache-2.0** (was MIT) to match the LUPZN repo family.
- Moved the card file inside `custom_components/ha_chat/` so HACS ships it with the integration.

## [1.0.0] — 2026-01-06

Initial release: local chat service, event-bus real-time updates, persistent
history (50 messages), and a CSS-styled Lovelace bubble card.
