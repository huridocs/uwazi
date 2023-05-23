import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { LanguageDoesNotExist } from 'api/i18n.v2/errors/translationErrors';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { MongoTranslationsDataSource } from '../../database/MongoTranslationsDataSource';
import { UpsertTranslationsService } from '../UpsertTranslationsService';

const collectionInDb = (collection = 'translations_v2') =>
  testingDB.mongodb?.collection(collection)!;

const createService = () =>
  new UpsertTranslationsService(
    new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient())),
    new MongoSettingsDataSource(getConnection(), new MongoTransactionManager(getClient())),
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

    describe('when language does not exists as a configured language in settings', () => {
      it('should throw a validation error', async () => {
        const service = createService();
        await expect(
          service.upsert([
            {
              language: 'does not exist',
              key: 'clave',
              value: 'valor',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
            {
              language: 'es',
              key: 'clave',
              value: 'valor',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
            {
              language: 'no',
              key: 'clave',
              value: 'valor',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
          ])
        ).rejects.toEqual(new LanguageDoesNotExist('["does not exist","no"]'));
      });
    });
  });
});
