/* eslint-disable max-classes-per-file */
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { entityInputDataSchema } from 'api/entities.v2/types/EntityInputDataSchema';
import { EntityInputModel } from 'api/entities.v2/types/EntityInputDataType';
import { Logger } from 'api/log.v2/contracts/Logger';
import { createMockLogger } from 'api/log.v2/infrastructure/MockLogger';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { AutomaticTranslationFactory } from '../AutomaticTranslationFactory';
import { ValidationError, Validator } from '../infrastructure/Validator';
import { ATTaskMessage, RequestEntityTranslation } from '../RequestEntityTranslation';

const factory = getFixturesFactory();
const fixtures: DBFixture = {
  templates: [
    factory.template('template1', [
      factory.property('text1'),
      factory.property('text2', 'markdown'),
      factory.property('text3'),
      factory.property('empty_text'),
    ]),
  ],
  entities: [
    ...factory.entityInMultipleLanguages(['en', 'es', 'pt'], 'entity1', 'template1', {
      text1: [{ value: 'original text1' }],
      text2: [{ value: 'markdown text' }],
      text3: [],
      empty_text: [{ value: '' }],
    }),
  ],
  settings: [
    {
      languages: [
        { label: 'en', key: 'en' as LanguageISO6391, default: true },
        { label: 'es', key: 'es' as LanguageISO6391 },
        { label: 'pt', key: 'pt' as LanguageISO6391 },
      ],
      features: {
        automaticTranslation: {
          active: true,
          templates: [
            {
              template: factory.idString('template1'),
              properties: [
                factory.idString('text1'),
                factory.idString('text2'),
                factory.idString('text3'),
                factory.idString('empty_text'),
              ],
              commonProperties: [factory.commonPropertiesTitleId('template1')],
            },
          ],
        },
      },
    },
  ],
};

let taskManager: TaskManager<ATTaskMessage>;
let mockLogger: Logger;
let requestEntityTranslation: RequestEntityTranslation;

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
  await testingEnvironment.setTenant('tenant');
  mockLogger = createMockLogger();
  taskManager = new TaskManager<ATTaskMessage>({
    serviceName: RequestEntityTranslation.SERVICE_NAME,
  });
  jest.spyOn(taskManager, 'startTask').mockImplementation(async () => '');

  const transactionManager = DefaultTransactionManager();

  requestEntityTranslation = new RequestEntityTranslation(
    taskManager,
    AutomaticTranslationFactory.defaultATConfigDataSource(transactionManager),
    DefaultEntitiesDataSource(transactionManager),
    new Validator<EntityInputModel>(entityInputDataSchema),
    mockLogger
  );
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('RequestEntityTranslation', () => {
  describe('on requests that should be processed', () => {
    beforeEach(async () => {
      const languageFromEntity = {
        ...fixtures.entities?.find(e => e.language === 'en'),
      } as EntitySchema;
      languageFromEntity._id = languageFromEntity?._id?.toString();
      languageFromEntity.template = languageFromEntity?.template?.toString();

      await requestEntityTranslation.execute(languageFromEntity!);
    });

    it('should call save entities with pending translation', async () => {
      const entities =
        (await testingDB.mongodb?.collection('entities').find({ sharedId: 'entity1' }).toArray()) ||
        [];
      expect(entities.find(e => e.language === 'es')).toMatchObject({
        title: `${RequestEntityTranslation.AITranslationPendingText} entity1`,
        metadata: {
          text1: [{ value: `${RequestEntityTranslation.AITranslationPendingText} original text1` }],
        },
      });
      expect(entities.find(e => e.language === 'pt')).toMatchObject({
        title: `${RequestEntityTranslation.AITranslationPendingText} entity1`,
        metadata: {
          text1: [{ value: `${RequestEntityTranslation.AITranslationPendingText} original text1` }],
        },
      });
      expect(entities.find(e => e.language === 'en')).toMatchObject({
        title: 'entity1',
        metadata: { text1: [{ value: 'original text1' }] },
      });
    });

    it('should send a task to the automatic translation service queue', () => {
      expect(taskManager.startTask).toHaveBeenCalledTimes(3);

      expect(taskManager.startTask).toHaveBeenCalledWith({
        key: ['tenant', 'entity1', factory.commonPropertiesTitleId('template1').toString()],
        text: 'entity1',
        language_from: 'en',
        languages_to: ['es', 'pt'],
      });

      expect(taskManager.startTask).toHaveBeenCalledWith({
        key: ['tenant', 'entity1', factory.property('text1')._id?.toString()],
        text: 'original text1',
        language_from: 'en',
        languages_to: ['es', 'pt'],
      });

      expect(taskManager.startTask).toHaveBeenCalledWith({
        key: ['tenant', 'entity1', factory.property('text2')._id?.toString()],
        text: 'markdown text',
        language_from: 'en',
        languages_to: ['es', 'pt'],
      });
    });
  });

  it('should do nothing if entity.language is not supported', async () => {
    const entityWithNotSupportedLanguage = factory.entity(
      'entity2',
      'template1',
      {},
      { language: 'kg' }
    );
    entityWithNotSupportedLanguage._id = entityWithNotSupportedLanguage?._id?.toString();
    entityWithNotSupportedLanguage.template = entityWithNotSupportedLanguage?.template?.toString();

    await requestEntityTranslation.execute(entityWithNotSupportedLanguage);
    expect(taskManager.startTask).not.toHaveBeenCalled();
  });

  it('should validate input has proper shape at runtime', async () => {
    const invalidEntity = { invalid_prop: true };
    await expect(requestEntityTranslation.execute(invalidEntity)).rejects.toEqual(
      new ValidationError("must have required property '_id'")
    );
  });

  it('should NOT send any task if there is no other language to translate', async () => {
    await testingEnvironment.setFixtures({
      ...fixtures,
      settings: [{ languages: [{ label: 'en', key: 'en' as LanguageISO6391, default: true }] }],
    });
    const languageFromEntity = fixtures.entities?.find(e => e.language === 'en') as EntitySchema;
    languageFromEntity._id = languageFromEntity?._id?.toString();
    languageFromEntity.template = languageFromEntity?.template?.toString();

    await requestEntityTranslation.execute(languageFromEntity!);

    expect(taskManager.startTask).toHaveBeenCalledTimes(0);
  });
});
