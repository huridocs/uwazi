import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Property } from 'api/templates.v2/model/Property';
import { SettingsDataSource } from '../contracts/SettingsDataSource';
import { AutomaticTranslationGateway } from 'api/services.v2/automaticTranslation/contracts/AutomaticTranslationGateway';

export class GetAutomaticTranslationConfig {
  private settings: SettingsDataSource;

  private templates: TemplatesDataSource;

  private automaticTranslation: AutomaticTranslationGateway;

  constructor(
    settings: SettingsDataSource,
    templates: TemplatesDataSource,
    automaticTranslation: AutomaticTranslationGateway
  ) {
    this.settings = settings;
    this.templates = templates;
    this.automaticTranslation = automaticTranslation;
  }

  async execute() {
    const config = await this.settings.getAutomaticTranslationConfig();

    const validProperties = (await this.templates.getAllTextProperties().all()).reduce(
      (memo, property) => {
        // eslint-disable-next-line no-param-reassign
        memo[property.id] = property;
        return memo;
      },
      {} as { [k: string]: Property }
    );

    const validPropertiesIds = Object.keys(validProperties);
    const configuredLanguages = await this.settings.getLanguageKeys();
    const supportedLanguages = await this.automaticTranslation.supportedLanguages();

    return {
      ...config,
      languages: configuredLanguages.filter(languageKey =>
        supportedLanguages.includes(languageKey)
      ),
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
