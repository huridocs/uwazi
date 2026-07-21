import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TranslationResult } from './types/TranslationResult.js';
import { Validator } from './infrastructure/Validator.js';

export class SaveEntityTranslations {
  static AITranslatedText = '(AI translated)';

  private logger: Logger;

  private entitiesDS: EntitiesDataSource;

  private templatesDS: TemplatesDataSource;

  private transactionManager: TransactionManager;

  private validator: Validator<TranslationResult>;

  // eslint-disable-next-line max-params
  constructor(
    templatesDS: TemplatesDataSource,
    entitiesDS: EntitiesDataSource,
    transactionManager: TransactionManager,
    validator: Validator<TranslationResult>,
    logger: Logger
  ) {
    this.entitiesDS = entitiesDS;
    this.templatesDS = templatesDS;
    this.transactionManager = transactionManager;
    this.validator = validator;
    this.logger = logger;
  }

  // eslint-disable-next-line max-statements
  async execute(translationResult: TranslationResult | unknown) {
    this.validator.ensure(translationResult);

    const [, entitySharedId, propertyId] = translationResult.key;

    const property = await this.getProperty(entitySharedId, propertyId);
    if (!property) {
      return;
    }

    const entityResult = await this.entitiesDS.getById(entitySharedId);
    if (entityResult.isError()) {
      this.logger.info(
        `[AT] - Entity with sharedId ${entitySharedId} does not exist (trying to save a translation coming from AT service)`
      );
      return;
    }
    const entity = entityResult.getDataOrThrow();

    for (const translation of translationResult.translations) {
      if (translation?.success === false) {
        this.logger.error(
          `[AT] - Translation error - ${translation.error_message} - ${JSON.stringify({
            entityId: entity.sharedId,
            language: translation.language,
            [property.name]: translation.text,
          })}`
        );
      } else if (translation?.success && property) {
        const textTranslated = `${SaveEntityTranslations.AITranslatedText} ${translation.text}`;

        const propertyAssignment = entity.template.createPropertyAssignment(property.name, {
          value: [{ value: textTranslated }],
        });

        entity.setPropertyAssignments(
          [propertyAssignment],
          translation.language as LanguageISO6391,
          false
        );

        this.logger.info(
          `[AT] - Property saved on DB - ${JSON.stringify({
            entityId: entity.sharedId,
            language: translation.language,
            [property.name]: translation.text,
          })}`
        );
      }
    }

    await this.transactionManager.run(async () => {
      await this.entitiesDS.update(entity);
    });
  }

  private async getProperty(entitySharedId: string, propertyId: string) {
    const entityResult = await this.entitiesDS.getById(entitySharedId);
    if (entityResult.isError()) {
      this.logger.info(
        `[AT] - Entity with sharedId ${entitySharedId} does not exist (trying to save a translation coming from AT service)`
      );
      return null;
    }

    const entity = entityResult.getDataOrThrow();
    const template = (await this.templatesDS.getById(entity.template.id)).getDataOrThrow();

    const property = template.getPropertyById(propertyId);
    if (!property) {
      throw new Error('Property does not exist');
    }

    return property;
  }
}
