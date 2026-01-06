console.info("%c CHAT CARD LOADED ", "color: white; background: green; font-weight: bold;");

class HaChatCard extends HTMLElement {
    constructor() {
        super();
        this.messages = [];
        this.attachShadow({ mode: 'open' });
    }

    set hass(hass) {
        this._hass = hass;
        
        // Initialer Render (nur einmal)
        if (!this.content) {
            this.render();
            this.subscribeToEvents();
            // Historie beim Laden anfordern
            this._hass.callService('ha_chat', 'get_history', {});
        }
        
        // User ID für "eigene Nachrichten" Styling speichern
        this.currentUserId = hass.user ? hass.user.id : null;
    }

    subscribeToEvents() {
        // Wir lauschen auf den Event Bus von Home Assistant
        this._hass.connection.subscribeEvents((event) => {
            // Neue einzelne Nachricht
            this.addMessage(event.data.message);
        }, 'ha_chat_message');

        this._hass.connection.subscribeEvents((event) => {
            // Historie laden
            this.messages = event.data.messages;
            this.refreshChat();
        }, 'ha_chat_message_history');
    }

    addMessage(msg) {
        this.messages.push(msg);
        if (this.messages.length > 50) this.messages.shift();
        this.refreshChat();
    }

    refreshChat() {
        const chatBox = this.shadowRoot.getElementById('chat-box');
        if (!chatBox) return;

        chatBox.innerHTML = ''; // Clear

        this.messages.forEach(msg => {
            const isMe = msg.user_id === this.currentUserId;
            const div = document.createElement('div');
            div.className = `msg ${isMe ? 'me' : 'other'}`;
            
            const time = new Date(msg.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            div.innerHTML = `
                <div class="bubble">
                    <div class="meta"><strong>${msg.user}</strong> <small>${time}</small></div>
                    <div class="text">${msg.message}</div>
                </div>
            `;
            chatBox.appendChild(div);
        });

        // Auto-Scroll nach unten
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    sendMessage() {
        const input = this.shadowRoot.getElementById('msg-input');
        const text = input.value;
        if (!text) return;

        this._hass.callService('ha_chat', 'send_message', {
            message: text
        });
        
        input.value = '';
    }

    render() {
        const card = document.createElement('ha-card');
        card.header = 'Haus Chat';
        
        const style = document.createElement('style');
        style.textContent = `
            #chat-container {
                display: flex;
                flex-direction: column;
                height: 300px;
                padding: 10px;
            }
            #chat-box {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .msg {
                display: flex;
                flex-direction: column;
                max-width: 80%;
            }
            .msg.me {
                align-self: flex-end;
                align-items: flex-end;
            }
            .msg.other {
                align-self: flex-start;
                align-items: flex-start;
            }
            .bubble {
                padding: 8px 12px;
                border-radius: 12px;
                background: var(--secondary-background-color, #e5e5e5);
                color: var(--primary-text-color);
            }
            .me .bubble {
                background: var(--primary-color, #03a9f4);
                color: var(--text-primary-color, white);
            }
            .meta {
                font-size: 0.75rem;
                margin-bottom: 2px;
                opacity: 0.8;
            }
            .input-area {
                display: flex;
                gap: 5px;
            }
            input {
                flex: 1;
                padding: 8px;
                border-radius: 4px;
                border: 1px solid var(--divider-color);
                background: var(--card-background-color);
                color: var(--primary-text-color);
            }
            button {
                background: var(--primary-color);
                color: white;
                border: none;
                padding: 0 15px;
                border-radius: 4px;
                cursor: pointer;
            }
        `;

        card.innerHTML = `
            <div id="chat-container">
                <div id="chat-box"></div>
                <div class="input-area">
                    <input type="text" id="msg-input" placeholder="Nachricht..." />
                    <button id="send-btn">Send</button>
                </div>
            </div>
        `;
        
        card.appendChild(style);
        
        // Event Listener für Button und Enter-Taste
        const btn = card.querySelector('#send-btn');
        btn.addEventListener('click', () => this.sendMessage());
        
        const input = card.querySelector('#msg-input');
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        this.content = card;
        this.shadowRoot.appendChild(card);
    }

    setConfig(config) {
        // Konfiguration optional
    }

    getCardSize() {
        return 4;
    }
}

customElements.define('ha-chat-card', HaChatCard);