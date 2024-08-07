import { SettingsDataSource } from '../contracts/SettingsDataSource';

export class GetAutomaticTranslationConfig {
  private settingsDS: SettingsDataSource;

  constructor(settingsDS: SettingsDataSource) {
    this.settingsDS = settingsDS;
  }

  async execute() {
    const config = await this.settingsDS.getAutomaticTranslationConfig();
    return {
      ...config,
      templates: (config.templates || []).map(t => {
        return {
          ...t,
          properties: (t.properties || []).filter(propertyId => {
            return ['text', 'markdown'].includes();
          }),
        };
      }),
    };
  }
}
