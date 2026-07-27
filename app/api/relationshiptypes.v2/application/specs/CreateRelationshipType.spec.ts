import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { CreateRelationshipTypeUseCaseFactory } from '../../infrastructure/factories/CreateRelationshipTypeUseCaseFactory.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  relationtypes: [{ _id: factory.id('existing'), name: 'Existing', properties: [] }],
};

describe('CreateRelationshipTypeUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a relationship type', async () => {
    const created = await testingEnvironment.runWithContext(async () =>
      CreateRelationshipTypeUseCaseFactory.default().execute({ name: 'Created Type' })
    );

    expect(created.name).toBe('Created Type');

    const relationtypes = await testingEnvironment.db.getAllFrom('relationtypes');
    expect(relationtypes).toContainEqual(expect.objectContaining({ name: 'Created Type' }));
  });

  it('should throw when name already exists', async () => {
    await expect(
      testingEnvironment.runWithContext(async () =>
        CreateRelationshipTypeUseCaseFactory.default().execute({ name: ' existing ' })
      )
    ).rejects.toThrow('duplicated_entry');
  });
});
