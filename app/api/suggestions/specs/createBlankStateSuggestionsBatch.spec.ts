import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { ixTestAccess } from '#api/services/informationextraction/specs/ixTestAccess.js';
import { propertyTypes } from '#shared/propertyTypes.js';
import { testConfigs } from '../domain/specs/IXSuggestionsContractFixtures.js';
import { createBlankStateSuggestionsBatch } from '../blankSuggestions.js';

const f = getFixturesFactory();

const TENANT_ID = 'blank-state-suggestions-batch';

const entity = (id: string) =>
  f.entity(id, 'swept_template', { source_text: [{ value: `${id} source` }] });

const fixtures: DBFixture = {
  settings: [{ languages: [{ default: true, label: 'English', key: 'en' }] }],
  templates: [
    f.template('swept_template', [
      f.property('source_text', propertyTypes.text),
      f.property('target_text', propertyTypes.text),
    ]),
  ],
  entities: [entity('entity1'), entity('entity2'), entity('entity3')],
  ixextractors: [
    f.ixExtractor('extractor', 'target_text', ['swept_template'], { property: 'source_text' }),
  ],
  // A text-source suggestion carries no fileId: the factory defaults one, and it would key the
  // row as a pdf suggestion instead.
  ixsuggestions: [
    (({ fileId, ...suggestion }) => suggestion)(
      f.ixSuggestion({
        _id: f.id('already covered'),
        extractorId: f.id('extractor'),
        entityId: 'entity2',
        entityLanguageId: f.id('entity2-en'),
        entityTemplate: f.idString('swept_template'),
        propertyName: 'target_text',
        language: 'en',
        useForTraining: true,
      })
    ),
  ],
};

/**
 * The extractor sweep: one batch of blanks for every entity of a template. It runs against
 * entities the entity-created listener may have covered already, so a key it finds taken must
 * cost only its own row (F48).
 */
describe('createBlankStateSuggestionsBatch()', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresCore: usePostgres },
      });

      await testingEnvironment.setFixtures(fixtures);
    });

    const sweep = async () =>
      testingEnvironment.runWithContext(async () =>
        createBlankStateSuggestionsBatch(
          { fromId: f.idString('entity1-en'), toId: f.idString('entity3-en'), totalCount: 3 },
          f.idString('swept_template'),
          f.idString('extractor')
        )
      );

    it('should cover every entity of the template when one is already covered', async () => {
      await sweep();

      const stored = await ixTestAccess.readSuggestions({ extractorId: f.id('extractor') });

      expect(new Set(stored.map(({ entityId }) => entityId))).toEqual(
        new Set(['entity1', 'entity2', 'entity3'])
      );
    });

    /**
     * `entityLanguageId` is the row accept loads to write the entity. A projected read that lost
     * `_id` used to hand the factory an invented one, so every swept suggestion reported success
     * and changed nothing (F49).
     */
    it('should point each suggestion at the entity of its own language', async () => {
      await sweep();

      const stored = await ixTestAccess.readSuggestions({ extractorId: f.id('extractor') });

      expect(
        stored
          .filter(({ entityId }) => entityId !== 'entity2')
          .map(({ entityId, entityLanguageId }) => [entityId, entityLanguageId?.toString()])
          .sort()
      ).toEqual([
        ['entity1', f.idString('entity1-en')],
        ['entity3', f.idString('entity3-en')],
      ]);
    });

    it('should keep the suggestion already covering an entity', async () => {
      await sweep();

      const covered = await ixTestAccess.readSuggestions({ entityId: 'entity2' });

      expect(
        covered.find(({ _id }) => _id.toString() === f.idString('already covered'))
      ).toMatchObject({ useForTraining: true });
      // Postgres skips the taken key; Mongo, having no such index, stores the duplicate.
      expect(covered).toHaveLength(usePostgres ? 1 : 2);
    });
  });
});
