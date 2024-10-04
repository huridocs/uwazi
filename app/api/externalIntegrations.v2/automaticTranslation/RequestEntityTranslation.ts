import { getTenant } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { EntityInputData } from 'api/entities.v2/EntityInputDataType';
import { Logger } from 'api/log.v2/contracts/Logger';
import { ATConfigService } from './services/GetAutomaticTranslationConfig';
import { Validator } from './infrastructure/Validator';
import { ATTemplateConfig } from './model/ATConfig';

export type ATTaskMessage = {
  key: string[];
  text: string;
  language_from: string;
  languages_to: string[];
};

export class RequestEntityTranslation {
  static SERVICE_NAME = 'translations';

  private logger: Logger;

  private taskManager: TaskManager<ATTaskMessage>;

  private templatesDS: TemplatesDataSource;

  private aTConfigService: ATConfigService;

  private inputValidator: Validator<EntityInputData>;

  // eslint-disable-next-line max-params
  constructor(
    taskManager: TaskManager<ATTaskMessage>,
    templatesDS: TemplatesDataSource,
    aTConfigService: ATConfigService,
    inputValidator: Validator<EntityInputData>,
    logger: Logger
  ) {
    this.taskManager = taskManager;
    this.templatesDS = templatesDS;
    this.aTConfigService = aTConfigService;
    this.inputValidator = inputValidator;
    this.logger = logger;
  }

  async execute(entity: EntityInputData | unknown) {
    this.inputValidator.ensure(entity);
    const atConfig = await this.aTConfigService.get();
    const atTemplateConfig = atConfig.templates.find(
      t => t.template === entity.template?.toString()
    );

    if (!atTemplateConfig) {
      return;
    }

    const languageFrom = entity.language;

    if (!atConfig.languages.includes(entity.language)) {
      return;
    }

    const languagesTo = atConfig.languages.filter(language => language !== entity.language);

    await this.requestTranslation(atTemplateConfig, languagesTo, languageFrom, entity);
  }

  private async requestTranslation(
    atTemplateConfig: ATTemplateConfig,
    languagesTo: string[],
    languageFrom: string,
    entity: EntityInputData
  ) {
    const template = await this.templatesDS.getById(atTemplateConfig?.template);

    atTemplateConfig?.commonProperties.forEach(async commonPropId => {
      const commonPropName = template?.getPropertyById(commonPropId)?.name;

      if (!commonPropName) {
        throw new Error('Common property not found');
      }

      if (!(typeof entity[commonPropName] === 'string')) {
        throw new Error('Common property is not a string');
      }

      await this.startTask({
        key: [getTenant().name, entity.sharedId, commonPropId.toString()],
        text: entity[commonPropName],
        language_from: languageFrom,
        languages_to: languagesTo,
      });
    });

    atTemplateConfig?.properties.forEach(async propId => {
      const propName = template?.getPropertyById(propId)?.name;
      if (!propName) {
        throw new Error('Property not found');
      }

      if (!(typeof entity.metadata[propName]?.[0].value === 'string')) {
        throw new Error('Property is not a string');
      }

      if (entity.metadata[propName]?.[0].value) {
        await this.startTask({
          key: [getTenant().name, entity.sharedId, propId],
          text: entity.metadata[propName][0].value,
          language_from: languageFrom,
          languages_to: languagesTo,
        });
      }
    });
  }

  private async startTask(task: ATTaskMessage) {
    this.logger.info(
      `[AT] - Translation requested - From: ${task.language_from} To: ${task.languages_to.toString()} - Text: ${task.text}`
    );
    return this.taskManager.startTask(task);
  }
}
