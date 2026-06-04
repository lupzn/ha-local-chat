# Home Assistant Local Chat 💬

<p align="center">
  <img src="icon.png" alt="HA Local Chat Logo" width="96" height="96">
</p>

<p align="center">
  <b>A private, fully-local chat for your Home Assistant dashboard.</b><br>
  Real-time messages, delete &amp; admin moderation, emoji picker — no cloud, no servers.
</p>

<p align="center">
  <a href="https://github.com/hacs/integration"><img src="https://img.shields.io/badge/HACS-Custom-orange.svg" alt="HACS Custom"></a>
  <a href="https://www.home-assistant.io/"><img src="https://img.shields.io/badge/Home%20Assistant-2024.7%2B-41BDF5?logo=homeassistant&logoColor=white" alt="Home Assistant"></a>
  <a href="https://github.com/lupzn/ha-local-chat/releases/latest"><img src="https://img.shields.io/github/v/release/lupzn/ha-local-chat?color=2563eb" alt="Latest Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="Apache 2.0 License"></a>
  <a href="https://www.paypal.com/donate/?hosted_button_id=X8MG6CZK2PETS"><img src="https://img.shields.io/badge/PayPal-Donate-ffc439?logo=paypal&logoColor=white" alt="Donate via PayPal"></a>
</p>

> **Unofficial** community integration — not affiliated with or endorsed by Home Assistant or Nabu Casa.

---

## 🎯 Why this?

Home Assistant is the hub everyone in the household already looks at — yet there
is no built-in way to leave each other a quick message on the dashboard.
Notifications are one-way; chat-style alternatives need cloud accounts.

**HA Local Chat** adds a real chat card that runs **100 % inside your own
instance**. Messages live in Home Assistant's storage, sync in real time over
the event bus, and never touch an external server.

---

## ✨ Features (v2.0)

| Feature | What it does |
|---------|--------------|
| 💬 **Real-time chat** | Messages appear instantly on every open dashboard via the HA event bus |
| 💾 **Persistent history** | Last 100 messages survive a restart (stored in `.storage`) |
| 👤 **User identity** | Uses the logged-in HA user's name automatically; avatars with initials |
| 🗑️ **Delete & moderate** | Delete your own messages; **admins** can delete any message — enforced server-side |
| 😊 **Emoji picker** | Built-in emoji panel, full UTF-8 — perfect for wall tablets without an emoji keyboard |
| 🧱 **Real chat feel** | Date separators (Today / Yesterday), multi-line input (Shift+Enter), auto-scroll |
| 🎨 **Themed** | Follows your Home Assistant light/dark theme automatically |
| 🔌 **Zero-setup card** | The Lovelace card registers itself — no `www` copying, no resource entry |

See [`ROADMAP.md`](./ROADMAP.md) for what's planned next.

---

## 🚀 Installation

### 1. Install via HACS (recommended)
1. HACS → Integrations → ⋮ (top right) → **Custom repositories**
2. Add `https://github.com/lupzn/ha-local-chat`, category **Integration**
3. Install **Home Assistant Local Chat**, then **restart Home Assistant**

*(Manual alternative: copy `custom_components/ha_chat` into `config/custom_components/`, then restart.)*

### 2. Add the integration — no YAML
Go to **Settings → Devices & Services → + Add Integration**, search **“Home Assistant Local Chat”** and click **Submit**. No `configuration.yaml`, no `www` copying, no Lovelace resource — the chat card registers itself.

### 3. Add the card
Edit a dashboard → **+ Add Card** → search **“Local Chat Card”** (if it isn't listed yet, hard-refresh the browser with Ctrl/Cmd + Shift + R), or pick *Manual* and paste:

```yaml
type: custom:ha-chat-card
title: Familien-Chat  # optional — omit for no header
height: 320           # optional — chat area height in px
```

> **Upgrading from v1?** The card now loads itself. Remove the old manual setup
> to avoid duplicates: delete `ha-chat-card.js` from `config/www/` and remove
> the `/local/ha-chat-card.js` entry under **Settings → Dashboards → Resources**,
> then restart.

---

## ⚙️ Configuration & services

**Card options** — set them in the **visual editor** (⋮ → Edit card, no YAML needed) or in YAML:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | _(none)_ | Card header — leave empty for no header |
| `height` | number / string | `320` | Height of the chat area, in px |

**Services**

| Service | Description |
|---------|-------------|
| `ha_chat.send_message` | Send a message (field `message`). Works from automations & scripts too. |
| `ha_chat.delete_message` | Delete a message by `message_id`. Succeeds only for the author or an admin. |

Example — post a note when someone gets home:

```yaml
automation:
  - alias: "Chat: Ankunft melden"
    trigger:
      - platform: state
        entity_id: person.daniele
        to: "home"
    action:
      - service: ha_chat.send_message
        data:
          message: "🏠 {{ trigger.to_state.name }} ist zu Hause."
```

---

## 🔒 Privacy & security

- **100 % local** — messages stay in your HA instance, no external servers, no telemetry.
- **XSS-safe** — messages render as plain text, so no HTML/script injection.
- **Server-side moderation** — delete permission (author / admin) is checked in the backend, not just hidden in the UI.

Full policy: [`PRIVACY.md`](./PRIVACY.md).

---

## 🏗️ Project structure

```
ha-local-chat/
├── custom_components/ha_chat/
│   ├── __init__.py        ← backend: services, WebSocket history, storage, auto-register
│   ├── config_flow.py     ← UI setup (no YAML)
│   ├── const.py           ← constants (events, limits, storage keys)
│   ├── manifest.json
│   ├── services.yaml      ← send_message / delete_message
│   ├── frontend/          ← ha-chat-card.js (served + auto-registered)
│   ├── strings.json · translations/   ← setup dialog (en, de)
│   └── brand/             ← icon.png · icon@2x.png (HA 2026.3+ local brand)
├── hacs.json · icon.png
├── README.md · ROADMAP.md · PRIVACY.md · CHANGELOG.md
└── LICENSE · NOTICE
```

---

## 🧩 How it works

- **Backend** (`__init__.py`) registers two services and stores the last 100
  messages in Home Assistant's `Store` (`.storage/ha_chat_history`).
- **Sending** fires a `ha_chat_message` event on the event bus; every open card
  appends it instantly.
- **Deleting** checks author/admin server-side, then fires
  `ha_chat_message_deleted` so all cards drop the message.
- **History** is fetched point-to-point via the WebSocket command
  `ha_chat/get_messages` — no global broadcast, so other dashboards don't flicker.
- **The card** is served as a static file and injected with `add_extra_js_url`,
  so users never touch Lovelace resources.

---

## 🧰 Troubleshooting

**The “Local Chat Card” doesn't appear in the card picker (or “Custom element doesn't exist: ha-chat-card”):**

1. Make sure you actually updated to **v2.0.0+** in HACS and **restarted Home Assistant**. (v1 did not register a card.)
2. Confirm the integration loaded: **Developer Tools → Actions**, search `ha_chat` — you should see `ha_chat.send_message`. If it's missing, ensure `ha_chat:` is in your `configuration.yaml`, restart, and check **Settings → System → Logs** for `ha_chat`.
3. **Hard-refresh** the browser (Ctrl/Cmd + Shift + R) to drop the cached frontend, then reopen the card picker.

**Manual fallback (always works):** copy `custom_components/ha_chat/ha-chat-card.js` to `/config/www/`, then add a dashboard resource under **Settings → Dashboards → Resources** — URL `/local/ha-chat-card.js`, type **JavaScript Module** — and hard-refresh.

---

## ❤️ Support

If this saves your household some sticky notes, consider supporting development:

- ⭐ **Star this repo** on GitHub
- ♥ **[Donate via PayPal](https://www.paypal.com/donate/?hosted_button_id=X8MG6CZK2PETS)**
- 🐛 **Report bugs** in the [Issues](https://github.com/lupzn/ha-local-chat/issues)
- 💡 **Suggest features** — same place

---

## 📜 License

Apache License 2.0 © LUPZN — see [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

## ⚠️ Disclaimer

HA Local Chat is a third-party custom integration, not affiliated with, endorsed
by, or sponsored by Home Assistant or Nabu Casa, Inc. "Home Assistant" is a
trademark of Nabu Casa, Inc., used here only to identify the platform this
integration runs on.
