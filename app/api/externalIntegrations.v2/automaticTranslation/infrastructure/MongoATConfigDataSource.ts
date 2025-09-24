// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoDat... Remove this comment to see the full error message
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoTra... Remove this comment to see the full error message
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/contracts/Setti... Remove this comment to see the full error message
import { SettingsDataSource } from '../settings.v2/contracts/SettingsDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/contracts/Temp... Remove this comment to see the full error message
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/CommonPr... Remove this comment to see the full error message
import { CommonProperty } from 'api/templates.v2/model/CommonProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Property } from 'api/templates.v2/model/Property.js';
import { Db } from 'mongodb';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/settingsTyp... Remove this comment to see the full error message
import { Settings as SettingsType } from 'shared/types/settingsType.js';
import { ATConfigDataSource } from '../contracts/ATConfigDataSource';
import { ATGateway } from '../contracts/ATGateway';
import { ATConfig, ATTemplateConfig } from '../model/ATConfig';

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
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const settings = await this.getCollection().findOne();
    const rawConfig = settings?.features?.automaticTranslation ?? { active: false };

    const validProperties = await this.templates.getAllTextProperties().all();
    const configuredLanguages = await this.settings.getLanguageKeys();
    const supportedLanguages = await this.automaticTranslation.supportedLanguages();

    const validPropertiesMap = validProperties.reduce(
      // @ts-expect-error TS(7006): Parameter 'memo' implicitly has an 'any' type.
      (memo, property) => {
        // eslint-disable-next-line no-param-reassign
        memo[property.id] = property;
        return memo;
      },
      {} as { [k: string]: Property }
    );

    const validPropertiesIds = Object.keys(validPropertiesMap);

    // @ts-expect-error TS(7006): Parameter 'templateConfig' implicitly has an 'any'... Remove this comment to see the full error message
    const templates = (rawConfig.templates || []).map(templateConfig => {
      const configPropertiesIds = (templateConfig.commonProperties || []).concat(
        templateConfig.properties || []
      );
      return new ATTemplateConfig(
        templateConfig.template,
        configPropertiesIds
          .filter(
            // @ts-expect-error TS(7006): Parameter 'propertyId' implicitly has an 'any' typ... Remove this comment to see the full error message
            propertyId =>
              validPropertiesIds.includes(propertyId) &&
              validPropertiesMap[propertyId].template === templateConfig.template
          )
          // @ts-expect-error TS(7006): Parameter 'propertyId' implicitly has an 'any' typ... Remove this comment to see the full error message
          .map(propertyId => validPropertiesMap[propertyId])
      );
    });

    return new ATConfig(
      rawConfig.active,
      // @ts-expect-error TS(7006): Parameter 'languageKey' implicitly has an 'any' ty... Remove this comment to see the full error message
      configuredLanguages.filter(languageKey => supportedLanguages.includes(languageKey)),
      templates
    );
  }

  async update(active: boolean, config: ATTemplateConfig[]) {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
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
