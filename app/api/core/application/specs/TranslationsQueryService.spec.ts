import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';

const factory = getFixturesFactory();
const createTranslationDBO = factory.v2.database.translationDBO;

const systemContext = { id: 'System', label: 'User Interface', type: 'Uwazi UI' as const };
const entityContext = { id: 'template-1', label: 'Case', type: 'Entity' as const };
const thesaurusContext = { id: 'thesaurus-1', label: 'CPV code', type: 'Thesaurus' as const };

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
    createTranslationDBO('Search', 'Search', 'en', systemContext),
    createTranslationDBO('Search', 'Buscar', 'es', systemContext),
    createTranslationDBO('Case', 'Case', 'en', entityContext),
    createTranslationDBO('Case', 'Caso', 'es', entityContext),
    createTranslationDBO('Apple', 'Apple', 'en', thesaurusContext),
    createTranslationDBO('Apple', 'Manzana', 'es', thesaurusContext),
  ],
};

const testConfigs = [
  { name: 'Mongo', postgresTranslations: false },
  { name: 'Postgres', postgresTranslations: true },
];

describe('TranslationsQueryService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresTranslations }) => {
    const withFlag = <T>(fn: () => T) =>
      testingEnvironment.runWithContext(
        fn,
        postgresTranslations
          ? {
              tenant: {
                ...testingTenants.current(),
                featureFlags: { postgresTranslations: true },
              },
            }
          : undefined
      );

    beforeEach(async () => {
      await testingEnvironment.setFixtures(fixtures);
    });

    it('should load only the requested language and context for getLegacy', async () => {
      await withFlag(async () => {
        const rows = await TranslationsQueryServiceFactory.default().getLegacy({
          locale: 'en',
          context: 'System',
        });

        expect(rows).toHaveLength(1);
        expect(rows[0].locale).toBe('en');
        expect(rows[0].contexts).toHaveLength(1);
        expect(rows[0].contexts?.[0].id).toBe('System');
        expect(rows[0].contexts?.[0].type).toBe('Uwazi UI');
        expect(rows[0].contexts?.[0].values).toEqual({ Search: 'Search' });
      });
    });

    it('should omit excluded context types from getLegacy', async () => {
      await withFlag(async () => {
        const rows = await TranslationsQueryServiceFactory.default().getLegacy({
          locale: 'es',
          excludeContextTypes: ['Thesaurus'],
        });

        expect(rows).toHaveLength(1);
        expect(rows[0].locale).toBe('es');
        const contextIds = rows[0].contexts?.map(context => context.id);
        expect(contextIds).toEqual(expect.arrayContaining(['System', entityContext.id]));
        expect(contextIds).not.toContain(thesaurusContext.id);
        expect(rows[0].contexts?.find(context => context.id === entityContext.id)?.values).toEqual({
          Case: 'Caso',
        });
      });
    });

    it('should not include other languages in getContextValueMap', async () => {
      await withFlag(async () => {
        const values = await TranslationsQueryServiceFactory.default().getContextValueMap(
          'en',
          thesaurusContext.id
        );

        expect(values).toEqual({ Apple: 'Apple' });
      });
    });

    it('should group one language by context in getLanguageValueMaps', async () => {
      await withFlag(async () => {
        const maps = await TranslationsQueryServiceFactory.default().getLanguageValueMaps('es');

        expect(maps.System).toEqual({ Search: 'Buscar' });
        expect(maps[thesaurusContext.id]).toEqual({ Apple: 'Manzana' });
      });
    });
  });
});
