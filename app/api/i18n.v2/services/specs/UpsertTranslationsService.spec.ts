import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';

import { LanguageDoesNotExist } from '#api/i18n.v2/errors/translationErrors.js';

import { getFixturesFactory } from '#api/utils/fixturesFactory.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import testingDB, { DBFixture } from '#api/utils/testing_db.js';

import { CreateTranslationsData } from '#api/i18n.v2/services/CreateTranslationsService.js';
import { UpsertTranslationsService } from '#api/i18n.v2/services/UpsertTranslationsService.js';
import { ValidateTranslationsService } from '#api/i18n.v2/services/ValidateTranslationsService.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';

const collectionInDb = (collection = 'translationsV2') =>
  testingDB.mongodb?.collection(collection)!;

const createService = () => {
  const transactionManager = TransactionManagerFactory.default();
  return new UpsertTranslationsService(
    DefaultTranslationsDataSource(transactionManager),
    SettingsDataSourceFactory.default(transactionManager),
    new ValidateTranslationsService(
      DefaultTranslationsDataSource(transactionManager),
      SettingsDataSourceFactory.default(transactionManager)
    ),
    transactionManager
  );
};

const translation = (translationData: Partial<CreateTranslationsData>): CreateTranslationsData => ({
  language: 'es',
  key: 'key',
  value: 'valor',
  context: { type: 'Entity', label: 'Test', id: 'test' },
  ...translationData,
});

const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;
const fixtures: DBFixture = {
  translationsV2: [
    createTranslationDBO('key', 'valor', 'es', { type: 'Entity', label: 'Test', id: 'test' }),
    createTranslationDBO('key', 'value', 'en', { type: 'Entity', label: 'Test', id: 'test' }),
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
        translation({ language: 'en', key: 'key', value: 'updatedValue' }),
        translation({ language: 'es', key: 'new key', value: 'valor nuevo' }),
        translation({ language: 'en', key: 'new key', value: 'new value' }),
      ]);

      const translationsInDb = await collectionInDb().find({}).sort({ key: 1 }).toArray();

      expect(translationsInDb).toMatchObject([
        translation({ language: 'es', key: 'key', value: 'valor' }),
        translation({ language: 'en', key: 'key', value: 'updatedValue' }),
        translation({ language: 'es', key: 'new key', value: 'valor nuevo' }),
        translation({ language: 'en', key: 'new key', value: 'new value' }),
      ]);
    });

    it('should return persisted translations', async () => {
      const translations: CreateTranslationsData[] = [
        translation({ language: 'en', key: 'key', value: 'updatedValue' }),
        translation({ language: 'es', key: 'new key', value: 'valor nuevo' }),
        translation({ language: 'en', key: 'new key', value: 'new value' }),
      ];
      const createdTranslations = await createService().upsert(translations);

      expect(createdTranslations).toEqual(translations);
    });

    describe('when language does not exists as a configured language in settings', () => {
      it('should throw a validation error', async () => {
        const service = createService();
        await expect(
          service.upsert([
            translation({ language: 'zh' }),
            translation({ language: 'es' }),
            translation({ language: 'ar' }),
          ])
        ).rejects.toEqual(new LanguageDoesNotExist('["zh","ar"]'));
      });
    });
  });

  describe('updateContext()', () => {
    describe('when renaming a key that does not exist in the database', () => {
      it('should create the missing key with the value from the new key name', async () => {
        const contextId = 'template123';
        const context = { type: 'Entity' as const, label: 'Template', id: contextId };

        await collectionInDb().insertMany([
          createTranslationDBO('Property A', 'Property A', 'en', context),
          createTranslationDBO('Property A', 'Propiedad A', 'es', context),
          createTranslationDBO('Property B', 'Property B', 'en', context),
          createTranslationDBO('Property B', 'Propiedad B', 'es', context),
        ]);

        await createService().updateContext(
          context,
          { 'Thematic pillar': 'Thematic Pillar' },
          {
            'Thematic Pillar': 'Thematic Pillar',
            'Property A': 'Property A',
            'Property B': 'Property B',
          },
          []
        );

        const allTranslations = await collectionInDb()
          .find({ 'context.id': contextId })
          .sort({ key: 1, language: 1 })
          .toArray();

        const newKeyTranslations = allTranslations.filter(t => t.key === 'Thematic Pillar');
        const oldKeyTranslations = allTranslations.filter(t => t.key === 'Thematic pillar');

        expect(newKeyTranslations).toHaveLength(2);
        expect(newKeyTranslations).toMatchObject([
          { key: 'Thematic Pillar', value: 'Thematic Pillar', language: 'en' },
          { key: 'Thematic Pillar', value: 'Thematic Pillar', language: 'es' },
        ]);

        expect(oldKeyTranslations).toHaveLength(0);
      });

      it('should handle multiple renamed keys that are missing from the database', async () => {
        const contextId = 'template456';
        const context = { type: 'Entity' as const, label: 'Template', id: contextId };

        await collectionInDb().insertMany([
          createTranslationDBO('Existing Property', 'Existing Property', 'en', context),
          createTranslationDBO('Existing Property', 'Propiedad Existente', 'es', context),
        ]);

        await createService().updateContext(
          context,
          {
            'old name one': 'New Name One',
            'old name two': 'New Name Two',
          },
          {
            'New Name One': 'New Name One',
            'New Name Two': 'New Name Two',
            'Existing Property': 'Existing Property',
          },
          []
        );

        const translationsInDb = await collectionInDb()
          .find({ 'context.id': contextId })
          .sort({ key: 1, language: 1 })
          .toArray();

        const newNameOneTranslations = translationsInDb.filter(t => t.key === 'New Name One');
        const newNameTwoTranslations = translationsInDb.filter(t => t.key === 'New Name Two');
        const oldNameOneTranslations = translationsInDb.filter(t => t.key === 'old name one');
        const oldNameTwoTranslations = translationsInDb.filter(t => t.key === 'old name two');

        expect(newNameOneTranslations).toHaveLength(2);
        expect(newNameOneTranslations).toMatchObject([
          { key: 'New Name One', value: 'New Name One', language: 'en' },
          { key: 'New Name One', value: 'New Name One', language: 'es' },
        ]);

        expect(newNameTwoTranslations).toHaveLength(2);
        expect(newNameTwoTranslations).toMatchObject([
          { key: 'New Name Two', value: 'New Name Two', language: 'en' },
          { key: 'New Name Two', value: 'New Name Two', language: 'es' },
        ]);

        expect(oldNameOneTranslations).toHaveLength(0);
        expect(oldNameTwoTranslations).toHaveLength(0);
      });
    });
  });
});
