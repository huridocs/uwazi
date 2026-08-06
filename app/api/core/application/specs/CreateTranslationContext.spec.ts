import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { CreateTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/CreateTranslationContextUseCaseFactory.js';
import { DeleteTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/DeleteTranslationContextUseCaseFactory.js';
import { UpdateTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/UpdateTranslationContextUseCaseFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  translationsV2: [],
};

describe('Translation context use cases', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  it('should create a context for all installed languages', async () => {
    await testingEnvironment.runWithContext(async () => {
      const contextId = factory.id('tpl').toHexString();
      await CreateTranslationContextUseCaseFactory.default().execute({
        context: { id: contextId, label: 'Template', type: 'Entity' },
        values: { Template: 'Template', Title: 'Title' },
      });

      const rows = await TranslationsDataSourceFactory.default({
        transactionManager: TransactionManagerFactory.default(),
      })
        .getByContext(contextId)
        .all();

      expect(rows).toHaveLength(4);
      expect(rows.map(r => `${r.language}:${r.key}`).sort()).toEqual([
        'en:Template',
        'en:Title',
        'es:Template',
        'es:Title',
      ]);
    });
  });

  it('should update and delete a context', async () => {
    await testingEnvironment.runWithContext(async () => {
      const contextId = factory.id('tpl2').toHexString();
      await CreateTranslationContextUseCaseFactory.default().execute({
        context: { id: contextId, label: 'Old', type: 'Entity' },
        values: { Old: 'Old', Keep: 'Keep' },
      });

      await UpdateTranslationContextUseCaseFactory.default().execute({
        context: { id: contextId, label: 'New', type: 'Entity' },
        keyChanges: { Old: 'New' },
        keysToDelete: [],
        valueChanges: { New: 'New', Keep: 'Keep' },
      });

      let rows = await TranslationsDataSourceFactory.default({
        transactionManager: TransactionManagerFactory.default(),
      })
        .getByContext(contextId)
        .all();

      expect(rows.some(r => r.key === 'Old')).toBe(false);
      expect(rows.some(r => r.key === 'New')).toBe(true);
      expect(rows[0].context.label).toBe('New');

      await DeleteTranslationContextUseCaseFactory.default().execute({ contextId });
      rows = await TranslationsDataSourceFactory.default({
        transactionManager: TransactionManagerFactory.default(),
      })
        .getByContext(contextId)
        .all();
      expect(rows).toHaveLength(0);
    });
  });
});
