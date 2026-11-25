import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { CommonProperty } from '#api/core/domain/template/CommonProperty.js';
import { Property } from '#api/core/domain/template/Property.js';
import { Settings } from '#api/core/domain/settings/Settings.js';
import { ATConfigDataSource } from '../contracts/ATConfigDataSource.js';
import { ATGateway } from '../contracts/ATGateway.js';
import { ATConfig, ATTemplateConfig } from '../model/ATConfig.js';

export class SettingsATConfigDataSource implements ATConfigDataSource {
  private settings: SettingsDataSource;

  private templates: TemplatesDataSource;

  private automaticTranslation: ATGateway;

  constructor(
    settings: SettingsDataSource,
    templates: TemplatesDataSource,
    automaticTranslation: ATGateway
  ) {
    this.settings = settings;
    this.templates = templates;
    this.automaticTranslation = automaticTranslation;
  }

  async get() {
    const rawConfig = (await this.settings.readFeature('automaticTranslation')) ?? {
      active: false,
    };

    const validProperties = await this.templates.getAllTextProperties();
    const configuredLanguages = await this.settings.getLanguageKeys();
    const supportedLanguages = await this.automaticTranslation.supportedLanguages();

    const validPropertiesMap = validProperties.reduce(
      (memo, property) => {
        // eslint-disable-next-line no-param-reassign
        memo[property.id] = property;
        return memo;
      },
      {} as { [k: string]: Property }
    );

    const validPropertiesIds = Object.keys(validPropertiesMap);

    const templates = (rawConfig.templates || []).map(templateConfig => {
      const configPropertiesIds = (templateConfig.commonProperties || []).concat(
        templateConfig.properties || []
      );
      return new ATTemplateConfig(
        templateConfig.template,
        configPropertiesIds
          .filter(propertyId => {
            return (
              validPropertiesIds.includes(propertyId) &&
              validPropertiesMap[propertyId].template === templateConfig.template
            );
          })
          .map(propertyId => validPropertiesMap[propertyId])
      );
    });

    return new ATConfig(
      rawConfig.active,
      configuredLanguages.filter(languageKey => supportedLanguages.includes(languageKey)),
      templates
    );
  }

  async update(active: boolean, config: ATTemplateConfig[]) {
    const current = await this.settings.find();
    if (!current) return this.get();

    const automaticTranslation = {
      active,
      templates: config.map(templateConfig => ({
        template: templateConfig.template,
        properties: templateConfig.properties
          .filter(property => !(property instanceof CommonProperty))
          .map(property => property.id),
        commonProperties: templateConfig.properties
          .filter(property => property instanceof CommonProperty)
          .map(property => property.id),
      })),
    };

    await this.settings.update(
      new Settings({ features: { ...(current.features ?? {}), automaticTranslation } })
    );

    return this.get();
  }
}
