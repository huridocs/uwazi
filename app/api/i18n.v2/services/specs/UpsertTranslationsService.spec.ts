import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { UpsertTranslationsService } from '../UpsertTranslationsService';
import { MongoTranslationsDataSource } from '../../database/MongoTranslationsDataSource';

const collectionInDb = (collection = 'translations_v2') =>
  testingDB.mongodb?.collection(collection)!;

const createService = () =>
  new UpsertTranslationsService(
    new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient())),
    new MongoTransactionManager(getClient())
  );

const fixtures = {
  translations_v2: [
    {
      language: 'es',
      key: 'clave',
      value: 'valor',
      context: { type: 'Entity', label: 'Test', id: 'test' },
    },
    {
      language: 'en',
      key: 'key',
      value: 'value',
      context: { type: 'Entity', label: 'Test', id: 'test' },
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

describe('CreateTranslationsService', () => {
  describe('upsert()', () => {
    it('should persist new translations and update existing ones', async () => {
      await createService().upsert([
        {
          language: 'en',
          key: 'key',
          value: 'updatedValue',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
        {
          language: 'es',
          key: 'clave nueva',
          value: 'valor nuevo',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
        {
          language: 'es',
          key: 'clave nueva 2',
          value: 'valor nuevo 2',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
      ]);

      const translationsInDb = await collectionInDb().find({}).sort({ key: 1 }).toArray();

      expect(translationsInDb).toMatchObject([
        {
          language: 'es',
          key: 'clave',
          value: 'valor',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
        {
          language: 'es',
          key: 'clave nueva',
          value: 'valor nuevo',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
        {
          language: 'es',
          key: 'clave nueva 2',
          value: 'valor nuevo 2',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
        {
          language: 'en',
          key: 'key',
          value: 'updatedValue',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
      ]);
    });

    it('should return persisted translations', async () => {
      const translations = await createService().upsert([
        {
          language: 'en',
          key: 'key',
          value: 'updatedValue',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
        {
          language: 'es',
          key: 'clave nueva',
          value: 'valor nuevo',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
        {
          language: 'es',
          key: 'clave nueva 2',
          value: 'valor nuevo 2',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
      ]);

      expect(translations).toEqual([
        {
          language: 'en',
          key: 'key',
          value: 'updatedValue',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
        {
          language: 'es',
          key: 'clave nueva',
          value: 'valor nuevo',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
        {
          language: 'es',
          key: 'clave nueva 2',
          value: 'valor nuevo 2',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
      ]);
    });
  });
});
