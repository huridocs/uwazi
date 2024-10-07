import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Db } from 'mongodb';
import { Settings as SettingsType } from 'shared/types/settingsType';
import { ATConfigDataSource } from '../contracts/ATConfigDataSource';
import { ATGateway } from '../contracts/ATGateway';
import { ATTemplateConfig } from '../model/ATConfig';
import { RawATConfig } from '../model/RawATConfig';

export class MongoATConfigDataSource
  extends MongoDataSource<SettingsType>
  implements ATConfigDataSource
{
  protected collectionName = 'settings';

  private settings: SettingsDataSource;

  private templates: TemplatesDataSource;

  private automaticTranslation: ATGateway;

  constructor(
    db: Db,
    transactionManager: MongoTransactionManager,
    settings: SettingsDataSource,
    templates: TemplatesDataSource,
    automaticTranslation: ATGateway
  ) {
    super(db, transactionManager);
    this.settings = settings;
    this.templates = templates;
    this.automaticTranslation = automaticTranslation;
  }

  async get() {
    const settings = await this.getCollection().findOne();
    const config = settings?.features?.automaticTranslation ?? { active: false };

    const validProperties = await this.templates.getAllTextProperties().all();
    const configuredLanguages = await this.settings.getLanguageKeys();
    const supportedLanguages = await this.automaticTranslation.supportedLanguages();

    const result = new RawATConfig(
      config.active,
      (config.templates || []).map(
        t => new ATTemplateConfig(t.template, t.properties || [], t.commonProperties)
      )
    );

    return result.getCompleteConfig(
      configuredLanguages.filter(languageKey => supportedLanguages.includes(languageKey)),
      validProperties
    );
  }

  async update(config: RawATConfig) {
    await this.getCollection().findOneAndUpdate(
      {},
      { $set: { 'features.automaticTranslation': config } }
    );
    return this.get();
  }
}
