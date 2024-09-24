import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getTenant } from 'api/common.v2/database/getConnectionForCurrentTenant';
import {
  ATConfig,
  ATTemplateConfig,
} from 'api/externalIntegrations.v2/automaticTranslation/model/ATConfig';
import { ResultsMessage, TaskManager } from 'api/services/tasksmanager/TaskManager';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';

type TaskMessage = {
  params: {
    key: string[];
    text: string;
    language_from: string;
    languages_to: string[];
  };
};

class AutomaticTranslationTaskManager {
  static SERVICE_NAME = 'AutomaticTranslation';

  private taskManager: TaskManager<TaskMessage>;

  private templatesDS: TemplatesDataSource;

  constructor(taskManager: TaskManager<TaskMessage>, templatesDS: TemplatesDataSource) {
    this.taskManager = taskManager;
    this.templatesDS = templatesDS;
  }

  async translateEntity(entity: EntitySchema, atConfig: ATConfig) {
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

const factory = getFixturesFactory();
const fixtures = {
  templates: [
    factory.template('template1', [factory.property('text1'), factory.property('empty_text')]),
  ],
  entities: [
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity1', 'template1', {
      text1: [{ value: 'original text1' }],
      empty_text: [{ value: '' }],
    }),
  ],
  settings: [
    {
      languages: [
        { label: 'en', key: 'en' as LanguageISO6391, default: true },
        { label: 'es', key: 'es' as LanguageISO6391 },
      ],
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
  await testingEnvironment.setTenant('tenant');
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('AutomaticTranslationTaskManager', () => {
  it('should send a task in the automatic translation service queue', async () => {
    const languageFromEntity = fixtures.entities.find(e => e.language === 'en');
    const taskManager = new TaskManager<TaskMessage>({
      serviceName: AutomaticTranslationTaskManager.SERVICE_NAME,
      processResults: async (_results: ResultsMessage) => { },
    });

    jest.spyOn(taskManager, 'startTask').mockImplementation(() => { });

    const automaticTranslationTaskManager = new AutomaticTranslationTaskManager(
      taskManager,
      DefaultTemplatesDataSource(DefaultTransactionManager())
    );

    const config = new ATConfig(
      true,
      ['es', 'en'],
      [
        new ATTemplateConfig(
          factory.idString('template1'),
          [factory.idString('text1'), factory.idString('empty_text')],
          [factory.commonPropertiesTitleId('template1')]
        ),
      ]
    );

    await automaticTranslationTaskManager.translateEntity(languageFromEntity, config);

    expect(taskManager.startTask).toHaveBeenCalledTimes(2);

    expect(taskManager.startTask).toHaveBeenCalledWith({
      params: {
        key: ['tenant', 'entity1', 'title'],
        text: 'entity1',
        language_from: 'en',
        languages_to: ['es'],
      },
    });

    expect(taskManager.startTask).toHaveBeenCalledWith({
      params: {
        key: ['tenant', 'entity1', 'text1'],
        text: 'original text1',
        language_from: 'en',
        languages_to: ['es'],
      },
    });
  });

  it('should do nothing if entity.language is not supported', async () => {
    const entityWithNotSupportedLanguage = factory.entity(
      'entity2',
      'template1',
      {},
      { language: 'pt' }
    );
    const taskManager = new TaskManager<TaskMessage>({
      serviceName: AutomaticTranslationTaskManager.SERVICE_NAME,
      processResults: async (_results: ResultsMessage) => { },
    });

    jest.spyOn(taskManager, 'startTask').mockImplementation(() => { });

    const automaticTranslationTaskManager = new AutomaticTranslationTaskManager(
      taskManager,
      DefaultTemplatesDataSource(DefaultTransactionManager())
    );

    const config = new ATConfig(
      true,
      ['es', 'en'],
      [
        new ATTemplateConfig(
          factory.idString('template1'),
          [factory.idString('text1'), factory.idString('empty_text')],
          [factory.commonPropertiesTitleId('template1')]
        ),
      ]
    );

    await automaticTranslationTaskManager.translateEntity(entityWithNotSupportedLanguage, config);
    expect(taskManager.startTask).not.toHaveBeenCalled();
  });
});
