import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { Logger } from 'api/core/libs/logger/contracts/Logger';
import { Entity } from 'api/entities.v2/model/Entity';
import { TranslationResult } from './types/TranslationResult';
import { Validator } from './infrastructure/Validator';

export class SaveEntityTranslations {
  static AITranslatedText = '(AI translated)';

  private logger: Logger;

  private entitiesDS: EntitiesDataSource;

  private templatesDS: TemplatesDataSource;

  private validator: Validator<TranslationResult>;

  constructor(
    templatesDS: TemplatesDataSource,
    entitiesDS: EntitiesDataSource,
    validator: Validator<TranslationResult>,
    logger: Logger
  ) {
    this.entitiesDS = entitiesDS;
    this.templatesDS = templatesDS;
    this.validator = validator;
    this.logger = logger;
  }

  async execute(translationResult: TranslationResult | unknown) {
    this.validator.ensure(translationResult);

    const [, entitySharedId, propertyId] = translationResult.key;

    const property = await this.getProperty(entitySharedId, propertyId);
    if (!property) {
      return;
    }

    const entities = this.entitiesDS.getByIds([entitySharedId]);

    await entities.forEach(async entity => {
      const translation = translationResult.translations.find(t => t.language === entity.language);
      if (translation?.success === false) {
        this.logger.error(
          `[AT]
- Translation error
- ${translation.error_message}
- ${JSON.stringify({ entityId: entity._id, language: entity.language, [property.name]: translation.text })}`
        );
      }
      if (translation?.success && property) {
        const textTranslated = `${SaveEntityTranslations.AITranslatedText} ${translation.text}`;
        await this.entitiesDS.updateEntity(entity.setPropertyValue(property, textTranslated));

        this.logger.info(
          // eslint-disable-next-line max-len
          `[AT] - Property saved on DB - ${JSON.stringify({ entityId: entity._id, language: entity.language, [property.name]: translation.text })}`
        );
      }
    });
  }

  private async getProperty(entitySharedId: string, propertyId: string) {
    const entity = await this.entitiesDS.getByIds([entitySharedId]).first();
    if (!entity) {
      this.logger.info(
        `[AT] - Entity with sharedId ${entitySharedId} does not exist (trying to save a translation comming from AT service)`
      );
      return null;
    }

    const template = await this.getTemplate(entity);

    const property = template.getPropertyById(propertyId);
    if (!property) {
      throw new Error('Property does not exist');
    }

    return property;
  }

  private async getTemplate(entity: Entity) {
    const template = (await this.templatesDS.getById(entity.template)).getDataOrThrow();

    return template;
  }
}
