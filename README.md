# Home Assistant Local Chat 💬

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)

A simple, private, and fully local chat integration for Home Assistant. It allows users to communicate with each other directly via the Home Assistant Dashboard.

## Features

* 🏠 **100% Local:** No cloud services, no external servers. Your data stays in your network.
* ⚡ **Real-time:** Messages appear instantly on all open dashboards using Home Assistant's event bus.
* 💾 **Persistent History:** Saves the last 50 messages, so the chat history is restored after a reboot.
* 👤 **User Identity:** Automatically detects the logged-in Home Assistant user.
* 🎨 **Custom Card:** Includes a clean, CSS-styled chat bubble card for Lovelace.

## Installation

### Step 1: Install the Integration (Backend)

**Via HACS (Recommended):**
1. Open HACS > Integrations > 3 dots (top right) > **Custom repositories**.
2. Add the URL of this repository.
3. Select Category: **Integration**.
4. Click **Add** and then install "Home Assistant Local Chat".

**Manual Installation:**
1. Download this repository.
2. Copy the folder `custom_components/ha_chat` into your Home Assistant's `config/custom_components/` directory.

### Step 2: Configuration (Required!)

This integration does not use a UI config flow yet. You **must** add the following line to your `configuration.yaml` to enable it:

```yaml
ha_chat:
