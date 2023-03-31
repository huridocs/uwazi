import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { CreateTranslationsService } from '../CreateTranslationsService';
import { MongoTranslationsDataSource } from '../../database/MongoTranslationsDataSource';

const collectionInDb = (collection = 'translations_v2') =>
  testingDB.mongodb?.collection(collection)!;

const createService = () =>
  new CreateTranslationsService(
    new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient())),
    new MongoTransactionManager(getClient())
  );

const fixtures = {
  translations_v2: [],
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

const createTranslationsThroughService = async () => {
  const service = createService();
  return service.create([
    {
      language: 'es',
      key: 'clave',
      value: 'valor',
      context: { type: 'test', label: 'Test', id: 'test' },
    },
    {
      language: 'en',
      key: 'key',
      value: 'value',
      context: { type: 'test', label: 'Test', id: 'test' },
    },
  ]);
};

describe('create()', () => {
  describe('When the input is correct', () => {
    it('should persist new translations', async () => {
      await createTranslationsThroughService();

      const translationsInDb = await collectionInDb().find({}).sort({ _id: 1 }).toArray();

      expect(translationsInDb).toEqual([
        {
          _id: expect.any(ObjectId),
          language: 'es',
          key: 'clave',
          value: 'valor',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
        {
          _id: expect.any(ObjectId),
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
      ]);
    });

    it('should return persisted translations', async () => {
      const translations = await createTranslationsThroughService();

      expect(translations).toEqual([
        {
          language: 'es',
          key: 'clave',
          value: 'valor',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'test', label: 'Test', id: 'test' },
        },
      ]);
    });
  });
});
