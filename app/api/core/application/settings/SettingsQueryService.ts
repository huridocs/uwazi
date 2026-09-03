import { toReadableMenuItems } from '#api/core/infrastructure/settings/persistableMenuItems.js';
import { toPersistableFilters } from '#api/core/infrastructure/settings/persistableFilters.js';
import { toReadableLanguages } from '#api/core/infrastructure/settings/persistableLanguages.js';
import { User } from '#api/users.v2/model/User.js';
import { Settings } from '#shared/types/settingsType.js';
import { SettingsDataSource } from '../contracts/SettingsDataSource.js';
import { applySettingsDefaults } from './settingsDefaults.js';
import { getPublicSettingsPayload, pickAdminFields } from './publicSettings.js';

type Options = {
  actor?: User;
};

const presentSettings = (stored: Settings): Settings => ({
  ...stored,
  ...(stored.links ? { links: toReadableMenuItems(stored.links) } : {}),
  ...(stored.filters ? { filters: toPersistableFilters(stored.filters) } : {}),
  ...(stored.languages ? { languages: toReadableLanguages(stored.languages) } : {}),
});

class SettingsQueryService {
  constructor(
    private settingsDS: SettingsDataSource,
    private options: Options = {}
  ) {}

  async get() {
    return this.options.actor?.role === 'admin' ? this.adminProjection() : this.publicProjection();
  }

  async forBroadcast() {
    return this.publicProjection();
  }

  private async loadPresented() {
    const stored = await this.settingsDS.find();
    if (!stored) {
      return undefined;
    }
    return applySettingsDefaults(presentSettings(stored));
  }

  private async publicProjection() {
    const presented = await this.loadPresented();
    return getPublicSettingsPayload(presented ?? {});
  }

  private async adminProjection() {
    const presented = await this.loadPresented();
    if (!presented) {
      return getPublicSettingsPayload({});
    }
    return {
      ...pickAdminFields(presented),
      ...getPublicSettingsPayload(presented),
    };
  }
}

export { SettingsQueryService };
