import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';
import { toIndexedTranslations } from '#api/core/infrastructure/express/translation/LegacyTranslationDtoMapper.js';
import { ContextType } from '#shared/translationSchema.js';
import { UpdateRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/UpdateRelationshipTypeUseCaseFactory.js';

const factory = getFixturesFactory();
const createTranslationDBO = factory.v2.database.translationDBO;

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  relationtypes: [
    { _id: factory.id('rel1'), name: 'Type 1' },
    { _id: factory.id('rel2'), name: 'Type 2' },
  ],
  translationsV2: [
    createTranslationDBO('Type 1', 'Type 1', 'en', {
      id: factory.id('rel1').toHexString(),
      type: ContextType.relationshipType,
      label: 'Type 1',
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

describe('UpdateRelationshipTypeUseCase', () => {
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

    it('should update an existing relationship type', async () => {
      const updated = await withFlag(async () =>
        UpdateRelationshipTypeUseCaseFactory.default().execute({
          id: factory.id('rel1').toHexString(),
          name: 'Type 1 Updated',
        })
      );

      expect(updated.name).toBe('Type 1 Updated');
      const relationtypes = await getRelationshipTypes();
      expect(relationtypes).toContainEqual(expect.objectContaining({ name: 'Type 1 Updated' }));
    });

    it('should throw when relationship type does not exist', async () => {
      await expect(
        withFlag(async () =>
          UpdateRelationshipTypeUseCaseFactory.default().execute({
            id: factory.id('unknown').toHexString(),
            name: 'Updated',
          })
        )
      ).rejects.toThrow('Relationship type not found');
    });

    it('should throw when new name already exists in another type', async () => {
      await expect(
        withFlag(async () =>
          UpdateRelationshipTypeUseCaseFactory.default().execute({
            id: factory.id('rel1').toHexString(),
            name: 'Type 2',
          })
        )
      ).rejects.toThrow('duplicated_entry');
    });

    it('should update translation context', async () => {
      await withFlag(async () =>
        UpdateRelationshipTypeUseCaseFactory.default().execute({
          id: factory.id('rel1').toHexString(),
          name: 'Type 1 Renamed',
        })
      );

      const [translation] = await withFlag(async () =>
        toIndexedTranslations(
          await TranslationsQueryServiceFactory.default().getLegacy({
            locale: 'en',
            context: factory.id('rel1').toHexString(),
          })
        )
      );

      expect(translation.contexts).toHaveLength(1);
      expect(translation.contexts?.[0]).toMatchObject({
        id: factory.id('rel1').toHexString(),
        label: 'Type 1 Renamed',
        type: ContextType.relationshipType,
        values: { 'Type 1 Renamed': 'Type 1 Renamed' },
      });
    });
  });
});
