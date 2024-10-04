import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { entityInputDataSchema } from 'api/entities.v2/EntityInputDataSchema';
import { EntityInputData } from 'api/entities.v2/EntityInputDataType';
import {
  ATConfig,
  ATTemplateConfig,
} from 'api/externalIntegrations.v2/automaticTranslation/model/ATConfig';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { createMockLogger } from 'api/log.v2/infrastructure/MockLogger';
import { Logger } from 'api/log.v2/contracts/Logger';
import { ValidationError, Validator } from '../infrastructure/Validator';
import { ATTaskMessage, RequestEntityTranslation } from '../RequestEntityTranslation';
import { ATConfigService } from '../services/GetAutomaticTranslationConfig';

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

// @ts-ignore
class TestATConfigService implements ATConfigService {
  // eslint-disable-next-line class-methods-use-this
  async get() {
    return new ATConfig(
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
  }
}

let taskManager: TaskManager<ATTaskMessage>;
let mockLogger: Logger;

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
  await testingEnvironment.setTenant('tenant');
  mockLogger = createMockLogger();
  taskManager = new TaskManager<ATTaskMessage>({
    serviceName: RequestEntityTranslation.SERVICE_NAME,
  });
  jest.spyOn(taskManager, 'startTask').mockImplementation(async () => '');
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('RequestEntityTranslation', () => {
  it('should send a task in the automatic translation service queue', async () => {
    const languageFromEntity = fixtures.entities.find(e => e.language === 'en') as EntitySchema;
    languageFromEntity._id = languageFromEntity?._id?.toString();
    languageFromEntity.template = languageFromEntity?.template?.toString();

    const requestEntityTranslation = new RequestEntityTranslation(
      taskManager,
      DefaultTemplatesDataSource(DefaultTransactionManager()),
      // @ts-ignore
      new TestATConfigService(),
      new Validator<EntityInputData>(entityInputDataSchema),
      mockLogger
    );

    await requestEntityTranslation.execute(languageFromEntity!);

    expect(taskManager.startTask).toHaveBeenCalledTimes(2);

    expect(taskManager.startTask).toHaveBeenCalledWith({
      key: ['tenant', 'entity1', factory.commonPropertiesTitleId('template1').toString()],
      text: 'entity1',
      language_from: 'en',
      languages_to: ['es'],
    });

    expect(taskManager.startTask).toHaveBeenCalledWith({
      key: ['tenant', 'entity1', factory.property('text1')._id?.toString()],
      text: 'original text1',
      language_from: 'en',
      languages_to: ['es'],
    });
  });

  it('should do nothing if entity.language is not supported', async () => {
    const entityWithNotSupportedLanguage = factory.entity(
      'entity2',
      'template1',
      {},
      { language: 'pt' }
    );
    entityWithNotSupportedLanguage._id = entityWithNotSupportedLanguage?._id?.toString();
    entityWithNotSupportedLanguage.template = entityWithNotSupportedLanguage?.template?.toString();

    const requestEntityTranslation = new RequestEntityTranslation(
      taskManager,
      DefaultTemplatesDataSource(DefaultTransactionManager()),
      // @ts-ignore
      new TestATConfigService(),
      new Validator<EntityInputData>(entityInputDataSchema),
      mockLogger
    );

    await requestEntityTranslation.execute(entityWithNotSupportedLanguage);
    expect(taskManager.startTask).not.toHaveBeenCalled();
  });

  it('should validate input has proper shape at runtime', async () => {
    const requestEntityTranslation = new RequestEntityTranslation(
      taskManager,
      DefaultTemplatesDataSource(DefaultTransactionManager()),
      // @ts-ignore
      new TestATConfigService(),
      new Validator<EntityInputData>(entityInputDataSchema),
      mockLogger
    );

    const invalidEntity = { invalid_prop: true };
    await expect(requestEntityTranslation.execute(invalidEntity)).rejects.toEqual(
      new ValidationError("must have required property '_id'")
    );
  });

  it('should call Logger.info two times', async () => {
    const languageFromEntity = fixtures.entities.find(e => e.language === 'en') as EntitySchema;
    languageFromEntity._id = languageFromEntity?._id?.toString();
    languageFromEntity.template = languageFromEntity?.template?.toString();

    const requestEntityTranslation = new RequestEntityTranslation(
      taskManager,
      DefaultTemplatesDataSource(DefaultTransactionManager()),
      // @ts-ignore
      new TestATConfigService(),
      new Validator<EntityInputData>(entityInputDataSchema),
      mockLogger
    );

    await requestEntityTranslation.execute(languageFromEntity!);

    expect(mockLogger.info).toHaveBeenCalledTimes(2);
  });
});
