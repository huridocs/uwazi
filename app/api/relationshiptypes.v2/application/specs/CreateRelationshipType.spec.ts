import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import translations from '#api/i18n/translations.js';
import { ContextType } from '#shared/translationSchema.js';
import { CreateRelationshipTypeUseCaseFactory } from '../../infrastructure/factories/CreateRelationshipTypeUseCaseFactory.js';

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

  it('should create translation context', async () => {
    const created = await testingEnvironment.runWithContext(async () =>
      CreateRelationshipTypeUseCaseFactory.default().execute({ name: 'Context Type' })
    );

    const [translation] = await testingEnvironment.runWithContext(async () =>
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
