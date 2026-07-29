import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import translations from '#api/i18n/translations.js';
import { ContextType } from '#shared/translationSchema.js';
import { UpdateRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/UpdateRelationshipTypeUseCaseFactory.js';

const factory = getFixturesFactory();
const createTranslationDBO = factory.v2.database.translationDBO;

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  relationtypes: [
    { _id: factory.id('rel1'), name: 'Type 1', properties: [] },
    { _id: factory.id('rel2'), name: 'Type 2', properties: [] },
  ],
  translationsV2: [
    createTranslationDBO('Type 1', 'Type 1', 'en', {
      id: factory.id('rel1').toHexString(),
      type: ContextType.relationshipType,
      label: 'Type 1',
    }),
  ],
};

describe('UpdateRelationshipTypeUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should update an existing relationship type', async () => {
    const updated = await testingEnvironment.runWithContext(async () =>
      UpdateRelationshipTypeUseCaseFactory.default().execute({
        id: factory.id('rel1').toHexString(),
        name: 'Type 1 Updated',
      })
    );

    expect(updated.name).toBe('Type 1 Updated');
    const relationtypes = await testingEnvironment.db.getAllFrom('relationtypes');
    expect(relationtypes).toContainEqual(expect.objectContaining({ name: 'Type 1 Updated' }));
  });

  it('should throw when relationship type does not exist', async () => {
    await expect(
      testingEnvironment.runWithContext(async () =>
        UpdateRelationshipTypeUseCaseFactory.default().execute({
          id: factory.id('unknown').toHexString(),
          name: 'Updated',
        })
      )
    ).rejects.toThrow('Relationship type not found');
  });

  it('should throw when new name already exists in another type', async () => {
    await expect(
      testingEnvironment.runWithContext(async () =>
        UpdateRelationshipTypeUseCaseFactory.default().execute({
          id: factory.id('rel1').toHexString(),
          name: 'Type 2',
        })
      )
    ).rejects.toThrow('duplicated_entry');
  });

  it('should update translation context', async () => {
    await testingEnvironment.runWithContext(async () =>
      UpdateRelationshipTypeUseCaseFactory.default().execute({
        id: factory.id('rel1').toHexString(),
        name: 'Type 1 Renamed',
      })
    );

    const [translation] = await testingEnvironment.runWithContext(async () =>
      translations.get({ locale: 'en', context: factory.id('rel1').toHexString() })
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
