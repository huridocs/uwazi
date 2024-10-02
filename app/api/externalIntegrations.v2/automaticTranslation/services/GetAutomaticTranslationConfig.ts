import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { ATGateway } from '../contracts/ATGateway';
import { ATConfigDataSource } from '../contracts/ATConfigDataSource';

export class ATConfigService {
  private settings: SettingsDataSource;

  private config: ATConfigDataSource;

  private templates: TemplatesDataSource;

  private automaticTranslation: ATGateway;

  constructor(
    settings: SettingsDataSource,
    config: ATConfigDataSource,
    templates: TemplatesDataSource,
    automaticTranslation: ATGateway
  ) {
    this.settings = settings;
    this.config = config;
    this.templates = templates;
    this.automaticTranslation = automaticTranslation;
  }

  async get() {
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
