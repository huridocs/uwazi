import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { LanguageDoesNotExist } from 'api/i18n.v2/errors/translationErrors';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { CreateTranslationsData } from '../CreateTranslationsService';
import { UpsertTranslationsService } from '../UpsertTranslationsService';
import { ValidateTranslationsService } from '../ValidateTranslationsService';

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

    describe('when renaming a key would create a duplicate', () => {
      it('should keep existing key and delete the old key when rename target already exists', async () => {
        const contextId = 'template123';
        const context = { type: 'Entity' as const, label: 'Person Template', id: contextId };

        // Initial state: Template name "Person" + Title "Title" + Property "Name"
        await collectionInDb().insertMany([
          createTranslationDBO('Person', 'Person', 'en', context),
          createTranslationDBO('Person', 'Persona', 'es', context),
          createTranslationDBO('Title', 'Title', 'en', context),
          createTranslationDBO('Title', 'Título', 'es', context),
          createTranslationDBO('Name', 'Name', 'en', context),
          createTranslationDBO('Name', 'Nombre', 'es', context),
        ]);

        // Simulate: title property label renamed from "Title" to "Person"
        // This happens when user changes title property label to match template name
        await createService().updateContext(
          context,
          { Title: 'Person' }, // keyChanges: rename Title → Person (would create duplicate!)
          {
            Person: 'Person', // valueChanges: all current property labels
            Name: 'Name',
          },
          [] // keysToDelete
        );

        const translations = await collectionInDb()
          .find({ 'context.id': contextId })
          .sort({ key: 1, language: 1 })
          .toArray();

        // Expected: "Person" stays (original template name with original translations)
        const personTranslations = translations.filter(t => t.key === 'Person');
        expect(personTranslations).toHaveLength(2);
        expect(personTranslations).toMatchObject([
          { key: 'Person', value: 'Person', language: 'en' },
          { key: 'Person', value: 'Persona', language: 'es' },
        ]);

        // Expected: "Title" is deleted (rename was skipped because target exists)
        const titleTranslations = translations.filter(t => t.key === 'Title');
        expect(titleTranslations).toHaveLength(0);

        // Expected: "Name" unchanged
        const nameTranslations = translations.filter(t => t.key === 'Name');
        expect(nameTranslations).toHaveLength(2);
        expect(nameTranslations).toMatchObject([
          { key: 'Name', value: 'Name', language: 'en' },
          { key: 'Name', value: 'Nombre', language: 'es' },
        ]);

        // Total: only 4 translations (2 for "Person", 2 for "Name")
        expect(translations).toHaveLength(4);
      });

      it('should handle multiple key renames with deduplication', async () => {
        const contextId = 'template456';
        const context = { type: 'Entity' as const, label: 'Test', id: contextId };

        await collectionInDb().insertMany([
          createTranslationDBO('Existing A', 'Existing A', 'en', context),
          createTranslationDBO('Existing A', 'Existente A', 'es', context),
          createTranslationDBO('Existing B', 'Existing B', 'en', context),
          createTranslationDBO('Existing B', 'Existente B', 'es', context),
          createTranslationDBO('Old A', 'Old A', 'en', context),
          createTranslationDBO('Old A', 'Viejo A', 'es', context),
          createTranslationDBO('Old B', 'Old B', 'en', context),
          createTranslationDBO('Old B', 'Viejo B', 'es', context),
        ]);

        await createService().updateContext(
          context,
          {
            'Old A': 'Existing A', // Would create duplicate - skip this rename
            'Old B': 'New B', // Normal rename - no conflict
          },
          {
            'Existing A': 'Existing A',
            'New B': 'New B',
            'Existing B': 'Existing B',
          },
          []
        );

        const translations = await collectionInDb()
          .find({ 'context.id': contextId })
          .sort({ key: 1, language: 1 })
          .toArray();

        // "Existing A" preserved (original), "Old A" deleted
        expect(translations.filter(t => t.key === 'Existing A')).toHaveLength(2);
        expect(translations.filter(t => t.key === 'Existing A')).toMatchObject([
          { key: 'Existing A', value: 'Existing A', language: 'en' },
          { key: 'Existing A', value: 'Existente A', language: 'es' },
        ]);
        expect(translations.filter(t => t.key === 'Old A')).toHaveLength(0);

        // "Old B" → "New B" renamed successfully (no conflict)
        expect(translations.filter(t => t.key === 'New B')).toHaveLength(2);
        expect(translations.filter(t => t.key === 'New B')).toMatchObject([
          { key: 'New B', value: 'New B', language: 'en' }, // Default language gets new key as value
          { key: 'New B', value: 'Viejo B', language: 'es' }, // Non-default keeps original translation
        ]);
        expect(translations.filter(t => t.key === 'Old B')).toHaveLength(0);

        // "Existing B" unchanged
        expect(translations.filter(t => t.key === 'Existing B')).toHaveLength(2);

        // Total: 6 translations
        expect(translations).toHaveLength(6);
      });

      it('should allow renaming a key to itself (no-op)', async () => {
        const contextId = 'template789';
        const context = { type: 'Entity' as const, label: 'Test', id: contextId };

        await collectionInDb().insertMany([
          createTranslationDBO('Property A', 'Property A', 'en', context),
          createTranslationDBO('Property A', 'Propiedad A', 'es', context),
        ]);

        // Rename to itself - should be allowed and preserve existing translations
        await createService().updateContext(
          context,
          { 'Property A': 'Property A' }, // Rename to itself
          { 'Property A': 'Property A' },
          []
        );

        const translations = await collectionInDb().find({ 'context.id': contextId }).toArray();

        expect(translations).toHaveLength(2);
        expect(translations.filter(t => t.key === 'Property A')).toMatchObject([
          { key: 'Property A', value: 'Property A', language: 'en' },
          { key: 'Property A', value: 'Propiedad A', language: 'es' },
        ]);
      });

      it('should allow same key in different contexts (deduplication is context-specific)', async () => {
        const contextA = { type: 'Entity' as const, label: 'Template A', id: 'templateA' };
        const contextB = { type: 'Entity' as const, label: 'Template B', id: 'templateB' };

        // Context A has "Person" key
        // Context B has "Title" key
        await collectionInDb().insertMany([
          createTranslationDBO('Person', 'Person', 'en', contextA),
          createTranslationDBO('Person', 'Persona', 'es', contextA),
          createTranslationDBO('Title', 'Title', 'en', contextB),
          createTranslationDBO('Title', 'Título', 'es', contextB),
        ]);

        // Rename "Title" → "Person" in Context B
        // This should succeed even though "Person" exists in Context A
        await createService().updateContext(
          contextB,
          { Title: 'Person' }, // Rename Title → Person
          { Person: 'Person' },
          []
        );

        const translationsA = await collectionInDb()
          .find({ 'context.id': 'templateA' })
          .sort({ key: 1, language: 1 })
          .toArray();
        const translationsB = await collectionInDb()
          .find({ 'context.id': 'templateB' })
          .sort({ key: 1, language: 1 })
          .toArray();

        // Context A still has "Person" (unchanged)
        expect(translationsA).toHaveLength(2);
        expect(translationsA.filter(t => t.key === 'Person')).toHaveLength(2);
        expect(translationsA).toMatchObject([
          { key: 'Person', value: 'Person', language: 'en', context: contextA },
          { key: 'Person', value: 'Persona', language: 'es', context: contextA },
        ]);

        // Context B now has "Person" (renamed from "Title")
        expect(translationsB).toHaveLength(2);
        expect(translationsB.filter(t => t.key === 'Person')).toHaveLength(2);
        expect(translationsB.filter(t => t.key === 'Title')).toHaveLength(0);
        expect(translationsB).toMatchObject([
          { key: 'Person', value: 'Person', language: 'en', context: contextB },
          { key: 'Person', value: 'Título', language: 'es', context: contextB },
        ]);

        // Verify total: Both contexts have a "Person" key (no cross-context collision)
        const allPersonTranslations = await collectionInDb().find({ key: 'Person' }).toArray();
        expect(allPersonTranslations).toHaveLength(4); // 2 from contextA + 2 from contextB
      });

      it('should delete old key even when rename is skipped due to collision', async () => {
        const contextId = 'template123';
        const context = {
          type: 'Entity' as const,
          label: 'Title will be same',
          id: contextId,
        };

        await collectionInDb().insertMany([
          createTranslationDBO('Title', 'Title', 'en', context),
          createTranslationDBO('Title', 'Title', 'es', context),
          createTranslationDBO('Title will be same', 'Title will be same', 'en', context),
          createTranslationDBO('Title will be same', 'Title will be same', 'es', context),
        ]);

        await createService().updateContext(
          context,
          { Title: 'Title will be same' },
          { 'Title will be same': 'Title will be same' },
          ['Title']
        );

        const translations = await collectionInDb()
          .find({ 'context.id': contextId })
          .sort({ key: 1, language: 1 })
          .toArray();

        expect(translations).toHaveLength(2);
        expect(translations.filter(t => t.key === 'Title')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'Title will be same')).toHaveLength(2);

        expect(translations).toMatchObject([
          { key: 'Title will be same', value: 'Title will be same', language: 'en' },
          { key: 'Title will be same', value: 'Title will be same', language: 'es' },
        ]);
      });

      it('should handle duplicate keys in keysToDelete and keyChanges gracefully', async () => {
        const contextId = 'template456';
        const context = { type: 'Entity' as const, label: 'Test', id: contextId };

        await collectionInDb().insertMany([
          createTranslationDBO('Old Key', 'Old Key', 'en', context),
          createTranslationDBO('Old Key', 'Clave Vieja', 'es', context),
        ]);

        await createService().updateContext(
          context,
          { 'Old Key': 'New Key' },
          { 'New Key': 'New Key' },
          ['Old Key']
        );

        const translations = await collectionInDb().find({ 'context.id': contextId }).toArray();

        expect(translations.filter(t => t.key === 'Old Key')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'New Key')).toHaveLength(2);
        expect(translations.filter(t => t.key === 'New Key')).toMatchObject([
          { key: 'New Key', value: 'New Key', language: 'en' },
          { key: 'New Key', value: 'Clave Vieja', language: 'es' },
        ]);
      });

      it('should automatically delete old keys from renames without explicit keysToDelete', async () => {
        const contextId = 'template789';
        const context = { type: 'Entity' as const, label: 'Test', id: contextId };

        await collectionInDb().insertMany([
          createTranslationDBO('Property A', 'Property A', 'en', context),
          createTranslationDBO('Property A', 'Propiedad A', 'es', context),
        ]);

        // Don't pass "Property A" in keysToDelete - it should still be deleted
        await createService().updateContext(
          context,
          { 'Property A': 'Property B' }, // Rename
          { 'Property B': 'Property B' },
          [] // Empty - don't explicitly request deletion
        );

        const translations = await collectionInDb().find({ 'context.id': contextId }).toArray();

        // "Property A" should be gone even though not in keysToDelete
        expect(translations.filter(t => t.key === 'Property A')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'Property B')).toHaveLength(2);
        expect(translations.filter(t => t.key === 'Property B')).toMatchObject([
          { key: 'Property B', value: 'Property B', language: 'en' },
          { key: 'Property B', value: 'Propiedad A', language: 'es' },
        ]);
      });

      it('should not delete old key when it still exists in the context (valueChanges)', async () => {
        const contextId = 'template123';
        const context = {
          type: 'Entity' as const,
          label: 'Template Name',
          id: contextId,
        };

        await collectionInDb().insertMany([
          createTranslationDBO('Person', 'Person', 'en', context),
          createTranslationDBO('Person', 'Person', 'es', context),
        ]);

        await createService().updateContext(
          context,
          { Person: 'PersonNew' },
          { Person: 'Person', PersonNew: 'PersonNew' },
          []
        );

        const translations = await collectionInDb()
          .find({ 'context.id': contextId })
          .sort({ key: 1, language: 1 })
          .toArray();

        expect(translations).toHaveLength(4);

        expect(translations[0]).toMatchObject({
          key: 'Person',
          value: 'Person',
          language: 'en',
        });
        expect(translations[1]).toMatchObject({
          key: 'Person',
          value: 'Person',
          language: 'es',
        });

        expect(translations[2]).toMatchObject({
          key: 'PersonNew',
          value: 'PersonNew',
          language: 'en',
        });
        expect(translations[3]).toMatchObject({
          key: 'PersonNew',
          value: 'PersonNew',
          language: 'es',
        });
      });

      it('should not delete key from keysToDelete if it still exists in context (valueChanges)', async () => {
        const contextId = 'template999';
        const context = {
          type: 'Entity' as const,
          label: 'Test Template',
          id: contextId,
        };

        await collectionInDb().insertMany([
          createTranslationDBO('SharedKey', 'SharedKey', 'en', context),
          createTranslationDBO('SharedKey', 'SharedKey', 'es', context),
          createTranslationDBO('OtherKey', 'OtherKey', 'en', context),
          createTranslationDBO('OtherKey', 'OtherKey', 'es', context),
        ]);

        await createService().updateContext(
          context,
          {},
          { SharedKey: 'SharedKey', OtherKey: 'OtherKey' },
          ['SharedKey']
        );

        const translations = await collectionInDb()
          .find({ 'context.id': contextId })
          .sort({ key: 1, language: 1 })
          .toArray();

        expect(translations).toHaveLength(4);

        expect(translations.filter(t => t.key === 'SharedKey')).toHaveLength(2);
        expect(translations.filter(t => t.key === 'OtherKey')).toHaveLength(2);

        expect(translations).toMatchObject([
          { key: 'OtherKey', value: 'OtherKey', language: 'en' },
          { key: 'OtherKey', value: 'OtherKey', language: 'es' },
          { key: 'SharedKey', value: 'SharedKey', language: 'en' },
          { key: 'SharedKey', value: 'SharedKey', language: 'es' },
        ]);
      });
    });
  });
});
