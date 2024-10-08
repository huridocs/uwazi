/* eslint-disable max-classes-per-file */
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { entityInputDataSchema } from 'api/entities.v2/types/EntityInputDataSchema';
import { EntityInputModel } from 'api/entities.v2/types/EntityInputDataType';
import { Logger } from 'api/log.v2/contracts/Logger';
import { createMockLogger } from 'api/log.v2/infrastructure/MockLogger';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { AutomaticTranslationFactory } from '../AutomaticTranslationFactory';
import { ValidationError, Validator } from '../infrastructure/Validator';
import { ATTaskMessage, RequestEntityTranslation } from '../RequestEntityTranslation';
import { SaveEntityTranslationPending } from '../SaveEntityTranslationsPending';

const factory = getFixturesFactory();
const fixtures: DBFixture = {
  templates: [
    factory.template('template1', [factory.property('text1'), factory.property('empty_text')]),
  ],
  entities: [
    ...factory.entityInMultipleLanguages(['en', 'es', 'pt'], 'entity1', 'template1', {
      text1: [{ value: 'original text1' }],
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
              properties: [factory.idString('text1'), factory.idString('empty_text')],
              commonProperties: [factory.commonPropertiesTitleId('template1')],
            },
          ],
        },
      },
    },
  ],
};

class TestSaveEntityTranslationPending extends SaveEntityTranslationPending {
  constructor() {
    super(undefined as any, undefined as any, undefined as any);
  }

  // eslint-disable-next-line class-methods-use-this
  async execute(
    _sharedId: string,
    _propertyId: string,
    _originalText: string,
    _targetLanguageKey: LanguageISO6391[]
  ): Promise<void> {
    return Promise.resolve();
  }
}

let saveEntityTranlationExecuteSpy: jest.SpyInstance<
  Promise<void>,
  [
    _sharedId: string,
    _propertyId: string,
    _originalText: string,
    _targetLanguageKey: LanguageISO6391[],
  ],
  any
>;
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

  const saveEntityTranslationPending = new TestSaveEntityTranslationPending();
  saveEntityTranlationExecuteSpy = jest.spyOn(saveEntityTranslationPending, 'execute');

  requestEntityTranslation = new RequestEntityTranslation(
    taskManager,
    AutomaticTranslationFactory.defaultATConfigDataSource(DefaultTransactionManager()),
    saveEntityTranslationPending,
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
      const languageFromEntity = fixtures.entities?.find(e => e.language === 'en') as EntitySchema;
      languageFromEntity._id = languageFromEntity?._id?.toString();
      languageFromEntity.template = languageFromEntity?.template?.toString();

      await requestEntityTranslation.execute(languageFromEntity!);
    });

    it('should call on save entities with pending translation', async () => {
      expect(saveEntityTranlationExecuteSpy).toHaveBeenCalledWith(
        'entity1',
        factory.commonPropertiesTitleId('template1').toString(),
        'entity1',
        ['es', 'pt']
      );
      expect(saveEntityTranlationExecuteSpy).toHaveBeenCalledWith(
        'entity1',
        factory.property('text1')._id?.toString(),
        'original text1',
        ['es', 'pt']
      );
    });

    it('should send a task to the automatic translation service queue', async () => {
      expect(taskManager.startTask).toHaveBeenCalledTimes(2);

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
    });

    it('should call Logger.info two times', async () => {
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
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
