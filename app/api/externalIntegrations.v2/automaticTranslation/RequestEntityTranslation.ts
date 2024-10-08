import { getTenant } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { Entity } from 'api/entities.v2/model/Entity';
import { EntityInputModel } from 'api/entities.v2/types/EntityInputDataType';
import { Logger } from 'api/log.v2/contracts/Logger';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { ATConfigDataSource } from './contracts/ATConfigDataSource';
import { Validator } from './infrastructure/Validator';
import { SaveEntityTranslationPending } from './SaveEntityTranslationsPending';

export type ATTaskMessage = {
  key: string[];
  text: string;
  language_from: string;
  languages_to: string[];
};

export class RequestEntityTranslation {
  static SERVICE_NAME = 'translations';

  private taskManager: TaskManager<ATTaskMessage>;

  private ATConfigDS: ATConfigDataSource;

  private saveEntityTranslationPending: SaveEntityTranslationPending;

  private inputValidator: Validator<EntityInputModel>;

  private logger: Logger;

  // eslint-disable-next-line max-params
  constructor(
    taskManager: TaskManager<ATTaskMessage>,
    ATConfigDS: ATConfigDataSource,
    saveEntityTranslationPending: SaveEntityTranslationPending,
    inputValidator: Validator<EntityInputModel>,
    logger: Logger
  ) {
    this.taskManager = taskManager;
    this.ATConfigDS = ATConfigDS;
    this.saveEntityTranslationPending = saveEntityTranslationPending;
    this.inputValidator = inputValidator;
    this.logger = logger;
  }

  async execute(entityInputModel: EntityInputModel | unknown) {
    this.inputValidator.ensure(entityInputModel);
    const atConfig = await this.ATConfigDS.get();
    const atTemplateConfig = atConfig.templates.find(
      t => t.template === entityInputModel.template?.toString()
    );

    const languageFrom = entityInputModel.language;
    const languagesTo = atConfig.languages.filter(
      language => language !== entityInputModel.language
    );

    if (
      !atTemplateConfig ||
      languagesTo.length <= 0 ||
      !atConfig.languages.includes(entityInputModel.language)
    ) {
      return;
    }

    const entity = Entity.fromInputModel(entityInputModel);

    await atTemplateConfig?.properties.reduce(async (prev, property) => {
      await prev;
      const propertyValue = entity.getPropertyValue(property);

      if (propertyValue) {
        await this.saveEntityTranslationPending.execute(
          entity.sharedId,
          property.id,
          propertyValue,
          languagesTo
        );

        await this.taskManager.startTask({
          key: [getTenant().name, entity.sharedId, property.id],
          text: propertyValue,
          language_from: languageFrom,
          languages_to: languagesTo,
        });

        this.logger.info(
          `[AT] - Translation requested - ${JSON.stringify({
            entityId: entity._id,
            languageFrom,
            languagesTo,
            [property.name]: propertyValue,
          })}`
        );
      }
    }, Promise.resolve());
  }
}
