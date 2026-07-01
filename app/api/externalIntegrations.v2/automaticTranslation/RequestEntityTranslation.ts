import { getTenant } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { TaskManager } from '#api/services/tasksmanager/TaskManager.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { ATConfigDataSource } from './contracts/ATConfigDataSource.js';
import { Validator } from './infrastructure/Validator.js';
import { EntityInputModel } from '#api/entities.v2/types/EntityInputDataType.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

export type ATTaskMessage = {
  key: string[];
  text: string;
  language_from: string;
  languages_to: string[];
};

export class RequestEntityTranslation {
  static SERVICE_NAME = 'translations';

  static AITranslationPendingText = '(AI translation pending)';

  private taskManager: TaskManager<ATTaskMessage>;

  private ATConfigDS: ATConfigDataSource;

  private entitiesDS: EntitiesDataSource;

  private inputValidator: Validator<EntityInputModel>;

  private logger: Logger;

  // eslint-disable-next-line max-params
  constructor(
    taskManager: TaskManager<ATTaskMessage>,
    ATConfigDS: ATConfigDataSource,
    entitiesDS: EntitiesDataSource,
    inputValidator: Validator<EntityInputModel>,
    logger: Logger
  ) {
    this.taskManager = taskManager;
    this.ATConfigDS = ATConfigDS;
    this.entitiesDS = entitiesDS;
    this.inputValidator = inputValidator;
    this.logger = logger;
  }

  // eslint-disable-next-line max-statements
  async execute(entityInputModel: EntityInputModel | unknown) {
    this.inputValidator.ensure(entityInputModel);
    const { atTemplateConfig, languagesTo, atConfig, languageFrom } =
      await this.getConfig(entityInputModel);

    if (
      !atTemplateConfig ||
      languagesTo.length <= 0 ||
      !atConfig.languages.includes(entityInputModel.language)
    ) {
      return;
    }

    const entityResult = await this.entitiesDS.getById(entityInputModel.sharedId);
    if (entityResult.isError()) {
      return;
    }
    const entity = entityResult.getDataOrThrow();

    const targetLanguages = entity.languages.filter(l => l !== languageFrom);

    for (const property of atTemplateConfig.properties) {
      const templateProperty = entity.template.getPropertyById(property.id);
      // eslint-disable-next-line no-continue
      if (!templateProperty) continue;

      const propertyValue = entity.getValue(templateProperty.name, languageFrom).value;
      const rawValue =
        Array.isArray(propertyValue) && propertyValue.length
          ? `${propertyValue[0]?.value ?? ''}`
          : '';

      // eslint-disable-next-line no-continue
      if (!rawValue) continue;

      const pendingText = `${RequestEntityTranslation.AITranslationPendingText} ${rawValue}`;

      for (const targetLanguage of targetLanguages) {
        const propertyAssignment = entity.template.createPropertyAssignment(templateProperty.name, {
          value: [{ value: pendingText }],
        });

        entity.setPropertyAssignments(
          [propertyAssignment],
          targetLanguage as LanguageISO6391,
          false
        );
      }

      // eslint-disable-next-line no-await-in-loop
      await this.taskManager.startTask({
        key: [getTenant().name, entityInputModel.sharedId, templateProperty.id],
        text: rawValue,
        language_from: languageFrom,
        languages_to: languagesTo,
      });

      this.logger.info(
        `[AT] - Translation requested - ${JSON.stringify({
          entityId: entityInputModel._id,
          languageFrom,
          languagesTo,
          [templateProperty.name]: rawValue,
        })}`
      );
    }

    await this.entitiesDS.update(entity);
  }

  private async getConfig(entityInputModel: EntityInputModel) {
    const atConfig = await this.ATConfigDS.get();
    const atTemplateConfig = atConfig.templates.find(
      t => t.template === entityInputModel.template?.toString()
    );

    const languageFrom = entityInputModel.language;
    const languagesTo = atConfig.languages.filter(
      language => language !== entityInputModel.language
    );
    return { atTemplateConfig, languagesTo, atConfig, languageFrom };
  }
}
