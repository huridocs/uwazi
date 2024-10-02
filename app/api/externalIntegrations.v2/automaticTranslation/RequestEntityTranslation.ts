import { getTenant } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { EntityInputData } from 'api/entities.v2/EntityInputDataType';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { ATConfigService } from './services/GetAutomaticTranslationConfig';

export type ATTaskMessage = {
  key: string[];
  text: string;
  language_from: string;
  languages_to: string[];
};

export class RequestEntityTranslation {
  static SERVICE_NAME = 'translations';

  private taskManager: TaskManager<ATTaskMessage>;

  private templatesDS: TemplatesDataSource;

  private aTConfigService: ATConfigService;

  constructor(
    taskManager: TaskManager<ATTaskMessage>,
    templatesDS: TemplatesDataSource,
    aTConfigService: ATConfigService
  ) {
    this.taskManager = taskManager;
    this.templatesDS = templatesDS;
    this.aTConfigService = aTConfigService;
  }

  async execute(entity: EntityInputData) {
    const atConfig = await this.aTConfigService.get();
    const atTemplateConfig = atConfig.templates.find(
      t => t.template === entity.template?.toString()
    );

    if (!atTemplateConfig) {
      return;
    }

    const template = await this.templatesDS.getById(atTemplateConfig?.template);

    const languageFrom = entity.language;
    if (!atConfig.languages.includes(languageFrom)) {
      return;
    }

    const languagesTo = atConfig.languages.filter(language => language !== languageFrom);
    atTemplateConfig?.commonProperties.forEach(async commonPropId => {
      const commonPropName = template?.commonProperties.find(
        prop => prop.id === commonPropId
      )?.name;

      if (!commonPropName) {
        throw new Error('Common property not found');
      }

      if (!(typeof entity[commonPropName] === 'string')) {
        throw new Error('Common property is not a string');
      }

      await this.taskManager.startTask({
        key: [getTenant().name, entity.sharedId, commonPropId.toString()],
        text: entity[commonPropName],
        language_from: languageFrom,
        languages_to: languagesTo,
      });
    });
    atTemplateConfig?.properties.forEach(async propId => {
      const propName = template?.properties.find(prop => prop.id === propId)?.name;
      if (!propName) {
        throw new Error('Property not found');
      }

      if (!(typeof entity.metadata[propName]?.[0].value === 'string')) {
        throw new Error('Property is not a string');
      }

      if (entity.metadata[propName]?.[0].value) {
        await this.taskManager.startTask({
          key: [getTenant().name, entity.sharedId, propId],
          text: entity.metadata[propName][0].value,
          language_from: languageFrom,
          languages_to: languagesTo,
        });
      }
    });
  }
}
