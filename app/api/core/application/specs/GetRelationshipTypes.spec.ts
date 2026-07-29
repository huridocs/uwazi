import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { GetRelationshipTypesUseCaseFactory } from '#api/core/infrastructure/factories/GetRelationshipTypesUseCaseFactory.js';

const factory = getFixturesFactory();

const fixtures = {
  relationtypes: [
    { _id: factory.id('rel1'), name: 'Type 1', properties: [] },
    { _id: factory.id('rel2'), name: 'Type 2', properties: [] },
  ],
};

type TestConfig = {
  name: string;
  postgresRelationshipTypes: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', postgresRelationshipTypes: false },
  { name: 'Postgres', postgresRelationshipTypes: true },
];

describe('GetRelationshipTypesUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresRelationshipTypes }) => {
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

    it('should return all relationship types', async () => {
      const result = await withFlag(async () =>
        GetRelationshipTypesUseCaseFactory.default().execute({})
      );

      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(expect.arrayContaining(['Type 1', 'Type 2']));
    });

    it('should return only the selected relationship type', async () => {
      const result = await withFlag(async () =>
        GetRelationshipTypesUseCaseFactory.default().execute({
          id: factory.id('rel2').toHexString(),
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Type 2');
    });
  });
});
