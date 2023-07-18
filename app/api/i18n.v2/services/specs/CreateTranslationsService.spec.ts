import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import {
  LanguageDoesNotExist,
  TranslationMissingLanguages,
} from 'api/i18n.v2/errors/translationErrors';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { CreateTranslationsService } from '../CreateTranslationsService';
import { ValidateTranslationsService } from '../ValidateTranslationsService';

const collectionInDb = (collection = 'translationsV2') =>
  testingDB.mongodb?.collection(collection)!;

const createService = () => {
  const transactionManager = new MongoTransactionManager(getClient());
  return new CreateTranslationsService(
    DefaultTranslationsDataSource(transactionManager),
    new ValidateTranslationsService(
      DefaultTranslationsDataSource(transactionManager),
      DefaultSettingsDataSource(transactionManager)
    ),
    transactionManager
  );
};

const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;
const fixtures: DBFixture = {
  translationsV2: [],
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
              language: 'zh',
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
              language: 'ar',
              key: 'key',
              value: 'valor',
              context: { type: 'Entity', label: 'Test', id: 'test' },
            },
          ])
        ).rejects.toEqual(new LanguageDoesNotExist('["zh","ar"]'));
      });
    });

    describe('when translations will produce a state where keys are not in all languages', () => {
      it('should throw a validation error', async () => {
        await testingEnvironment.setUp({
          ...fixtures,
          translationsV2: [
            createTranslationDBO('existing_key', 'value', 'en', {
              type: 'Entity',
              label: 'Test',
              id: 'test',
            }),
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
});
