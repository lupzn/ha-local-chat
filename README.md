# Home Assistant Local Chat 💬

<p align="center">
  <img src="icon.png" alt="HA Local Chat" width="96" height="96">
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

> ✅ **Stable release — v2.2.2.** Production-ready and installable via HACS. See the [latest release](https://github.com/lupzn/ha-local-chat/releases/latest) and the [changelog](./CHANGELOG.md).

> **Unofficial** community integration — not affiliated with or endorsed by Home Assistant or Nabu Casa.

---

## 🎯 Why this?

Home Assistant is the screen everyone in the household already looks at — yet
there's no built-in way to leave each other a quick message on the dashboard.
Notifications are one-way; chat-style alternatives need cloud accounts.

**HA Local Chat** adds a real chat card that runs **100 % inside your own
instance**. Messages live in Home Assistant's storage, sync in real time over
the event bus, and never touch an external server.

---

## ✨ Features

| Feature | What it does |
|---------|--------------|
| 💬 **Real-time chat** | Messages appear instantly on every open dashboard via the HA event bus |
| 💾 **Persistent history** | The last 100 messages survive a restart (stored locally in `.storage`) |
| 👤 **Identity & avatars** | Uses the logged-in HA user's name; coloured initials avatars |
| 🗑️ **Delete & moderate** | Delete your own messages; **admins** can delete any — enforced server-side |
| 😊 **Emoji picker** | Built-in emoji panel, full UTF-8 — great for wall tablets without an emoji keyboard |
| 🛠️ **Visual editor** | Set title and height in the UI; leave the title empty for a header-less card |
| 🧱 **Real chat feel** | Date separators (Today / Yesterday), multi-line input (Shift+Enter), smart auto-scroll |
| 🎨 **Themed** | Follows your Home Assistant light/dark theme automatically |
| 🔌 **One-click setup** | Add it from the UI — no YAML, no `www` copying, no manual Lovelace resource |

See [`ROADMAP.md`](./ROADMAP.md) for what's planned next.

---

## 🚀 Installation

### 1 · Install via HACS (recommended)
1. **HACS → Integrations → ⋮ (top right) → Custom repositories**
2. Add `https://github.com/lupzn/ha-local-chat`, category **Integration**
3. Install **Home Assistant Local Chat**, then **restart Home Assistant**

> Manual alternative: copy `custom_components/ha_chat` into `config/custom_components/`, then restart.

### 2 · Add the integration
**Settings → Devices & Services → + Add Integration** → search **“Home Assistant Local Chat”** → **Submit**.

That's the only setup step. No `configuration.yaml`, no `www` copying, no Lovelace resource — the chat card registers itself.

### 3 · Add the card to a dashboard
Edit a dashboard → **+ Add Card** → search **“Local Chat Card”**.

> First time the card isn't listed? **Hard-refresh** the browser (Ctrl/Cmd + Shift + R) — the frontend is cached — then reopen the picker.

You can also add it manually (*+ Add Card → Manual*):

```yaml
type: custom:ha-chat-card
# title: Familien-Chat   # optional — omit for no header
# height: 320            # optional — chat-area height in px
```

---

## ⚙️ Configuration

Open the card's **⋮ → Edit** to use the **visual editor** — or set the same
options in YAML:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | _(none)_ | Header text — **leave empty for no header** |
| `height` | number | `320` | Height of the chat area, in px |

### Services

| Service | Description |
|---------|-------------|
| `ha_chat.send_message` | Send a message (field `message`). Works from automations & scripts too. |
| `ha_chat.delete_message` | Delete a message by `message_id`. Succeeds only for the author or an admin. |

Example — post a note when someone gets home:

```yaml
automation:
  - alias: "Chat: arrival note"
    trigger:
      - platform: state
        entity_id: person.daniele
        to: "home"
    action:
      - service: ha_chat.send_message
        data:
          message: "🏠 {{ trigger.to_state.name }} is home."
```

### Deleting messages
Hover a message and click the 🗑 icon. You can always delete **your own**
messages; **administrators** can delete **anyone's**. The check is enforced in
the backend, so it can't be bypassed from the UI.

---

## 🔒 Privacy & security

- **100 % local** — messages stay in your instance, no external servers, no telemetry.
- **XSS-safe** — messages render as plain text, so no HTML/script injection is possible.
- **Server-side moderation** — delete permission (author / admin) is verified in the backend.

Full policy: [`PRIVACY.md`](./PRIVACY.md).

---

## 🏗️ Project structure

```
ha-local-chat/
├── custom_components/ha_chat/
│   ├── __init__.py                  ← backend: services, WebSocket history, storage, frontend registration
│   ├── config_flow.py               ← one-click UI setup (no YAML)
│   ├── const.py                     ← constants (events, limits, storage keys, URLs)
│   ├── manifest.json
│   ├── services.yaml                ← send_message / delete_message
│   ├── strings.json + translations/ ← setup dialog (en, de)
│   ├── frontend/ha-chat-card.js      ← Lovelace card (served + auto-registered)
│   └── brand/                       ← icon.png, icon@2x.png (HA 2026.3+ local brand)
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
- **Deleting** verifies author/admin server-side, then fires
  `ha_chat_message_deleted` so all cards drop the message.
- **History** is fetched point-to-point via the WebSocket command
  `ha_chat/get_messages` — no global broadcast, so other dashboards don't flicker.
- **The card** is served from the integration's `frontend/` folder and
  registered (as a Lovelace resource + module URL) once Home Assistant has
  finished starting — so it appears automatically, no manual resource needed.

---

## 🧰 Troubleshooting

**Card not in the picker, or “Custom element doesn't exist: ha-chat-card”:**

1. **Add the integration first.** Settings → Devices & Services → it must be
   listed. This is a config-flow integration — it only loads (and registers the
   card) once it has been added.
2. Make sure you're on the **latest version** in HACS and **restarted HA**.
3. **Hard-refresh** the browser (Ctrl/Cmd + Shift + R) — the frontend is cached.

Quick checks:
- Open `http://YOUR-HA:8123/ha_chat_frontend/ha-chat-card.js` — you should see
  JavaScript, not a 404.
- The browser console should log `HA-LOCAL-CHAT vX.Y.Z` when the card loads.

**Manual fallback (always works):** copy
`custom_components/ha_chat/frontend/ha-chat-card.js` to `/config/www/`, add a
dashboard resource (**Settings → Dashboards → ⋮ → Resources**) with URL
`/local/ha-chat-card.js`, type **JavaScript Module**, then hard-refresh.

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
