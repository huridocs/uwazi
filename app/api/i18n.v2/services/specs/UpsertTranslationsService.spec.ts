import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { LanguageDoesNotExist } from '#api/i18n.v2/errors/translationErrors.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import testingDB, { DBFixture } from '#api/utils/testing_db.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { CreateTranslationsData } from '../CreateTranslationsService.js';
import { UpsertTranslationsService } from '../UpsertTranslationsService.js';
import { ValidateTranslationsService } from '../ValidateTranslationsService.js';

const collectionInDb = (collection = 'translationsV2') =>
  testingDB.mongodb?.collection(collection)!;

const createService = () => {
  const transactionManager = TransactionManagerFactory.default();
  return new UpsertTranslationsService(
    DefaultTranslationsDataSource(transactionManager),
    SettingsDataSourceFactory.default({ transactionManager }),
    new ValidateTranslationsService(
      DefaultTranslationsDataSource(transactionManager),
      SettingsDataSourceFactory.default({ transactionManager })
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

const context = (id: string, label = 'Template') =>
  ({ type: 'Entity' as const, label, id }) as const;

const getTranslations = async (contextId: string) =>
  collectionInDb().find({ 'context.id': contextId }).sort({ key: 1, language: 1 }).toArray();

const fixtures: DBFixture = {
  translationsV2: [
    createTranslationDBO('key', 'valor', 'es', context('test', 'Test')),
    createTranslationDBO('key', 'value', 'en', context('test', 'Test')),
    createTranslationDBO('key', '值', 'zh', context('test', 'Test')),
  ],
  settings: [
    {
      languages: [
        { default: true, label: 'English', key: 'en' },
        { label: 'Spanish', key: 'es' },
        { label: 'Chinese', key: 'zh' },
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
        translation({ language: 'zh', key: 'new key', value: '新键' }),
      ]);

      const translationsInDb = await collectionInDb().find({}).sort({ key: 1 }).toArray();

      expect(translationsInDb).toMatchObject([
        translation({ language: 'es', key: 'key', value: 'valor' }),
        translation({ language: 'en', key: 'key', value: 'updatedValue' }),
        translation({ language: 'zh', key: 'key', value: '值' }),
        translation({ language: 'es', key: 'new key', value: 'valor nuevo' }),
        translation({ language: 'en', key: 'new key', value: 'new value' }),
        translation({ language: 'zh', key: 'new key', value: '新键' }),
      ]);
    });

    it('should return persisted translations', async () => {
      const translations: CreateTranslationsData[] = [
        translation({ language: 'en', key: 'key', value: 'updatedValue' }),
        translation({ language: 'es', key: 'new key', value: 'valor nuevo' }),
        translation({ language: 'en', key: 'new key', value: 'new value' }),
        translation({ language: 'zh', key: 'new key', value: '新键' }),
      ];
      const createdTranslations = await createService().upsert(translations);

      expect(createdTranslations).toEqual(translations);
    });

    describe('when language does not exists as a configured language in settings', () => {
      it('should throw a validation error', async () => {
        const service = createService();
        await expect(
          service.upsert([
            translation({ language: 'fr' }),
            translation({ language: 'es' }),
            translation({ language: 'ar' }),
          ])
        ).rejects.toEqual(new LanguageDoesNotExist('["fr","ar"]'));
      });
    });
  });

  describe('updateContext()', () => {
    describe('when renaming a key that does not exist in the database', () => {
      it('should create the missing key with the value from the new key name', async () => {
        const ctx = context('template123');

        await collectionInDb().insertMany([
          createTranslationDBO('Property A', 'Property A', 'en', ctx),
          createTranslationDBO('Property A', 'Propiedad A', 'es', ctx),
          createTranslationDBO('Property A', '属性A', 'zh', ctx),
          createTranslationDBO('Property B', 'Property B', 'en', ctx),
          createTranslationDBO('Property B', 'Propiedad B', 'es', ctx),
          createTranslationDBO('Property B', '属性B', 'zh', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { 'Thematic pillar': 'Thematic Pillar' },
          {
            'Thematic Pillar': 'Thematic Pillar',
            'Property A': 'Property A',
            'Property B': 'Property B',
          },
          []
        );

        const allTranslations = await getTranslations('template123');

        expect(allTranslations.filter(t => t.key === 'Thematic Pillar')).toHaveLength(3);
        expect(allTranslations.filter(t => t.key === 'Thematic pillar')).toHaveLength(0);
      });

      it('should handle multiple renamed keys that are missing from the database', async () => {
        const ctx = context('template456');

        await collectionInDb().insertMany([
          createTranslationDBO('Existing Property', 'Existing Property', 'en', ctx),
          createTranslationDBO('Existing Property', 'Propiedad Existente', 'es', ctx),
          createTranslationDBO('Existing Property', '现有属性', 'zh', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { 'old name one': 'New Name One', 'old name two': 'New Name Two' },
          {
            'New Name One': 'New Name One',
            'New Name Two': 'New Name Two',
            'Existing Property': 'Existing Property',
          },
          []
        );

        const translationsInDb = await getTranslations('template456');

        expect(translationsInDb.filter(t => t.key === 'New Name One')).toHaveLength(3);
        expect(translationsInDb.filter(t => t.key === 'New Name Two')).toHaveLength(3);
        expect(translationsInDb.filter(t => t.key === 'old name one')).toHaveLength(0);
        expect(translationsInDb.filter(t => t.key === 'old name two')).toHaveLength(0);
      });
    });

    describe('when renaming a key would create a duplicate', () => {
      it('should keep existing key and delete the old key when rename target already exists', async () => {
        const ctx = context('template123', 'Person Template');

        await collectionInDb().insertMany([
          createTranslationDBO('Person', 'Person', 'en', ctx),
          createTranslationDBO('Person', 'Persona', 'es', ctx),
          createTranslationDBO('Title', 'Title', 'en', ctx),
          createTranslationDBO('Title', 'Título', 'es', ctx),
          createTranslationDBO('Name', 'Name', 'en', ctx),
          createTranslationDBO('Name', 'Nombre', 'es', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { Title: 'Person' },
          { Person: 'Person', Name: 'Name' },
          []
        );

        const translations = await getTranslations('template123');

        expect(translations.filter(t => t.key === 'Person')).toMatchObject([
          { key: 'Person', value: 'Person', language: 'en' },
          { key: 'Person', value: 'Persona', language: 'es' },
        ]);
        expect(translations.filter(t => t.key === 'Title')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'Name')).toHaveLength(2);
        expect(translations).toHaveLength(4);
      });

      it('should handle multiple key renames with deduplication', async () => {
        const ctx = context('template456', 'Test');

        await collectionInDb().insertMany([
          createTranslationDBO('Existing A', 'Existing A', 'en', ctx),
          createTranslationDBO('Existing A', 'Existente A', 'es', ctx),
          createTranslationDBO('Existing B', 'Existing B', 'en', ctx),
          createTranslationDBO('Existing B', 'Existente B', 'es', ctx),
          createTranslationDBO('Old A', 'Old A', 'en', ctx),
          createTranslationDBO('Old A', 'Viejo A', 'es', ctx),
          createTranslationDBO('Old B', 'Old B', 'en', ctx),
          createTranslationDBO('Old B', 'Viejo B', 'es', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { 'Old A': 'Existing A', 'Old B': 'New B' },
          { 'Existing A': 'Existing A', 'New B': 'New B', 'Existing B': 'Existing B' },
          []
        );

        const translations = await getTranslations('template456');

        expect(translations.filter(t => t.key === 'Existing A')).toMatchObject([
          { key: 'Existing A', value: 'Existing A', language: 'en' },
          { key: 'Existing A', value: 'Existente A', language: 'es' },
        ]);
        expect(translations.filter(t => t.key === 'Old A')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'New B')).toMatchObject([
          { key: 'New B', value: 'New B', language: 'en' },
          { key: 'New B', value: 'Viejo B', language: 'es' },
        ]);
        expect(translations).toHaveLength(6);
      });

      it('should allow renaming a key to itself (no-op)', async () => {
        const ctx = context('template789', 'Test');

        await collectionInDb().insertMany([
          createTranslationDBO('Property A', 'Property A', 'en', ctx),
          createTranslationDBO('Property A', 'Propiedad A', 'es', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { 'Property A': 'Property A' },
          { 'Property A': 'Property A' },
          []
        );

        const translations = await getTranslations('template789');

        expect(translations).toHaveLength(2);
        expect(translations).toMatchObject([
          { key: 'Property A', value: 'Property A', language: 'en' },
          { key: 'Property A', value: 'Propiedad A', language: 'es' },
        ]);
      });

      it('should allow same key in different contexts (deduplication is context-specific)', async () => {
        const contextA = context('templateA', 'Template A');
        const contextB = context('templateB', 'Template B');

        await collectionInDb().insertMany([
          createTranslationDBO('Person', 'Person', 'en', contextA),
          createTranslationDBO('Person', 'Persona', 'es', contextA),
          createTranslationDBO('Title', 'Title', 'en', contextB),
          createTranslationDBO('Title', 'Título', 'es', contextB),
        ]);

        await createService().updateContext(
          contextB,
          { Title: 'Person' },
          { Person: 'Person' },
          []
        );

        const translationsA = await getTranslations('templateA');
        const translationsB = await getTranslations('templateB');

        expect(translationsA).toHaveLength(2);
        expect(translationsA.filter(t => t.key === 'Person')).toHaveLength(2);
        expect(translationsB).toHaveLength(2);
        expect(translationsB.filter(t => t.key === 'Person')).toHaveLength(2);
        expect(translationsB.filter(t => t.key === 'Title')).toHaveLength(0);

        const allPersonTranslations = await collectionInDb().find({ key: 'Person' }).toArray();
        expect(allPersonTranslations).toHaveLength(4);
      });

      it('should delete old key even when rename is skipped due to collision', async () => {
        const ctx = context('template123', 'Title will be same');

        await collectionInDb().insertMany([
          createTranslationDBO('Title', 'Title', 'en', ctx),
          createTranslationDBO('Title', 'Title', 'es', ctx),
          createTranslationDBO('Title will be same', 'Title will be same', 'en', ctx),
          createTranslationDBO('Title will be same', 'Title will be same', 'es', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { Title: 'Title will be same' },
          { 'Title will be same': 'Title will be same' },
          ['Title']
        );

        const translations = await getTranslations('template123');

        expect(translations).toHaveLength(2);
        expect(translations.filter(t => t.key === 'Title')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'Title will be same')).toHaveLength(2);
      });

      it('should handle duplicate keys in keysToDelete and keyChanges gracefully', async () => {
        const ctx = context('template456', 'Test');

        await collectionInDb().insertMany([
          createTranslationDBO('Old Key', 'Old Key', 'en', ctx),
          createTranslationDBO('Old Key', 'Clave Vieja', 'es', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { 'Old Key': 'New Key' },
          { 'New Key': 'New Key' },
          ['Old Key']
        );

        const translations = await getTranslations('template456');

        expect(translations.filter(t => t.key === 'Old Key')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'New Key')).toMatchObject([
          { key: 'New Key', value: 'New Key', language: 'en' },
          { key: 'New Key', value: 'Clave Vieja', language: 'es' },
        ]);
      });

      it('should automatically delete old keys from renames without explicit keysToDelete', async () => {
        const ctx = context('template789', 'Test');

        await collectionInDb().insertMany([
          createTranslationDBO('Property A', 'Property A', 'en', ctx),
          createTranslationDBO('Property A', 'Propiedad A', 'es', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { 'Property A': 'Property B' },
          { 'Property B': 'Property B' },
          []
        );

        const translations = await getTranslations('template789');

        expect(translations.filter(t => t.key === 'Property A')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'Property B')).toMatchObject([
          { key: 'Property B', value: 'Property B', language: 'en' },
          { key: 'Property B', value: 'Propiedad A', language: 'es' },
        ]);
      });

      it('should not delete old key when it still exists in the context (valueChanges)', async () => {
        const ctx = context('template123', 'Template Name');

        await collectionInDb().insertMany([
          createTranslationDBO('Person', 'Person', 'en', ctx),
          createTranslationDBO('Person', 'Person', 'es', ctx),
          createTranslationDBO('Person', 'Person', 'zh', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { Person: 'PersonNew' },
          { Person: 'Person', PersonNew: 'PersonNew' },
          []
        );

        const translations = await getTranslations('template123');

        expect(translations).toHaveLength(6);
        expect(translations.filter(t => t.key === 'Person')).toHaveLength(3);
        expect(translations.filter(t => t.key === 'PersonNew')).toHaveLength(3);
      });

      it('should not delete key from keysToDelete if it still exists in context (valueChanges)', async () => {
        const ctx = context('template999', 'Test Template');

        await collectionInDb().insertMany([
          createTranslationDBO('SharedKey', 'SharedKey', 'en', ctx),
          createTranslationDBO('SharedKey', 'SharedKey', 'es', ctx),
          createTranslationDBO('OtherKey', 'OtherKey', 'en', ctx),
          createTranslationDBO('OtherKey', 'OtherKey', 'es', ctx),
        ]);

        await createService().updateContext(
          ctx,
          {},
          { SharedKey: 'SharedKey', OtherKey: 'OtherKey' },
          ['SharedKey']
        );

        const translations = await getTranslations('template999');

        expect(translations).toHaveLength(4);
        expect(translations.filter(t => t.key === 'SharedKey')).toHaveLength(2);
        expect(translations.filter(t => t.key === 'OtherKey')).toHaveLength(2);
      });
    });

    describe('multiple language operations', () => {
      it('should rename key across all languages, updating default language value and preserving non-default translations', async () => {
        const ctx = context('template-multilang', 'Multi-lang Template');

        await collectionInDb().insertMany([
          createTranslationDBO('Old Property', 'Old Property', 'en', ctx),
          createTranslationDBO('Old Property', 'Propiedad Vieja', 'es', ctx),
          createTranslationDBO('Old Property', '旧属性', 'zh', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { 'Old Property': 'New Property' },
          { 'New Property': 'New Property' },
          []
        );

        const translations = await getTranslations('template-multilang');

        expect(translations.filter(t => t.key === 'Old Property')).toHaveLength(0);

        const newKeyTranslations = translations.filter(t => t.key === 'New Property');
        expect(newKeyTranslations).toHaveLength(3);
        expect(newKeyTranslations.find(t => t.language === 'en')?.value).toBe('New Property');
        expect(newKeyTranslations.find(t => t.language === 'es')?.value).toBe('Propiedad Vieja');
        expect(newKeyTranslations.find(t => t.language === 'zh')?.value).toBe('旧属性');
      });

      it('should update default language value to new key name, preserve non-default language translations', async () => {
        const ctx = context('template-default-behavior');

        await collectionInDb().insertMany([
          createTranslationDBO('Original', 'Original', 'en', ctx),
          createTranslationDBO('Original', 'Original ES', 'es', ctx),
          createTranslationDBO('Original', 'Original ZH', 'zh', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { Original: 'Renamed' },
          { Renamed: 'Renamed' },
          []
        );

        const translations = await getTranslations('template-default-behavior');

        expect(translations).toHaveLength(3);
        expect(translations.find(t => t.language === 'en')).toMatchObject({
          key: 'Renamed',
          value: 'Renamed',
        });
        expect(translations.find(t => t.language === 'es')).toMatchObject({
          key: 'Renamed',
          value: 'Original ES',
        });
        expect(translations.find(t => t.language === 'zh')).toMatchObject({
          key: 'Renamed',
          value: 'Original ZH',
        });
      });
    });

    describe('empty and edge parameter cases', () => {
      it('should delete all keys when deletedKeys are all and valueChanges is empty', async () => {
        const ctx = context('template-empty-context', 'Empty Context');

        await collectionInDb().insertMany([
          createTranslationDBO('KeyA', 'KeyA', 'en', ctx),
          createTranslationDBO('KeyA', 'KeyA', 'es', ctx),
          createTranslationDBO('KeyB', 'KeyB', 'en', ctx),
          createTranslationDBO('KeyB', 'KeyB', 'es', ctx),
          createTranslationDBO('KeyC', 'KeyC', 'en', ctx),
          createTranslationDBO('KeyC', 'KeyC', 'es', ctx),
        ]);

        await createService().updateContext(ctx, {}, {}, ['KeyA', 'KeyB', 'KeyC']);

        const translations = await getTranslations('template-empty-context');
        expect(translations).toHaveLength(0);
      });

      it('should handle updateContext with all empty parameters (no-op)', async () => {
        const ctx = context('template-no-op', 'No-op Template');

        await collectionInDb().insertMany([
          createTranslationDBO('KeyA', 'ValueA', 'en', ctx),
          createTranslationDBO('KeyA', 'ValorA', 'es', ctx),
          createTranslationDBO('KeyB', 'ValueB', 'en', ctx),
          createTranslationDBO('KeyB', 'ValorB', 'es', ctx),
        ]);

        await createService().updateContext(ctx, {}, { KeyA: 'KeyA', KeyB: 'KeyB' }, []);

        const translations = await getTranslations('template-no-op');

        expect(translations).toHaveLength(4);
        expect(translations).toMatchObject([
          { key: 'KeyA', value: 'ValueA', language: 'en' },
          { key: 'KeyA', value: 'ValorA', language: 'es' },
          { key: 'KeyB', value: 'ValueB', language: 'en' },
          { key: 'KeyB', value: 'ValorB', language: 'es' },
        ]);
      });

      it('should add new keys when only valueChanges contains new entries', async () => {
        const ctx = context('template-add-keys', 'Add Keys Template');

        await collectionInDb().insertMany([
          createTranslationDBO('Existing', 'Existing', 'en', ctx),
          createTranslationDBO('Existing', 'Existente', 'es', ctx),
          createTranslationDBO('Existing', '现有', 'zh', ctx),
        ]);

        await createService().updateContext(
          ctx,
          {},
          { Existing: 'Existing', NewKey: 'NewKey' },
          []
        );

        const translations = await getTranslations('template-add-keys');

        expect(translations).toHaveLength(6);
        expect(translations.filter(t => t.key === 'Existing')).toHaveLength(3);
        expect(translations.filter(t => t.key === 'NewKey')).toHaveLength(3);
      });
    });

    describe('complex collision scenarios', () => {
      it('should handle chain renames when intermediate keys exist', async () => {
        const ctx = context('template-chain', 'Chain Template');

        await collectionInDb().insertMany([
          createTranslationDBO('A', 'A', 'en', ctx),
          createTranslationDBO('A', 'A ES', 'es', ctx),
          createTranslationDBO('B', 'B', 'en', ctx),
          createTranslationDBO('B', 'B ES', 'es', ctx),
          createTranslationDBO('C', 'C', 'en', ctx),
          createTranslationDBO('C', 'C ES', 'es', ctx),
        ]);

        await createService().updateContext(ctx, { A: 'B', B: 'C' }, { C: 'C' }, []);

        const translations = await getTranslations('template-chain');

        expect(translations.filter(t => t.key === 'A')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'B')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'C')).toMatchObject([
          { key: 'C', value: 'C', language: 'en' },
          { key: 'C', value: 'C ES', language: 'es' },
        ]);
      });

      it('should handle circular rename attempts', async () => {
        const ctx = context('template-circular', 'Circular Template');

        await collectionInDb().insertMany([
          createTranslationDBO('A', 'Value A', 'en', ctx),
          createTranslationDBO('A', 'Valor A', 'es', ctx),
          createTranslationDBO('B', 'Value B', 'en', ctx),
          createTranslationDBO('B', 'Valor B', 'es', ctx),
        ]);

        await createService().updateContext(ctx, { A: 'B', B: 'A' }, { A: 'A', B: 'B' }, []);

        const translations = await getTranslations('template-circular');

        expect(translations).toHaveLength(4);
        expect(translations.filter(t => t.key === 'A')).toHaveLength(2);
        expect(translations.filter(t => t.key === 'A')).toMatchObject([
          { key: 'A', value: 'Value A', language: 'en' },
          { key: 'A', value: 'Valor A', language: 'es' },
        ]);
        expect(translations.filter(t => t.key === 'B')).toHaveLength(2);
        expect(translations.filter(t => t.key === 'B')).toMatchObject([
          { key: 'B', value: 'Value B', language: 'en' },
          { key: 'B', value: 'Valor B', language: 'es' },
        ]);
      });

      it('should handle multiple keys renamed to same target (creates new key)', async () => {
        const ctx = context('template-multiple-to-one', 'Multiple to One Template');

        await collectionInDb().insertMany([
          createTranslationDBO('PropA', 'PropA', 'en', ctx),
          createTranslationDBO('PropA', 'PropA ES', 'es', ctx),
          createTranslationDBO('PropA', 'PropA ZH', 'zh', ctx),
          createTranslationDBO('PropB', 'PropB', 'en', ctx),
          createTranslationDBO('PropB', 'PropB ES', 'es', ctx),
          createTranslationDBO('PropB', 'PropB ZH', 'zh', ctx),
          createTranslationDBO('PropC', 'PropC', 'en', ctx),
          createTranslationDBO('PropC', 'PropC ES', 'es', ctx),
          createTranslationDBO('PropC', 'PropC ZH', 'zh', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { PropA: 'Unified', PropB: 'Unified' },
          { Unified: 'Unified', PropC: 'PropC' },
          []
        );

        const translations = await getTranslations('template-multiple-to-one');

        expect(translations.filter(t => t.key === 'PropA')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'PropB')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'PropC')).toHaveLength(3);
        expect(translations.filter(t => t.key === 'Unified')).toMatchObject([
          { key: 'Unified', value: 'Unified', language: 'en' },
          { key: 'Unified', value: 'Unified', language: 'es' },
          { key: 'Unified', value: 'Unified', language: 'zh' },
        ]);
      });
    });

    describe('valueChanges protection edge cases', () => {
      it('should create keys that exist in valueChanges but not in database', async () => {
        const ctx = context('template-pure-addition', 'Pure Addition Template');

        await createService().updateContext(
          ctx,
          {},
          { NewKey1: 'NewKey1', NewKey2: 'NewKey2' },
          []
        );

        const translations = await getTranslations('template-pure-addition');

        expect(translations).toHaveLength(6);
        expect(translations.filter(t => t.key === 'NewKey1')).toHaveLength(3);
        expect(translations.filter(t => t.key === 'NewKey2')).toHaveLength(3);
      });

      it('should preserve keys in database that are not in valueChanges or keysToDelete', async () => {
        const ctx = context('template-orphaned', 'Orphaned Template');

        await collectionInDb().insertMany([
          createTranslationDBO('KeyA', 'KeyA', 'en', ctx),
          createTranslationDBO('KeyA', 'KeyA', 'es', ctx),
          createTranslationDBO('KeyB', 'KeyB', 'en', ctx),
          createTranslationDBO('KeyB', 'KeyB', 'es', ctx),
          createTranslationDBO('KeyC', 'KeyC', 'en', ctx),
          createTranslationDBO('KeyC', 'KeyC', 'es', ctx),
        ]);

        await createService().updateContext(ctx, {}, { KeyA: 'KeyA', KeyB: 'KeyB' }, []);

        const translations = await getTranslations('template-orphaned');

        expect(translations).toHaveLength(6);
        expect(translations.filter(t => t.key === 'KeyA')).toHaveLength(2);
        expect(translations.filter(t => t.key === 'KeyB')).toHaveLength(2);
        expect(translations.filter(t => t.key === 'KeyC')).toHaveLength(2);
      });
    });

    describe('special characters and edge values', () => {
      it('should handle empty string keys and values', async () => {
        const ctx = context('template-empty-strings', 'Empty Strings Template');

        await createService().updateContext(ctx, {}, { '': 'EmptyKey', ValidKey: '' }, []);

        const translations = await getTranslations('template-empty-strings');

        expect(translations.length).toBeGreaterThan(0);

        const emptyKeyTranslations = translations.filter(t => t.key === '');
        const validKeyTranslations = translations.filter(t => t.key === 'ValidKey');

        expect(emptyKeyTranslations.length).toBeGreaterThan(0);
        expect(validKeyTranslations.length).toBeGreaterThan(0);
        expect(validKeyTranslations.every(t => t.value === '')).toBe(true);
      });

      it('should handle special characters in translation keys', async () => {
        const ctx = context('template-special-chars', 'Special Chars Template');

        await collectionInDb().insertMany([
          createTranslationDBO('Key@Symbol', 'Key@Symbol', 'en', ctx),
          createTranslationDBO('Key@Symbol', 'Key@Symbol ES', 'es', ctx),
          createTranslationDBO('Key@Symbol', 'Key@Symbol ZH', 'zh', ctx),
          createTranslationDBO('Key#Hash', 'Key#Hash', 'en', ctx),
          createTranslationDBO('Key#Hash', 'Key#Hash ES', 'es', ctx),
          createTranslationDBO('Key#Hash', 'Key#Hash ZH', 'zh', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { 'Key@Symbol': 'Renamed@Key' },
          { 'Renamed@Key': 'Renamed@Key', 'Key#Hash': 'Key#Hash', Key$Dollar: 'Key$Dollar' },
          []
        );

        const translations = await getTranslations('template-special-chars');

        expect(translations.filter(t => t.key === 'Key@Symbol')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'Renamed@Key')).toMatchObject([
          { key: 'Renamed@Key', value: 'Renamed@Key', language: 'en' },
          { key: 'Renamed@Key', value: 'Key@Symbol ES', language: 'es' },
          { key: 'Renamed@Key', value: 'Key@Symbol ZH', language: 'zh' },
        ]);
        expect(translations.filter(t => t.key === 'Key#Hash')).toHaveLength(3);
        expect(translations.filter(t => t.key === 'Key$Dollar')).toHaveLength(3);
      });

      it('should handle keys with leading/trailing whitespace correctly', async () => {
        const ctx = context('template-whitespace', 'Whitespace Template');

        await collectionInDb().insertMany([
          createTranslationDBO('  Spaces  ', '  Spaces  ', 'en', ctx),
          createTranslationDBO('  Spaces  ', '  Spaces  ES', 'es', ctx),
        ]);

        await createService().updateContext(
          ctx,
          { '  Spaces  ': 'NoSpaces' },
          { NoSpaces: 'NoSpaces' },
          []
        );

        const translations = await getTranslations('template-whitespace');

        expect(translations.filter(t => t.key === '  Spaces  ')).toHaveLength(0);
        expect(translations.filter(t => t.key === 'NoSpaces')).toMatchObject([
          { key: 'NoSpaces', value: 'NoSpaces', language: 'en' },
          { key: 'NoSpaces', value: '  Spaces  ES', language: 'es' },
        ]);
      });
    });
  });
});
