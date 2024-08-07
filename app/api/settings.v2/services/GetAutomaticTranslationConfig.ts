import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { SettingsDataSource } from '../contracts/SettingsDataSource';

export class GetAutomaticTranslationConfig {
  private settingsDS: SettingsDataSource;

  private templatesDS: TemplatesDataSource;

  constructor(settingsDS: SettingsDataSource, templatesDS: TemplatesDataSource) {
    this.settingsDS = settingsDS;
    this.templatesDS = templatesDS;
  }

  async execute() {
    const config = await this.settingsDS.getAutomaticTranslationConfig();

    const validProperties = (await this.templatesDS.getAllTextProperties().all()).map(p => p.id);

    return {
      ...config,
      templates: await Promise.all(
        (config.templates || []).map(async templateConfig => ({
          ...templateConfig,
          properties: (templateConfig.properties || []).filter(propertyId =>
            validProperties.includes(propertyId)
          ),
        }))
      ),
    };
  }
}
