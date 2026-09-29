import { z } from 'zod';

/**
 * What `uwazi settings …` prints: the whole settings document, `sync` and fields the settings
 * schema does not know included. Owned by the CLI, not shared with the HTTP API. Both commands
 * print it, so `get` → edit → `update` round-trips.
 */
const SettingsOutputSchema = z.record(z.unknown());

type SettingsOutput = z.infer<typeof SettingsOutputSchema>;

export { SettingsOutputSchema };
export type { SettingsOutput };
