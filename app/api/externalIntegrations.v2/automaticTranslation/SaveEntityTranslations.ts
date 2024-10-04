import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { ATTranslationResultValidator } from './contracts/ATTranslationResultValidator';
import { InvalidInputDataFormat } from './errors/generateATErrors';
import { TranslationResult } from './types/TranslationResult';

export class SaveEntityTranslations {
  static AITranslatedText = '(AI translated)';

  private entitiesDS: EntitiesDataSource;

  private templatesDS: TemplatesDataSource;

  private validator: ATTranslationResultValidator;

  constructor(
    templatesDS: TemplatesDataSource,
    entitiesDS: EntitiesDataSource,
    validator: ATTranslationResultValidator
  ) {
    this.entitiesDS = entitiesDS;
    this.templatesDS = templatesDS;
    this.validator = validator;
  }

  async execute(translationResult: TranslationResult | unknown) {
    if (!this.validator.validate(translationResult)) {
      throw new InvalidInputDataFormat(this.validator.getErrors()[0]);
    }

    const [, entitySharedId, propertyId] = translationResult.key;

    const { property, scope } = await this.getProperty(entitySharedId, propertyId);

    const entities = this.entitiesDS.getByIds([entitySharedId]);

    await entities.forEach(async oneEntity => {
      const translation = translationResult.translations.find(
        t => t.language === oneEntity.language
      );
      if (translation && property) {
        if (scope === 'metadata') {
          await this.entitiesDS.updateMetadataValues(oneEntity._id, {
            [property.name]: [
              { value: `${SaveEntityTranslations.AITranslatedText} ${translation.text}` },
            ],
          });
        }
        if (scope === 'title') {
          await this.entitiesDS.updateMetadataValues(
            oneEntity._id,
            {},
            `${SaveEntityTranslations.AITranslatedText} ${translation.text}`
          );
        }
      }
    });
  }

  // eslint-disable-next-line max-statements
  private async getProperty(entitySharedId: string, propertyId: string) {
    const entity = await this.entitiesDS.getByIds([entitySharedId]).first();
    if (!entity) {
      throw new Error('Entity does not exists');
    }

    const template = await this.templatesDS.getById(entity.template);
    if (!template) {
      throw new Error('Template does not exists');
    }

    const property = template.properties.find(p => p.id === propertyId);
    const commonProperty = template.commonProperties.find(p => p.id === propertyId);

    if (!property && !commonProperty) {
      throw new Error('Property does not exists');
    }

    return {
      property: commonProperty || property,
      scope: commonProperty ? 'title' : 'metadata',
    } as const;
  }
}
