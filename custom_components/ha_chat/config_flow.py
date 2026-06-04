"""Config flow for Home Assistant Local Chat (UI setup, no YAML needed)."""
import voluptuous as vol

from homeassistant.config_entries import ConfigFlow

from .const import DOMAIN


class HaChatConfigFlow(ConfigFlow, domain=DOMAIN):
    """Single-instance, zero-config setup via the UI."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle the user-initiated setup (one click, no options)."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        if user_input is not None:
            return self.async_create_entry(
                title="Home Assistant Local Chat", data={}
            )
        return self.async_show_form(step_id="user", data_schema=vol.Schema({}))

    async def async_step_import(self, import_data):
        """Import a legacy `ha_chat:` YAML config into a config entry."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        return self.async_create_entry(title="Home Assistant Local Chat", data={})
