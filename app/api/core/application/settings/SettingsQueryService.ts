import { Settings } from '#shared/types/settingsType.js';
import { SettingsDataSource } from '../contracts/SettingsDataSource.js';
import { applySettingsDefaults } from './settingsDefaults.js';
import { getPublicSettingsPayload, pickAdminFields } from './publicSettings.js';

class SettingsQueryService {
  constructor(private settingsDS: SettingsDataSource) {}

  async getPublic(): Promise<ReturnType<typeof getPublicSettingsPayload>> {
    const stored = await this.settingsDS.find();
    if (!stored) {
      return getPublicSettingsPayload({});
    }
    return getPublicSettingsPayload(applySettingsDefaults(stored));
  }

  async getForAdmin(): Promise<Partial<Settings> & { themeCustomization: boolean }> {
    const stored = await this.settingsDS.find();
    if (!stored) {
      return getPublicSettingsPayload({});
    }
    const withDefaults = applySettingsDefaults(stored);
    return {
      ...pickAdminFields(withDefaults),
      ...getPublicSettingsPayload(withDefaults),
    };
  }
}

export { SettingsQueryService };
