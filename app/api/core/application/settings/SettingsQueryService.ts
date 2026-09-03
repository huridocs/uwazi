import { toReadableMenuItems } from '#api/core/infrastructure/settings/persistableMenuItems.js';
import { toPersistableFilters } from '#api/core/infrastructure/settings/persistableFilters.js';
import { toReadableLanguages } from '#api/core/infrastructure/settings/persistableLanguages.js';
import { Settings } from '#shared/types/settingsType.js';
import { SettingsDataSource } from '../contracts/SettingsDataSource.js';
import { applySettingsDefaults } from './settingsDefaults.js';
import { getPublicSettingsPayload, pickAdminFields } from './publicSettings.js';

const presentSettings = (stored: Settings): Settings => ({
  ...stored,
  ...(stored.links ? { links: toReadableMenuItems(stored.links) } : {}),
  ...(stored.filters ? { filters: toPersistableFilters(stored.filters) } : {}),
  ...(stored.languages ? { languages: toReadableLanguages(stored.languages) } : {}),
});

class SettingsQueryService {
  constructor(private settingsDS: SettingsDataSource) {}

  async getPublic(): Promise<ReturnType<typeof getPublicSettingsPayload>> {
    const stored = await this.settingsDS.find();
    if (!stored) {
      return getPublicSettingsPayload({});
    }
    return getPublicSettingsPayload(applySettingsDefaults(presentSettings(stored)));
  }

  async getForAdmin(): Promise<Partial<Settings> & { themeCustomization: boolean }> {
    const stored = await this.settingsDS.find();
    if (!stored) {
      return getPublicSettingsPayload({});
    }
    const withDefaults = applySettingsDefaults(presentSettings(stored));
    return {
      ...pickAdminFields(withDefaults),
      ...getPublicSettingsPayload(withDefaults),
    };
  }
}

export { SettingsQueryService };
