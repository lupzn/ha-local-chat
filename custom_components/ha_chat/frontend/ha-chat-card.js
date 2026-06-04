/**
 * Home Assistant Local Chat – Lovelace Card
 * https://github.com/lupzn/ha-local-chat
 *
 * Vanilla custom element, no build step. This file is UTF-8 encoded
 * (full emoji + umlaut support). Loaded automatically by the integration.
 */

const MAX_LEN = 2000;
const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🤔", "😴",
  "😭", "😡", "🥳", "🙄", "😬", "👍", "👎", "👏", "🙏", "💪",
  "🔥", "🎉", "❤️", "💔", "✨", "⭐", "✅", "❌", "⚠️", "💡",
  "🏠", "🔧", "📦", "🚗", "🍕", "☕", "🎁", "👀", "🤷", "🐝",
];

console.info(
  "%c HA-LOCAL-CHAT %c v2.2.1 ",
  "color:#fff;background:#03a9f4;font-weight:700;border-radius:3px 0 0 3px;padding:2px 6px;",
  "color:#03a9f4;background:#e1f5fe;border-radius:0 3px 3px 0;padding:2px 6px;"
);

class HaChatCard extends HTMLElement {
  constructor() {
    super();
    this.messages = [];
    this._initialized = false;
    this._emojiOpen = false;
    this.attachShadow({ mode: "open" });
  }

  // ---- Lovelace lifecycle ---------------------------------------------
  static getConfigElement() {
    return document.createElement("ha-chat-card-editor");
  }

  static getStubConfig() {
    return { title: "Haus Chat", height: 320 };
  }

  setConfig(config) {
    this._config = config || {};
    this._applyConfig();
  }

  _applyConfig() {
    // Apply title/height live (so the visual editor preview updates instantly).
    if (!this.content) return;
    this.content.header = this._config.title || "Haus Chat";
    const container = this.shadowRoot.getElementById("chat-container");
    if (container) {
      const h = this._config.height;
      container.style.height = typeof h === "number" ? `${h}px` : h || "320px";
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.currentUserId = hass.user ? hass.user.id : null;
    this.isAdmin = hass.user ? !!hass.user.is_admin : false;

    if (!this._initialized) {
      this._initialized = true;
      this.render();
      this._subscribe();
      this._loadHistory();
    }
  }

  disconnectedCallback() {
    if (this._unsubMsg) this._unsubMsg.then((u) => u && u()).catch(() => {});
    if (this._unsubDel) this._unsubDel.then((u) => u && u()).catch(() => {});
  }

  getCardSize() {
    return 6;
  }

  // ---- Data -----------------------------------------------------------
  async _loadHistory() {
    try {
      const res = await this._hass.connection.sendMessagePromise({
        type: "ha_chat/get_messages",
      });
      this.messages = (res && res.messages) || [];
      this._refresh(true);
    } catch (err) {
      console.error("ha-chat: Historie konnte nicht geladen werden", err);
    }
  }

  _subscribe() {
    this._unsubMsg = this._hass.connection.subscribeEvents((ev) => {
      if (!ev.data || !ev.data.message) return;
      this.messages.push(ev.data.message);
      while (this.messages.length > 200) this.messages.shift();
      this._refresh();
    }, "ha_chat_message");

    this._unsubDel = this._hass.connection.subscribeEvents((ev) => {
      if (!ev.data) return;
      this.messages = this.messages.filter((m) => m.id !== ev.data.id);
      this._refresh();
    }, "ha_chat_message_deleted");
  }

  _send() {
    const ta = this.shadowRoot.getElementById("msg-input");
    const text = (ta.value || "").trim();
    if (!text) return;
    this._hass.callService("ha_chat", "send_message", {
      message: text.slice(0, MAX_LEN),
    });
    ta.value = "";
    ta.style.height = "auto";
    this._updateCounter();
    this._closeEmoji();
    ta.focus();
  }

  _delete(id) {
    if (!confirm("Diese Nachricht löschen?")) return;
    this._hass
      .callService("ha_chat", "delete_message", { message_id: id })
      .catch((err) => console.error("ha-chat: Löschen fehlgeschlagen", err));
  }

  // ---- Rendering ------------------------------------------------------
  _refresh(forceScroll = false) {
    const box = this.shadowRoot.getElementById("chat-box");
    if (!box) return;

    const nearBottom =
      box.scrollHeight - box.scrollTop - box.clientHeight < 60;

    box.textContent = "";

    if (!this.messages.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Noch keine Nachrichten – schreib die erste! 👋";
      box.appendChild(empty);
      return;
    }

    let lastDay = null;
    for (const msg of this.messages) {
      const day = this._formatDay(msg.timestamp);
      if (day !== lastDay) {
        const sep = document.createElement("div");
        sep.className = "day-sep";
        const span = document.createElement("span");
        span.textContent = day;
        sep.appendChild(span);
        box.appendChild(sep);
        lastDay = day;
      }
      box.appendChild(this._messageNode(msg));
    }

    if (forceScroll || nearBottom) box.scrollTop = box.scrollHeight;
  }

  _messageNode(msg) {
    const isMe = msg.user_id && msg.user_id === this.currentUserId;
    const canDelete = isMe || this.isAdmin;

    const row = document.createElement("div");
    row.className = "msg " + (isMe ? "me" : "other");

    if (!isMe) {
      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.style.background = this._colorFor(msg.user || "?");
      avatar.textContent = this._initials(msg.user || "?");
      row.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const meta = document.createElement("div");
    meta.className = "meta";

    if (!isMe) {
      const name = document.createElement("strong");
      name.textContent = msg.user || "Unbekannt";
      meta.appendChild(name);
    }

    const time = document.createElement("small");
    time.textContent = this._formatTime(msg.timestamp);
    meta.appendChild(time);

    if (canDelete && msg.id) {
      const del = document.createElement("button");
      del.className = "del";
      del.type = "button";
      del.title = "Löschen";
      del.setAttribute("aria-label", "Nachricht löschen");
      del.textContent = "🗑";
      del.addEventListener("click", () => this._delete(msg.id));
      meta.appendChild(del);
    }

    const text = document.createElement("div");
    text.className = "text";
    // textContent → kein HTML-Inject möglich (XSS-sicher), \n bleibt via CSS erhalten.
    text.textContent = msg.message || "";

    bubble.appendChild(meta);
    bubble.appendChild(text);
    row.appendChild(bubble);
    return row;
  }

  // ---- Emoji ----------------------------------------------------------
  _toggleEmoji() {
    this._emojiOpen ? this._closeEmoji() : this._openEmoji();
  }
  _openEmoji() {
    const panel = this.shadowRoot.getElementById("emoji-panel");
    if (!panel) return;
    panel.style.display = "grid";
    this._emojiOpen = true;
  }
  _closeEmoji() {
    const panel = this.shadowRoot.getElementById("emoji-panel");
    if (!panel) return;
    panel.style.display = "none";
    this._emojiOpen = false;
  }
  _insertEmoji(emoji) {
    const ta = this.shadowRoot.getElementById("msg-input");
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    ta.value = ta.value.slice(0, start) + emoji + ta.value.slice(end);
    const pos = start + emoji.length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.focus();
    this._updateCounter();
  }

  _updateCounter() {
    const ta = this.shadowRoot.getElementById("msg-input");
    const counter = this.shadowRoot.getElementById("counter");
    if (!ta || !counter) return;
    const len = ta.value.length;
    if (len > MAX_LEN - 200) {
      counter.style.display = "block";
      counter.textContent = `${len} / ${MAX_LEN}`;
      counter.classList.toggle("over", len > MAX_LEN);
    } else {
      counter.style.display = "none";
    }
  }

  // ---- Helpers --------------------------------------------------------
  _initials(name) {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  _colorFor(name) {
    let hash = 0;
    const s = String(name);
    for (let i = 0; i < s.length; i++) {
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 65%, 45%)`;
  }
  _formatTime(ts) {
    return new Date(ts * 1000).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  _formatDay(ts) {
    const d = new Date(ts * 1000);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    const same = (a, b) =>
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();
    if (same(d, today)) return "Heute";
    if (same(d, yest)) return "Gestern";
    return d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // ---- Initial render -------------------------------------------------
  render() {
    const cfg = this._config || {};
    const card = document.createElement("ha-card");
    card.header = cfg.title || "Haus Chat";

    const height =
      typeof cfg.height === "number"
        ? `${cfg.height}px`
        : cfg.height || "320px";

    const style = document.createElement("style");
    style.textContent = `
      #chat-container { display:flex; flex-direction:column; height:${height}; padding:8px 12px 12px; }
      #chat-box { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:6px; padding-right:4px; }
      .empty { margin:auto; color:var(--secondary-text-color); font-size:.9rem; text-align:center; }
      .day-sep { text-align:center; margin:6px 0; }
      .day-sep span { background:var(--divider-color); color:var(--secondary-text-color);
        font-size:.7rem; padding:2px 10px; border-radius:10px; }
      .msg { display:flex; gap:8px; max-width:85%; }
      .msg.other { align-self:flex-start; }
      .msg.me { align-self:flex-end; flex-direction:row-reverse; }
      .avatar { flex:0 0 auto; width:32px; height:32px; border-radius:50%; color:#fff; font-size:.72rem;
        font-weight:700; display:flex; align-items:center; justify-content:center; user-select:none; }
      .bubble { padding:7px 11px; border-radius:14px; background:var(--secondary-background-color,#e5e5e5);
        color:var(--primary-text-color); }
      .me .bubble { background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff);
        border-bottom-right-radius:4px; }
      .other .bubble { border-bottom-left-radius:4px; }
      .meta { display:flex; align-items:center; gap:6px; font-size:.7rem; opacity:.85; margin-bottom:2px; }
      .meta strong { font-weight:600; }
      .meta .del { margin-left:auto; background:none; border:none; cursor:pointer; padding:0 2px;
        font-size:.8rem; line-height:1; opacity:0; transition:opacity .15s; color:inherit; }
      .msg:hover .meta .del { opacity:.7; }
      .meta .del:hover { opacity:1; }
      .text { white-space:pre-wrap; word-break:break-word; line-height:1.35; }
      .input-area { display:flex; gap:6px; align-items:flex-end; margin-top:8px; position:relative; }
      textarea { flex:1; resize:none; max-height:96px; min-height:38px; padding:9px 10px; font:inherit;
        border-radius:10px; border:1px solid var(--divider-color); background:var(--card-background-color);
        color:var(--primary-text-color); box-sizing:border-box; }
      .icon-btn { background:none; border:none; cursor:pointer; font-size:1.25rem; padding:6px; line-height:1; }
      .send-btn { background:var(--primary-color); color:#fff; border:none; border-radius:10px;
        padding:0 16px; height:38px; cursor:pointer; font-weight:600; }
      .send-btn:hover { opacity:.9; }
      #counter { display:none; position:absolute; right:74px; top:-18px; font-size:.7rem;
        color:var(--secondary-text-color); }
      #counter.over { color:var(--error-color,#db4437); font-weight:700; }
      #emoji-panel { display:none; position:absolute; bottom:46px; left:0; right:0;
        grid-template-columns:repeat(10,1fr); gap:2px; background:var(--card-background-color);
        border:1px solid var(--divider-color); border-radius:10px; padding:6px; max-height:140px;
        overflow-y:auto; box-shadow:0 4px 14px rgba(0,0,0,.2); z-index:5; }
      #emoji-panel button { background:none; border:none; cursor:pointer; font-size:1.25rem; padding:3px;
        border-radius:6px; }
      #emoji-panel button:hover { background:var(--secondary-background-color); }
    `;

    card.innerHTML = `
      <div id="chat-container">
        <div id="chat-box"></div>
        <div class="input-area">
          <div id="emoji-panel"></div>
          <button class="icon-btn" id="emoji-btn" type="button" title="Emoji" aria-label="Emoji einfügen">😊</button>
          <textarea id="msg-input" rows="1" maxlength="${MAX_LEN}"
            placeholder="Nachricht… (Enter = senden, Shift+Enter = neue Zeile)"></textarea>
          <div id="counter"></div>
          <button class="send-btn" id="send-btn" type="button">Senden</button>
        </div>
      </div>
    `;
    card.appendChild(style);

    // Emoji-Panel befüllen
    const panel = card.querySelector("#emoji-panel");
    EMOJIS.forEach((e) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = e;
      b.addEventListener("click", () => {
        this._insertEmoji(e);
        this._closeEmoji();
      });
      panel.appendChild(b);
    });

    card.querySelector("#send-btn").addEventListener("click", () => this._send());
    card
      .querySelector("#emoji-btn")
      .addEventListener("click", () => this._toggleEmoji());

    const ta = card.querySelector("#msg-input");
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this._send();
      }
    });
    ta.addEventListener("input", () => {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 96) + "px";
      this._updateCounter();
    });

    this.content = card;
    this.shadowRoot.appendChild(card);
  }
}

// Guard: verhindert Doppel-Registrierung, falls die alte v1-Resource
// (config/www) noch parallel geladen wird.
if (!customElements.get("ha-chat-card")) {
  customElements.define("ha-chat-card", HaChatCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "ha-chat-card")) {
  window.customCards.push({
    type: "ha-chat-card",
    name: "Local Chat Card",
    description: "Privater, lokaler Chat fürs Dashboard (ha-local-chat).",
    preview: false,
    documentationURL: "https://github.com/lupzn/ha-local-chat",
  });
}

// ---- Visual config editor (GUI options: title + height) ---------------
class HaChatCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (e) => this._valueChanged(e));
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.data = { height: 320, ...this._config };
    this._form.schema = [
      { name: "title", selector: { text: {} } },
      {
        name: "height",
        selector: {
          number: {
            min: 150,
            max: 1200,
            step: 10,
            mode: "box",
            unit_of_measurement: "px",
          },
        },
      },
    ];
    this._form.computeLabel = (s) =>
      ({ title: "Titel des Chats", height: "Höhe des Chatbereichs" }[s.name] ||
        s.name);
  }

  _valueChanged(ev) {
    const config = {
      type: (this._config && this._config.type) || "custom:ha-chat-card",
      ...ev.detail.value,
    };
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }
}
if (!customElements.get("ha-chat-card-editor")) {
  customElements.define("ha-chat-card-editor", HaChatCardEditor);
}
