import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { MongoTranslationsDataSource } from '../../database/MongoTranslationsDataSource';
import { UpdateTranslationsService } from '../UpdateTranslationsService';

const factory = getFixturesFactory();

const collectionInDb = (collection = 'translations_v2') =>
  testingDB.mongodb?.collection(collection)!;

const createService = () =>
  new UpdateTranslationsService(
    new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient())),
    new MongoTransactionManager(getClient())
  );

const fixtures = {
  translations_v2: [
    {
      _id: factory.id('translation1_es'),
      language: 'es',
      key: 'clave1',
      value: 'valor1',
      context: { type: 'test', label: 'Test', id: 'test' },
    },
    {
      _id: factory.id('translation1_en'),
      language: 'en',
      key: 'key1',
      value: 'value1',
      context: { type: 'test', label: 'Test', id: 'test' },
    },
    {
      _id: factory.id('translation2_es'),
      language: 'es',
      key: 'clave2',
      value: 'valor2',
      context: { type: 'test', label: 'Test', id: 'test' },
    },
    {
      _id: factory.id('translation2_en'),
      language: 'en',
      key: 'key2',
      value: 'value2',
      context: { type: 'test', label: 'Test', id: 'test' },
    },
  ],
  settings: [
    {
      languages: [
        { default: true, label: 'English', key: 'en' },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('update()', () => {
  describe('When the input is correct', () => {
    it('should update translations', async () => {
      const service = createService();
      await service.update([
        {
          _id: factory.id('translation1_es'),
          language: 'es',
          key: 'clave1',
          value: 'nuevo valor 1',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
        {
          _id: factory.id('translation2_es'),
          language: 'es',
          key: 'clave2',
          value: 'nuevo valor 2',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
      ]);

      const translationsInDb = await collectionInDb().find({}).sort({ _id: 1 }).toArray();

      expect(translationsInDb).toEqual([
        {
          _id: factory.id('translation1_es'),
          language: 'es',
          key: 'clave1',
          value: 'nuevo valor 1',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
        {
          _id: factory.id('translation1_en'),
          language: 'en',
          key: 'key1',
          value: 'value1',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
        {
          _id: factory.id('translation2_es'),
          language: 'es',
          key: 'clave2',
          value: 'nuevo valor 2',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
        {
          _id: factory.id('translation2_en'),
          language: 'en',
          key: 'key2',
          value: 'value2',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
      ]);
    });

    // it('should return persisted translations', async () => {
    //   const translations = await createTranslationsThroughService();
    //
    //   expect(translations).toEqual([
    //     {
    //       _id: expect.any(String),
    //       language: 'es',
    //       key: 'clave',
    //       value: 'valor',
    //       context: { type: 'test', label: 'Test', id: 'test' },
    //     },
    //     {
    //       _id: expect.any(String),
    //       language: 'en',
    //       key: 'key',
    //       value: 'value',
    //       context: { type: 'test', label: 'Test', id: 'test' },
    //     },
    //   ]);
    // });
  });
});
