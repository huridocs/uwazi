import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import translations from '#api/i18n/translations.js';
import { ContextType } from '#shared/translationSchema.js';
import { CreateRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/CreateRelationshipTypeUseCaseFactory.js';

const factory = getFixturesFactory();
const createTranslationDBO = factory.v2.database.translationDBO;

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  relationtypes: [{ _id: factory.id('existing'), name: 'Existing', properties: [] }],
  translationsV2: [
    createTranslationDBO('Library', 'Library', 'en', {
      id: 'System',
      type: ContextType.uwaziUI,
      label: 'System',
    }),
  ],
};

type TestConfig = {
  name: string;
  postgresRelationshipTypes: boolean;
  getRelationshipTypes: () => Promise<Record<string, unknown>[]>;
};

const testConfigs: TestConfig[] = [
  {
    name: 'Mongo',
    postgresRelationshipTypes: false,
    getRelationshipTypes: async () => testingEnvironment.db.getAllFrom('relationtypes'),
  },
  {
    name: 'Postgres',
    postgresRelationshipTypes: true,
    getRelationshipTypes: async () =>
      testingEnvironment.pg
        .getAllFrom('relationship_types')
        .then(rows => rows.map(({ tenant_id: _, ...rest }) => rest)),
  },
];

describe('CreateRelationshipTypeUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresRelationshipTypes, getRelationshipTypes }) => {
    const withFlag = <T>(fn: () => T) =>
      testingEnvironment.runWithContext(
        fn,
        postgresRelationshipTypes
          ? {
              tenant: {
                ...testingTenants.current(),
                featureFlags: { postgresRelationshipTypes: true },
              },
            }
          : undefined
      );

    beforeEach(async () => {
      await testingEnvironment.setFixtures(fixtures);
    });

    it('should create a relationship type', async () => {
      const created = await withFlag(async () =>
        CreateRelationshipTypeUseCaseFactory.default().execute({ name: 'Created Type' })
      );

      expect(created.name).toBe('Created Type');

      const relationtypes = await getRelationshipTypes();
      expect(relationtypes).toContainEqual(expect.objectContaining({ name: 'Created Type' }));
    });

    it('should throw when name already exists', async () => {
      await expect(
        withFlag(async () =>
          CreateRelationshipTypeUseCaseFactory.default().execute({ name: ' existing ' })
        )
      ).rejects.toThrow('duplicated_entry');
    });

    it('should create translation context', async () => {
      const created = await withFlag(async () =>
        CreateRelationshipTypeUseCaseFactory.default().execute({ name: 'Context Type' })
      );

      const [translation] = await withFlag(async () =>
        translations.get({ locale: 'en', context: created.id })
      );

      expect(translation.contexts).toHaveLength(1);
      expect(translation.contexts?.[0]).toMatchObject({
        id: created.id,
        label: 'Context Type',
        type: ContextType.relationshipType,
        values: { 'Context Type': 'Context Type' },
      });
    });
  });
});
