import type { Settings, SettingsLinkSchema } from '#shared/types/settingsType.js';

/** GET /api/settings: the public projection, plus admin-only fields for admins. */
type SettingsResponse = Settings;

/** GET /api/settings/links: absent when the instance has no menu links. */
type SettingsLinksResponse = SettingsLinkSchema[] | undefined;

export type { SettingsResponse, SettingsLinksResponse };
