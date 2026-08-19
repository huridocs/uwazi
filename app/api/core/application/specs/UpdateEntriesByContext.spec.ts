import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { UpdateEntriesByContextUseCaseFactory } from '#api/core/infrastructure/factories/UpdateEntriesByContextUseCaseFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

const factory = getFixturesFactory();
const createTranslationDBO = factory.v2.database.translationDBO;
const contextId = 'ctx-entity';
const context = { id: contextId, label: 'Template', type: 'Entity' as const };

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  translationsV2: [
    createTranslationDBO('Title', 'Title', 'en', context),
    createTranslationDBO('Title', 'Título', 'es', context),
    createTranslationDBO('Name', 'Name', 'en', context),
    createTranslationDBO('Name', 'Nombre', 'es', context),
  ],
};

describe('UpdateEntriesByContextUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  it('should update values across locales for one context in a single transaction', async () => {
    await testingEnvironment.runWithContext(async () => {
      const result = await UpdateEntriesByContextUseCaseFactory.default().execute({
        contextId,
        keyValuePairsPerLanguage: {
          en: { Title: 'Title EN', Name: 'Name EN' },
          es: { Title: 'Título ES', Name: 'Nombre ES' },
        },
      });

      expect(result).toHaveLength(2);

      const rows = await TranslationsDataSourceFactory.default({
        transactionManager: TransactionManagerFactory.default(),
      }).getByContext(contextId);

      expect(rows.map(r => `${r.language}:${r.key}:${r.value}`).sort()).toEqual([
        'en:Name:Name EN',
        'en:Title:Title EN',
        'es:Name:Nombre ES',
        'es:Title:Título ES',
      ]);
    });
  });

  it('should reject updates for keys that do not exist in the context', async () => {
    await testingEnvironment.runWithContext(async () => {
      await expect(
        UpdateEntriesByContextUseCaseFactory.default().execute({
          contextId,
          keyValuePairsPerLanguage: {
            en: { Missing: 'nope' },
          },
        })
      ).rejects.toThrow(/missing translation keys/);
    });
  });

  it('should ignore languages that are not installed', async () => {
    await testingEnvironment.runWithContext(async () => {
      await UpdateEntriesByContextUseCaseFactory.default().execute({
        contextId,
        keyValuePairsPerLanguage: {
          en: { Title: 'Only EN' },
          fr: { Title: 'Ignored' },
        },
      });

      const rows = await TranslationsDataSourceFactory.default({
        transactionManager: TransactionManagerFactory.default(),
      }).getByContext(contextId);

      expect(rows.find(r => r.language === 'en' && r.key === 'Title')?.value).toBe('Only EN');
      expect(rows.find(r => r.language === 'es' && r.key === 'Title')?.value).toBe('Título');
      expect(rows.some(r => r.language === 'fr')).toBe(false);
    });
  });
});
