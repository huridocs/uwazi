import translations from '#api/i18n/translations.js';
import { ContextType } from '#shared/translationSchema.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { RelationshipType } from '../../../model/RelationshipType.js';
import { LegacyRelationshipTypesTranslationService } from '../LegacyRelationshipTypesTranslationService.js';

const factory = getFixturesFactory();
const createTranslationDBO = factory.v2.database.translationDBO;

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
    createTranslationDBO('Library', 'Library', 'en', {
      id: 'System',
      label: 'System',
      type: ContextType.uwaziUI,
    }),
    createTranslationDBO('Library', 'Biblioteca', 'es', {
      id: 'System',
      label: 'System',
      type: ContextType.uwaziUI,
    }),
  ],
};

describe('LegacyRelationshipTypesTranslationService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create translation context', async () => {
    const relationshipType = new RelationshipType('type-id', 'Parent');
    const sut = new LegacyRelationshipTypesTranslationService();

    await testingEnvironment.runWithContext(async () => {
      await sut.create(relationshipType);
    });

    const translationWithContext = await testingEnvironment.runWithContext(async () => {
      const [translation] = await translations.get({ locale: 'en', context: 'type-id' });
      return translation;
    });

    expect(translationWithContext.contexts).toHaveLength(1);
    expect(translationWithContext.contexts?.[0]).toMatchObject({
      id: 'type-id',
      label: 'Parent',
      type: ContextType.relationshipType,
      values: { Parent: 'Parent' },
    });
  });

  it('should update translation context', async () => {
    const sut = new LegacyRelationshipTypesTranslationService();
    await testingEnvironment.runWithContext(async () => {
      await sut.create(new RelationshipType('type-id', 'Old'));
      await sut.update(
        new RelationshipType('type-id', 'Old'),
        new RelationshipType('type-id', 'New')
      );
    });

    const translationWithContext = await testingEnvironment.runWithContext(async () => {
      const [translation] = await translations.get({ locale: 'en', context: 'type-id' });
      return translation;
    });

    expect(translationWithContext.contexts).toHaveLength(1);
    expect(translationWithContext.contexts?.[0]).toMatchObject({
      id: 'type-id',
      label: 'New',
      type: ContextType.relationshipType,
      values: { New: 'New' },
    });
  });

  it('should delete translation context', async () => {
    const sut = new LegacyRelationshipTypesTranslationService();
    await testingEnvironment.runWithContext(async () => {
      await sut.create(new RelationshipType('type-id', 'Parent'));
      await sut.delete('type-id');
    });

    const translationWithContext = await testingEnvironment.runWithContext(async () => {
      const results = await translations.get({ locale: 'en', context: 'type-id' });
      return results;
    });
    expect(translationWithContext).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ locale: 'en', contexts: [] }),
        expect.objectContaining({ locale: 'es', contexts: [] }),
      ])
    );
  });
});
