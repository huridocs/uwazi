import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DuplicatedKeyError } from 'api/common.v2/errors/DuplicatedKeyError';
import {
  LanguageDoesNotExist,
  TranslationMissingLanguages,
} from 'api/i18n.v2/errors/translationErrors';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { MongoTranslationsDataSource } from '../../database/MongoTranslationsDataSource';
import migration from '../../migrations/index';
import { CreateTranslationsService } from '../CreateTranslationsService';

const collectionInDb = (collection = 'translations_v2') =>
  testingDB.mongodb?.collection(collection)!;

const createService = () =>
  new CreateTranslationsService(
    new MongoTranslationsDataSource(
      getConnection(),
      new MongoSettingsDataSource(getConnection(), new MongoTransactionManager(getClient())),
      new MongoTransactionManager(getClient())
    ),
    new MongoSettingsDataSource(getConnection(), new MongoTransactionManager(getClient())),
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
  await migration.createIndex(testingDB.mongodb);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

const createTranslationsThroughService = async () => {
  const service = createService();
  return service.create([
    {
      language: 'es',
      key: 'key',
      value: 'valor',
      context: { type: 'Entity', label: 'Test', id: 'test' },
    },
    {
      language: 'en',
      key: 'key',
      value: 'value',
      context: { type: 'Entity', label: 'Test', id: 'test' },
    },
  ]);
};

describe('CreateTranslationsService', () => {
  describe('create()', () => {
    it('should persist new translations', async () => {
      await createTranslationsThroughService();

      const translationsInDb = await collectionInDb().find({}).sort({ _id: 1 }).toArray();

      expect(translationsInDb).toEqual([
        {
          _id: expect.any(ObjectId),
          language: 'es',
          key: 'key',
          value: 'valor',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
        {
          _id: expect.any(ObjectId),
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
      ]);
    });

    it('should return persisted translations', async () => {
      const translations = await createTranslationsThroughService();

      expect(translations).toEqual([
        {
          language: 'es',
          key: 'key',
          value: 'valor',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'Entity', label: 'Test', id: 'test' },
        },
      ]);
    });
    describe('when language does not exists as a configured language in settings', () => {
      it('should throw a validation error', async () => {
        const service = createService();
        await expect(
          service.create([
            {
              language: 'does not exist',
              key: 'key',
              value: 'valor',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
            {
              language: 'es',
              key: 'key',
              value: 'valor',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
            {
              language: 'no',
              key: 'key',
              value: 'valor',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
          ])
        ).rejects.toEqual(new LanguageDoesNotExist('["does not exist","no"]'));
      });
    });

    describe('when translations will produce a state where keys are not in all languages', () => {
      it('should throw a validation error', async () => {
        await testingEnvironment.setUp({
          ...fixtures,
          translations_v2: [
            {
              language: 'en',
              key: 'existing_key',
              value: 'value',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
          ],
        });
        const service = createService();
        await expect(
          service.create([
            {
              language: 'es',
              key: 'existing_key',
              value: 'valor',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
            {
              language: 'en',
              key: 'key',
              value: 'value',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
            {
              language: 'en',
              key: 'key 2',
              value: 'value 2',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
          ])
        ).rejects.toEqual(
          new TranslationMissingLanguages(
            'the following key/context combination are missing translations\nkey: key, context: test, languages missing: es\nkey: key 2, context: test, languages missing: es'
          )
        );
      });
    });
  });

  describe('when trying to create already existing translations', () => {
    it('should throw a validation error', async () => {
      await testingEnvironment.setUp({
        ...fixtures,
        translations_v2: [
          {
            language: 'en',
            key: 'existing_key',
            value: 'value',
            context: { type: 'Entity', label: 'Test', id: 'test' },
          },
          {
            language: 'es',
            key: 'existing_key',
            value: 'value',
            context: { type: 'Entity', label: 'Test', id: 'test' },
          },
        ],
      });
      const service = createService();
      await expect(
        service.create([
          {
            language: 'es',
            key: 'existing_key',
            value: 'valor',
            context: { type: 'Entity', label: 'Test', id: 'test' },
          },
        ])
      ).rejects.toBeInstanceOf(DuplicatedKeyError);
    });
  });
});
