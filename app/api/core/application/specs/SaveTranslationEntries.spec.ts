import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { SaveTranslationEntriesUseCaseFactory } from '#api/core/infrastructure/factories/SaveTranslationEntriesUseCaseFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { Translation } from '#api/core/domain/translation/Translation.js';

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
  ],
};

describe('SaveTranslationEntriesUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  it('should update existing by-item entries atomically', async () => {
    await testingEnvironment.runWithContext(async () => {
      await SaveTranslationEntriesUseCaseFactory.default().execute({
        translations: [
          new Translation('Title', 'Title updated', 'en', context),
          new Translation('Title', 'Título actualizado', 'es', context),
        ],
      });

      const rows = await TranslationsDataSourceFactory.default({
        transactionManager: TransactionManagerFactory.default(),
      })
        .getByContext(contextId)
        .all();

      expect(rows.find(r => r.language === 'en')?.value).toBe('Title updated');
      expect(rows.find(r => r.language === 'es')?.value).toBe('Título actualizado');
    });
  });

  it('should create and update by-item entries in one transaction', async () => {
    await testingEnvironment.runWithContext(async () => {
      await SaveTranslationEntriesUseCaseFactory.default().execute({
        translations: [
          new Translation('Title', 'Title', 'en', context),
          new Translation('Title', 'Título', 'es', context),
          new Translation('Subtitle', 'Subtitle', 'en', context),
          new Translation('Subtitle', 'Subtítulo', 'es', context),
        ],
      });

      const rows = await TranslationsDataSourceFactory.default({
        transactionManager: TransactionManagerFactory.default(),
      })
        .getByContext(contextId)
        .all();

      expect(rows).toHaveLength(4);
      expect(rows.map(r => `${r.language}:${r.key}`).sort()).toEqual([
        'en:Subtitle',
        'en:Title',
        'es:Subtitle',
        'es:Title',
      ]);
    });
  });

  it('should no-op for an empty payload', async () => {
    await testingEnvironment.runWithContext(async () => {
      await SaveTranslationEntriesUseCaseFactory.default().execute({ translations: [] });

      const rows = await testingEnvironment.db.getAllFrom('translationsV2');
      expect(rows).toHaveLength(2);
    });
  });
});
