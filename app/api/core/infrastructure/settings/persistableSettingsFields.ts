import { Settings as SettingsType } from '#shared/types/settingsType.js';
import { toPersistableFilters } from './persistableFilters.js';
import { toPersistableLanguages } from './persistableLanguages.js';
import { toPersistableMenuItems } from './persistableMenuItems.js';

const toPersistableSettingsFields = (
  fields: SettingsType,
  generateId: () => string
): SettingsType => ({
  ...fields,
  ...(fields.links ? { links: toPersistableMenuItems(fields.links, generateId) } : {}),
  ...(fields.filters ? { filters: toPersistableFilters(fields.filters) } : {}),
  ...(fields.languages ? { languages: toPersistableLanguages(fields.languages) } : {}),
});

export { toPersistableSettingsFields };
