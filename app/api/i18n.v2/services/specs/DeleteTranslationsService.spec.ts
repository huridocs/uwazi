import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { MongoTranslationsDataSource } from '../../database/MongoTranslationsDataSource';
import { DeleteTranslationsService } from '../DeleteTranslationsService';

const collectionInDb = (collection = 'translations_v2') =>
  testingDB.mongodb?.collection(collection)!;

const createService = () =>
  new DeleteTranslationsService(
    new MongoTranslationsDataSource(
      getConnection(),
      new MongoSettingsDataSource(getConnection(), new MongoTransactionManager(getClient())),
      new MongoTransactionManager(getClient())
    ),
    new MongoTransactionManager(getClient())
  );

const fixtures: DBFixture = {
  translations_v2: [
    {
      language: 'es',
      key: 'clave',
      value: 'valor',
      context: { type: 'test', label: 'Test', id: 'context1' },
    },
    {
      language: 'en',
      key: 'key',
      value: 'value',
      context: { type: 'test', label: 'Test', id: 'context1' },
    },
    {
      language: 'es',
      key: 'clave',
      value: 'valor',
      context: { type: 'test', label: 'Test', id: 'context2' },
    },
    {
      language: 'en',
      key: 'key',
      value: 'value',
      context: { type: 'test', label: 'Test', id: 'context2' },
    },
    {
      language: 'es',
      key: 'clave',
      value: 'valor',
      context: { type: 'test', label: 'Test', id: 'context3' },
    },
    {
      language: 'en',
      key: 'key',
      value: 'value',
      context: { type: 'test', label: 'Test', id: 'context3' },
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

describe('DeleteTranslationsService', () => {
  describe('deleteByContext()', () => {
    it('should delete all translations for a particular context', async () => {
      await createService().deleteByContextId('context2');

      const translationsInDb = await collectionInDb()
        .find({}, { projection: { _id: 0 } })
        .sort({ _id: 1 })
        .toArray();

      expect(translationsInDb).toMatchObject([
        {
          language: 'es',
          key: 'clave',
          value: 'valor',
          context: { type: 'test', label: 'Test', id: 'context1' },
        },
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'test', label: 'Test', id: 'context1' },
        },
        {
          language: 'es',
          key: 'clave',
          value: 'valor',
          context: { type: 'test', label: 'Test', id: 'context3' },
        },
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'test', label: 'Test', id: 'context3' },
        },
      ]);
    });
  });

  describe('deleteByLanguage', () => {
    it('should delete all translations for a particular context', async () => {
      await createService().deleteByLanguage('es');

      const translationsInDb = await collectionInDb()
        .find({}, { projection: { _id: 0 } })
        .sort({ _id: 1 })
        .toArray();

      expect(translationsInDb).toMatchObject([
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'test', label: 'Test', id: 'context1' },
        },
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'test', label: 'Test', id: 'context2' },
        },
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'test', label: 'Test', id: 'context3' },
        },
      ]);
    });
  });
});
