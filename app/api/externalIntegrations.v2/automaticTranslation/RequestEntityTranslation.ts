import { getTenant } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { EntityInputValidator } from './contracts/EntityInputValidator';
import { ATConfigService } from './services/GetAutomaticTranslationConfig';

export type ATTaskMessage = {
  params: {
    key: string[];
    text: string;
    language_from: string;
    languages_to: string[];
  };
};

export type EntityInputData = {
  _id: string;
  sharedId: string;
  language: LanguageISO6391;
  title: string;
  template: string;
  published: boolean;
};

export class RequestEntityTranslation {
  static SERVICE_NAME = 'AutomaticTranslation';

  private taskManager: TaskManager<ATTaskMessage>;

  private templatesDS: TemplatesDataSource;

  private aTConfigService: ATConfigService;

  private inputValidator: EntityInputValidator;

  constructor(
    taskManager: TaskManager<ATTaskMessage>,
    templatesDS: TemplatesDataSource,
    aTConfigService: ATConfigService,
    inputValidator: EntityInputValidator
  ) {
    this.taskManager = taskManager;
    this.templatesDS = templatesDS;
    this.aTConfigService = aTConfigService;
    this.inputValidator = inputValidator;
  }

  async execute(entity: EntityInputData | unknown) {
    if (!this.inputValidator.validate(entity)) {
      throw this.inputValidator.getErrors()[0];
    }
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
      await this.taskManager.startTask({
        params: {
          key: [getTenant().name, entity.sharedId, commonPropName],
          text: entity[commonPropName],
          language_from: languageFrom,
          languages_to: languagesTo,
        },
      });
    });
    atTemplateConfig?.properties.forEach(async propId => {
      const propName = template?.properties.find(prop => prop.id === propId)?.name;
      if (entity.metadata[propName][0].value) {
        await this.taskManager.startTask({
          params: {
            key: [getTenant().name, entity.sharedId, propName],
            text: entity.metadata[propName][0].value,
            language_from: languageFrom,
            languages_to: languagesTo,
          },
        });
      }
    });
  }
}
