import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { AutomaticTranslationGateway } from '../contracts/AutomaticTranslationGateway';
import { AutomaticTranslationConfigDataSource } from '../contracts/AutomaticTranslationConfigDataSource';

export class GetAutomaticTranslationConfig {
  private settings: SettingsDataSource;

  private config: AutomaticTranslationConfigDataSource;

  private templates: TemplatesDataSource;

  private automaticTranslation: AutomaticTranslationGateway;

  constructor(
    settings: SettingsDataSource,
    config: AutomaticTranslationConfigDataSource,
    templates: TemplatesDataSource,
    automaticTranslation: AutomaticTranslationGateway
  ) {
    this.settings = settings;
    this.config = config;
    this.templates = templates;
    this.automaticTranslation = automaticTranslation;
  }

  async execute() {
    const config = await this.config.get();

    const validProperties = await this.templates.getAllTextProperties().all();
    const configuredLanguages = await this.settings.getLanguageKeys();
    const supportedLanguages = await this.automaticTranslation.supportedLanguages();

    return config.getCompleteConfig(
      configuredLanguages.filter(languageKey => supportedLanguages.includes(languageKey)),
      validProperties
    );
  }
}
