import { getTenant } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { Entity } from 'api/entities.v2/model/Entity';
import { EntityInputModel } from 'api/entities.v2/types/EntityInputDataType';
import { Logger } from 'api/log.v2/contracts/Logger';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { ATConfigDataSource } from './contracts/ATConfigDataSource';
import { Validator } from './infrastructure/Validator';

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

  async execute(entityInputModel: EntityInputModel | unknown) {
    this.inputValidator.ensure(entityInputModel);
    const entity = Entity.fromInputModel(entityInputModel);
    const { atTemplateConfig, languagesTo, atConfig, languageFrom } = await this.getConfig(entity);

    if (
      !atTemplateConfig ||
      languagesTo.length <= 0 ||
      !atConfig.languages.includes(entityInputModel.language)
    ) {
      return;
    }

    let updatedEntities = (await this.entitiesDS.getByIds([entity.sharedId]).all()).filter(
      e => e.language !== languageFrom
    );

    await atTemplateConfig?.properties.reduce(async (prev, property) => {
      await prev;
      const propertyValue = entity.getPropertyValue(property);

      if (propertyValue) {
        const pendingText = `${RequestEntityTranslation.AITranslationPendingText} ${propertyValue}`;

        updatedEntities = updatedEntities.map(fetchedEntity =>
          fetchedEntity.setPropertyValue(property, pendingText)
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

    await Promise.all(
      updatedEntities.map(async updatedEntity => {
        this.logger.info(`[AT] - Pending translation saved on DB for entity - ${entity._id}`);
        await this.entitiesDS.updateEntities_OnlyUpdateAndReindex(updatedEntity);
      })
    );
  }

  private async getConfig(entity: Entity) {
    const atConfig = await this.ATConfigDS.get();
    const atTemplateConfig = atConfig.templates.find(
      t => t.template === entity.template?.toString()
    );

    const languageFrom = entity.language;
    const languagesTo = atConfig.languages.filter(language => language !== entity.language);
    return { atTemplateConfig, languagesTo, atConfig, languageFrom };
  }
}
