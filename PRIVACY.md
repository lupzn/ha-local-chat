# Privacy Policy — Home Assistant Local Chat

_Last updated: 2026-06-04_

## Summary (TL;DR)

HA Local Chat does **not** collect, transmit, sell or share any data with the
author or any third party. Everything runs **locally inside your own Home
Assistant instance**. No analytics, no tracking, no remote servers.

## What the integration does

HA Local Chat is a local, multi-user chat for the Home Assistant dashboard:

1. **Sending** — the `ha_chat.send_message` service stores a message and fires
   a `ha_chat_message` event on Home Assistant's internal event bus so open
   dashboards update in real time.
2. **History** — the last 100 messages are persisted in Home Assistant's
   `.storage` (`ha_chat_history`) so the chat survives a restart.
3. **Deleting** — the `ha_chat.delete_message` service removes a message after
   verifying the caller is the author or a Home Assistant admin.
4. **The card** — a Lovelace card renders the chat and is served as a static
   file from within the integration.

The integration can only access data inside your own Home Assistant instance.

## Data stored locally

Stored in Home Assistant's `.storage/ha_chat_history` on your own server:

- `id` — a random per-message identifier
- `timestamp` — when the message was sent
- `user` / `user_id` — the display name and Home Assistant user ID of the sender
- `message` — the message text

Only the most recent 100 messages are kept; older ones are discarded
automatically.

## Data the integration does NOT collect or transmit

- No data is sent to the author or any third party
- No analytics, telemetry, tracking or remote logging
- No external network requests of any kind
- No account creation or external authentication

## Network

HA Local Chat makes **no external network requests**. All communication is
internal to Home Assistant (event bus + WebSocket API) between your own browser
and your own server.

## Permissions

The integration requires no special secrets or tokens. Message deletion relies
on Home Assistant's built-in user/admin model — only the author of a message or
an administrator can delete it.

## Contact

Questions or concerns? Open an issue on the source repository:

https://github.com/lupzn/ha-local-chat/issues

## Changes to this policy

If the policy ever changes, the new version will be published here.
