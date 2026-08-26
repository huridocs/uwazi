import { LanguageSchema } from '#shared/types/commonTypes.js';
import { Settings } from '#shared/types/settingsType.js';
import { SettingsDataSource } from '../contracts/SettingsDataSource.js';
import { applySettingsDefaults, omitHiddenSettingsFields } from './settingsDefaults.js';
import { getPublicSettingsPayload } from './publicSettings.js';

class SettingsQueryService {
  constructor(private settingsDS: SettingsDataSource) {}

  /**
   * V1 `settings.get()`: defaults applied, mongoose select:false fields omitted.
   */
  async get(): Promise<Settings> {
    const stored = await this.settingsDS.find();
    if (!stored) {
      return {};
    }
    return omitHiddenSettingsFields(applySettingsDefaults(stored));
  }

  async getDefaultLanguage(): Promise<LanguageSchema> {
    const current = await this.get();
    const defaultLanguage = current.languages?.find(language => language.default);
    if (!defaultLanguage) {
      throw new Error('There is no default language !');
    }
    return defaultLanguage;
  }

  async getForHttp(isAdmin: boolean): Promise<Settings | Partial<Settings>> {
    const stored = await this.settingsDS.find();
    if (!stored) {
      return getPublicSettingsPayload({});
    }

    const withDefaults = applySettingsDefaults(stored);
    const withoutAlwaysHidden = omitHiddenSettingsFields(withDefaults);

    if (!isAdmin) {
      return getPublicSettingsPayload(withoutAlwaysHidden);
    }

    return {
      ...withoutAlwaysHidden,
      publicFormDestination: stored.publicFormDestination,
      ...getPublicSettingsPayload(withoutAlwaysHidden),
    };
  }
}

export { SettingsQueryService };
