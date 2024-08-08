import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { SettingsDataSource } from '../contracts/SettingsDataSource';
import { Property } from 'api/templates.v2/model/Property';

export class GetAutomaticTranslationConfig {
  private settingsDS: SettingsDataSource;

  private templatesDS: TemplatesDataSource;

  constructor(settingsDS: SettingsDataSource, templatesDS: TemplatesDataSource) {
    this.settingsDS = settingsDS;
    this.templatesDS = templatesDS;
  }

  async execute() {
    const config = await this.settingsDS.getAutomaticTranslationConfig();

    const validProperties = (await this.templatesDS.getAllTextProperties().all()).reduce(
      (memo, property) => {
        // eslint-disable-next-line no-param-reassign
        memo[property.id] = property;
        return memo;
      },
      {} as { [k: string]: Property }
    );

    const validPropertiesIds = Object.keys(validProperties);

    return {
      ...config,
      templates: (config.templates || [])
        .map(templateConfig => ({
          ...templateConfig,
          properties: (templateConfig.properties || []).filter(
            propertyId =>
              validPropertiesIds.includes(propertyId) &&
              validProperties[propertyId].template === templateConfig.template
          ),
        }))
        .filter(c => c.properties.length),
    };
  }
}
