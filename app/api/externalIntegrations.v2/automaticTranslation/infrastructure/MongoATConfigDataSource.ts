


import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';


import { Property } from '#api/core/domain/template/Property.js';
import { Db } from 'mongodb';

import { Settings as SettingsType } from '#shared/types/settingsType.js';
import { ATConfigDataSource } from '#api/externalIntegrations.v2/automaticTranslation/contracts/ATConfigDataSource.js';
import { ATGateway } from '#api/externalIntegrations.v2/automaticTranslation/contracts/ATGateway.js';
import { ATConfig, ATTemplateConfig } from '#api/externalIntegrations.v2/automaticTranslation/model/ATConfig.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { CommonProperty } from '#api/core/domain/template/CommonProperty.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';

export class MongoATConfigDataSource
  extends MongoDataSource<SettingsType>
  implements ATConfigDataSource {
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
    const rawConfig = settings?.features?.automaticTranslation ?? { active: false };

    const validProperties = await this.templates.getAllTextProperties().all();
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
    await this.getCollection().findOneAndUpdate(
      {},
      {
        $set: {
          'features.automaticTranslation.active': active,
          'features.automaticTranslation.templates': config.map(templateConfig => ({
            template: templateConfig.template,
            properties: templateConfig.properties
              .filter(prop => !(prop instanceof CommonProperty))
              .map(prop => prop.id),
            commonProperties: templateConfig.properties
              .filter(prop => prop instanceof CommonProperty)
              .map(prop => prop.id),
          })),
        },
      }
    );
    return this.get();
  }
}
