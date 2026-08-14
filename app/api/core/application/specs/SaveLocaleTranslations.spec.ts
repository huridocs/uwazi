import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { SaveLocaleTranslationsUseCaseFactory } from '#api/core/infrastructure/factories/SaveLocaleTranslationsUseCaseFactory.js';
import { createTranslationContext } from '#api/core/testing/translationsTestHelpers.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

const factory = getFixturesFactory();
const createTranslationDBO = factory.v2.database.translationDBO;
const contextId = 'ctx-entity';

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
    createTranslationDBO('Title', 'Title', 'en', {
      type: 'Entity',
      label: 'Template',
      id: contextId,
    }),
    createTranslationDBO('Title', 'Título', 'es', {
      type: 'Entity',
      label: 'Template',
      id: contextId,
    }),
  ],
};

describe('SaveLocaleTranslationsUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  it('should update existing keys for a locale inside one transaction', async () => {
    await testingEnvironment.runWithContext(async () => {
      const saved = await SaveLocaleTranslationsUseCaseFactory.default().execute({
        locale: 'es',
        contexts: [
          {
            id: contextId,
            label: 'Template',
            type: 'Entity',
            values: { Title: 'Plantilla' },
          },
        ],
      });

      expect(saved.locale).toBe('es');

      const rows = await TranslationsDataSourceFactory.default({
        transactionManager: TransactionManagerFactory.default(),
      })
        .getByContext(contextId)
        .all();

      expect(rows.find(r => r.language === 'es' && r.key === 'Title')?.value).toBe('Plantilla');
      expect(rows.find(r => r.language === 'en' && r.key === 'Title')?.value).toBe('Title');
    });
  });

  it('should update keys on a newly created context for one locale', async () => {
    await testingEnvironment.runWithContext(async () => {
      const newContextId = factory.id('new-tpl').toHexString();
      await createTranslationContext(
        { id: newContextId, label: 'New Template', type: 'Entity' },
        { Title: 'Title', Name: 'Name' }
      );

      await SaveLocaleTranslationsUseCaseFactory.default().execute({
        locale: 'es',
        contexts: [
          {
            id: newContextId,
            label: 'New Template',
            type: 'Entity',
            values: { Title: 'Título', Name: 'Nombre' },
          },
        ],
      });

      const rows = await TranslationsDataSourceFactory.default({
        transactionManager: TransactionManagerFactory.default(),
      })
        .getByContext(newContextId)
        .all();

      expect(rows.map(r => `${r.language}:${r.key}:${r.value}`).sort()).toEqual([
        'en:Name:Name',
        'en:Title:Title',
        'es:Name:Nombre',
        'es:Title:Título',
      ]);
    });
  });
});
