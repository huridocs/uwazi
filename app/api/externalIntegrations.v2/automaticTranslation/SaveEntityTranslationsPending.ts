import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Logger } from 'api/log.v2/contracts/Logger';
import { LanguageISO6391 } from 'shared/types/commonTypes';

export class SaveEntityTranslationPending {
  static AITranslationPendingText = '(AI translation pending)';

  private templatesDS: TemplatesDataSource;

  private entitiesDS: EntitiesDataSource;

  private logger: Logger;

  constructor(templatesDS: TemplatesDataSource, entitiesDS: EntitiesDataSource, logger: Logger) {
    this.templatesDS = templatesDS;
    this.entitiesDS = entitiesDS;
    this.logger = logger;
  }

  async execute(
    sharedId: string,
    propertyId: string,
    originalText: string,
    targetLanguages: LanguageISO6391[]
  ) {
    const property = await this.getProperty(sharedId, propertyId);

    const entities = this.entitiesDS.getByIds([sharedId]);
    const pendingText = `${SaveEntityTranslationPending.AITranslationPendingText} ${originalText}`;

    await entities.forEach(async entity => {
      if (targetLanguages.includes(entity.language as LanguageISO6391)) {
        await this.entitiesDS.updateEntity(entity.changePropertyValue(property, pendingText));
        this.logger.info(
          `[AT] - Pending translation saved on DB - ${property.name}: ${pendingText}`
        );
      }
    });
  }

  private async getProperty(sharedId: string, propertyId: string) {
    const entity = await this.entitiesDS.getByIds([sharedId]).first();
    if (!entity) {
      throw new Error(`[AT] Translation-pending entity '${sharedId}' does not exist`);
    }

    const template = await this.templatesDS.getById(entity.template);
    if (!template) {
      throw new Error(`[AT] Translation-pending template does not exist: ${entity.template}`);
    }

    const property = template.getPropertyById(propertyId);

    if (!property) {
      throw new Error(`[AT] Translation-pending property does not exist: ${propertyId}`);
    }

    return property;
  }
}
