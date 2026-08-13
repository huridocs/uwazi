import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';
import { toIndexedTranslations } from '#api/core/infrastructure/express/translation/LegacyTranslationDtoMapper.js';
import { ContextType } from '#shared/translationSchema.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { DeleteRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/DeleteRelationshipTypeUseCaseFactory.js';

const factory = getFixturesFactory();
const createTranslationDBO = factory.v2.database.translationDBO;

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  relationtypes: [
    { _id: factory.id('deletable'), name: 'Deletable' },
    { _id: factory.id('inConnections'), name: 'In Connections' },
    { _id: factory.id('inTemplateProp'), name: 'In Template Prop' },
  ],
  templates: [
    factory.template('Template using relation type', [
      factory.relationshipProp('rel prop', 'some template', {
        relationType: factory.id('inTemplateProp').toHexString(),
      }),
    ]),
  ],
  connections: [
    {
      _id: factory.id('connection1'),
      title: 'used relation type',
      sourceDocument: 'source1',
      template: factory.id('inConnections'),
    },
  ],
  translationsV2: [
    createTranslationDBO('Deletable', 'Deletable', 'en', {
      id: factory.id('deletable').toHexString(),
      type: ContextType.relationshipType,
      label: 'Deletable',
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

describe('DeleteRelationshipTypeUseCase', () => {
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

    it('should delete relationship type when not used', async () => {
      const result = await withFlag(async () =>
        DeleteRelationshipTypeUseCaseFactory.default().execute({
          id: factory.id('deletable').toHexString(),
        })
      );

      expect(result).toBe(true);
      const relationtypes = await getRelationshipTypes();
      expect(relationtypes).not.toContainEqual(expect.objectContaining({ name: 'Deletable' }));
    });

    it('should throw when relation type is used in relationships', async () => {
      await expect(
        withFlag(async () =>
          DeleteRelationshipTypeUseCaseFactory.default().execute({
            id: factory.id('inConnections').toHexString(),
          })
        )
      ).rejects.toMatchObject({
        message: 'Cannot delete type being used in relationships',
      });
    });

    it('should throw when relation type is used in template properties', async () => {
      await expect(
        withFlag(async () =>
          DeleteRelationshipTypeUseCaseFactory.default().execute({
            id: factory.id('inTemplateProp').toHexString(),
          })
        )
      ).rejects.toMatchObject({
        message: expect.stringContaining('Cannot delete type being used in templates'),
      });
    });

    it('should remove translation context when deleted', async () => {
      await withFlag(async () =>
        DeleteRelationshipTypeUseCaseFactory.default().execute({
          id: factory.id('deletable').toHexString(),
        })
      );

      const translationsWithContext = await withFlag(async () =>
        toIndexedTranslations(
          await TranslationsQueryServiceFactory.default().getLegacy({
            locale: 'en',
            context: factory.id('deletable').toHexString(),
          })
        )
      );

      expect(translationsWithContext).toEqual([
        expect.objectContaining({ locale: 'en', contexts: [] }),
      ]);
    });
  });
});
