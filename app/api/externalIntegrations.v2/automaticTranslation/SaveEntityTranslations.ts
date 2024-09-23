import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { ATTranslationResultValidator } from './contracts/ATTranslationResultValidator';
import { InvalidInputDataFormat } from './errors/generateATErrors';
import { TranslationResult } from './types/TranslationResult';

export class SaveEntityTranslations {
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

    const [tenant, entitySharedId, propertyId] = translationResult.key;

    const entity = await this.entitiesDS.getByIds([entitySharedId]).first();
    if (!entity) {
      throw new Error('entity does not exists');
    }

    const template = await this.templatesDS.getById(entity.template);
    if (!template) {
      throw new Error('template does not exists');
    }

    const property = template.properties.find(p => p.id === propertyId);

    if (!property) {
      throw new Error('property does not exists');
    }

    const entities = this.entitiesDS.getByIds([entitySharedId]);

    await entities.forEach(async oneEntity => {
      const translation = translationResult.translations.find(
        t => t.language === oneEntity.language
      );
      if (translation) {
        await this.entitiesDS.updateMetadataValues(oneEntity._id, {
          [property.name]: [{ value: `(AI translated) ${translation.text}` }],
        });
      }
    });

    // entities.save() esto que vaya en un wrapper (interfaz)
  }
}
