import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { ixTestAccess } from '#api/services/informationextraction/specs/ixTestAccess.js';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import {
  Input,
  UpdateSuggestionsAfterEntityUpdate,
} from '../useCases/updateSuggestionsAfterEntityUpdate.js';
import { testConfigs } from '../domain/specs/IXSuggestionsContractFixtures.js';

const factory = getFixturesFactory();

const extractorSourceTextTargetTextEntity1 = factory.entityInMultipleLanguages(
  ['en', 'es'],
  'extractor_source_text_target_text_entity_1',
  'extractor_source_text_target_text_template',
  {
    target_text: [{ value: 'text_target_value' }],
    target_text_1: [{ value: 'text_target_1_value' }],
  },
  {},
  {
    es: {
      metadata: {
        target_text: [{ value: 'text_target_value_es' }],
        target_text_1: [{ value: 'text_target_1_value_es' }],
      },
    },
  }
);

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { label: 'English', key: 'en', ISO639_1: 'en', ISO639_3: 'eng' },
        { label: 'Spanish', key: 'en', ISO639_1: 'es', ISO639_3: 'spa' },
      ],
    },
  ],
  ixextractors: [
    factory.ixExtractor(
      'extractor_source_text_target_text',
      'target_text',
      ['extractor_source_text_target_text_template'],
      {
        property: 'source_text',
      }
    ),

    factory.ixExtractor(
      'extractor_source_text_target_text_1',
      'target_text_1',
      ['extractor_source_text_target_text_template'],
      {
        property: 'source_text',
      }
    ),

    factory.ixExtractor(
      'extractor_source_title_target_text',
      'target_text',
      ['extractor_source_text_target_text_template'],
      {
        property: 'title',
      }
    ),
  ],
  templates: [
    factory.template('extractor_source_text_target_text_template', [
      factory.property('source_text', 'text'),
      factory.property('target_text', 'text'),
      factory.property('target_text_1', 'text'),
    ]),
  ],
  entities: [...extractorSourceTextTargetTextEntity1],

  ixsuggestions: [
    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_1',
      entityTemplate: factory.id('extractor_source_text_target_text_template').toString(),
      propertyName: 'target_text',
      language: 'en',
      status: 'ready',
      segment: '',
      error: '',
      currentValue: 'text_target_value',
      entityTitle: 'extractor_source_text_target_text_entity_1',
      suggestedValue: '',
      date: 1,
      state: {
        error: false,
        hasContext: false,
        match: false,
        labeled: true,
        withValue: true,
        obsolete: false,
        processing: false,
        withSuggestion: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_1',
      entityTemplate: factory.id('extractor_source_text_target_text_template').toString(),
      propertyName: 'target_text',
      language: 'es',
      status: 'ready',
      segment: '',
      error: '',
      currentValue: 'text_target_value_es',
      entityTitle: 'extractor_source_text_target_text_entity_1',
      suggestedValue: '',
      date: 1,
      state: {
        error: false,
        hasContext: false,
        match: false,
        labeled: true,
        withValue: true,
        obsolete: false,
        processing: false,
        withSuggestion: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text_1'),
      entityId: 'extractor_source_text_target_text_entity_1',
      entityTemplate: factory.id('extractor_source_text_target_text_template').toString(),
      propertyName: 'target_text',
      language: 'en',
      status: 'ready',
      segment: '',
      error: '',
      currentValue: 'text_target_1_value',
      entityTitle: 'extractor_source_text_target_text_entity_1',
      suggestedValue: '',
      date: 1,
      state: {
        error: false,
        hasContext: false,
        match: false,
        labeled: true,
        withValue: true,
        obsolete: false,
        processing: false,
        withSuggestion: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text_1'),
      entityId: 'extractor_source_text_target_text_entity_1',
      entityTemplate: factory.id('extractor_source_text_target_text_template').toString(),
      propertyName: 'target_text',
      language: 'es',
      status: 'ready',
      segment: '',
      error: '',
      currentValue: 'text_target_1_value_es',
      entityTitle: 'extractor_source_text_target_text_entity_1',
      suggestedValue: '',
      date: 1,
      state: {
        error: false,
        hasContext: false,
        match: false,
        labeled: true,
        withValue: true,
        obsolete: false,
        processing: false,
        withSuggestion: false,
      },
    }),
    factory.ixSuggestion({
      _id: factory.id('title_source_suggestion'),
      extractorId: factory.id('extractor_source_title_target_text'),
      entityId: 'extractor_source_text_target_text_entity_1',
      entityTemplate: factory.id('extractor_source_text_target_text_template').toString(),
      propertyName: 'target_text',
      language: 'en',
      status: 'ready',
      segment: 'a segment extracted from the old title',
      error: '',
      currentValue: 'text_target_value',
      entityTitle: 'extractor_source_text_target_text_entity_1',
      suggestedValue: 'from_the_old_title',
      date: 1,
      state: {
        error: false,
        hasContext: true,
        match: false,
        labeled: true,
        withValue: true,
        obsolete: false,
        processing: false,
        withSuggestion: true,
      },
    }),
    /**
     * Its extractor no longer exists. The `$unwind` of the join this use case used to run
     * dropped such rows silently; pinned here so the behaviour survives the move off the
     * aggregation.
     */
    factory.ixSuggestion({
      _id: factory.id('orphaned_suggestion'),
      extractorId: factory.id('deleted_extractor'),
      entityId: 'extractor_source_text_target_text_entity_1',
      entityTemplate: factory.id('extractor_source_text_target_text_template').toString(),
      propertyName: 'target_text',
      language: 'en',
      status: 'ready',
      currentValue: 'untouched',
      entityTitle: 'untouched',
      suggestedValue: '',
      date: 1,
    }),
  ],
};

/** Postgres rejects the orphan through its foreign key, so its store never holds one. */
const fixturesWithoutOrphan: DBFixture = {
  ...fixtures,
  ixsuggestions: (fixtures.ixsuggestions as IXSuggestionType[]).filter(
    suggestion => !factory.id('orphaned_suggestion').equals(suggestion._id!)
  ),
};

/** Built and run inside the context, as the entity-updated listener does. */
const createSut = () => {
  const sut = {
    execute: async (input: Input) =>
      testingEnvironment.runWithContext(async () =>
        new UpdateSuggestionsAfterEntityUpdate(TemplatesDAOFactory.default()).execute(input)
      ),
  };

  return {
    sut,
  };
};

const byLanguage = (suggestions: IXSuggestionType[]) =>
  [...suggestions].sort((a, b) => a.language.localeCompare(b.language));

const suggestionsOf = async (extractorName: string) =>
  byLanguage(
    await ixTestAccess.readSuggestions({
      entityId: extractorSourceTextTargetTextEntity1[0].sharedId,
      extractorId: factory.id(extractorName),
    })
  );

describe('UpdateSuggestionsAfterEntityUpdate', () => {
  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    // Both stores get the same data: fixtures are mirrored into Postgres on either run.
    const setUpStore = async () => {
      await testingEnvironment.setUp(fixturesWithoutOrphan, { postgres: true });
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: usePostgres } });
    };

    beforeAll(setUpStore);

    describe('given Entity title is updated', () => {
      it('should update Suggestion correctly', async () => {
        const input: Input = {
          entities: [
            { ...extractorSourceTextTargetTextEntity1[0], title: 'Title changed' },
            { ...extractorSourceTextTargetTextEntity1[1], title: 'Title changed (es)' },
          ],
        };
        const { sut } = createSut();

        await sut.execute(input);

        expect(await suggestionsOf('extractor_source_text_target_text')).toMatchObject([
          {
            extractorId: factory.id('extractor_source_text_target_text'),
            entityId: 'extractor_source_text_target_text_entity_1',
            language: 'en',
            entityTitle: 'Title changed',
            currentValue: 'text_target_value',
          },

          {
            extractorId: factory.id('extractor_source_text_target_text'),
            entityId: 'extractor_source_text_target_text_entity_1',
            language: 'es',
            entityTitle: 'Title changed (es)',
            currentValue: 'text_target_value_es',
          },
        ]);

        expect(await suggestionsOf('extractor_source_text_target_text_1')).toMatchObject([
          {
            extractorId: factory.id('extractor_source_text_target_text_1'),
            entityId: 'extractor_source_text_target_text_entity_1',
            language: 'en',
            entityTitle: 'Title changed',
            currentValue: 'text_target_1_value',
          },

          {
            extractorId: factory.id('extractor_source_text_target_text_1'),
            entityId: 'extractor_source_text_target_text_entity_1',
            language: 'es',
            entityTitle: 'Title changed (es)',
            currentValue: 'text_target_1_value_es',
          },
        ]);
      });
    });

    describe('given target Property is updated', () => {
      it('should update Suggestion correctly', async () => {
        const input: Input = {
          entities: [
            {
              ...extractorSourceTextTargetTextEntity1[0],
              metadata: {
                ...extractorSourceTextTargetTextEntity1[0].metadata,
                target_text: [{ value: 'Text target Changed' }],
              },
            },
            {
              ...extractorSourceTextTargetTextEntity1[1],
              metadata: {
                ...extractorSourceTextTargetTextEntity1[1].metadata,
                target_text: [{ value: 'Text target Changed (es)' }],
              },
            },
          ],
        };
        const { sut } = createSut();

        await sut.execute(input);

        expect(await suggestionsOf('extractor_source_text_target_text')).toMatchObject([
          {
            extractorId: factory.id('extractor_source_text_target_text'),
            entityId: 'extractor_source_text_target_text_entity_1',
            language: 'en',
            entityTitle: 'extractor_source_text_target_text_entity_1',
            currentValue: 'Text target Changed',
          },

          {
            extractorId: factory.id('extractor_source_text_target_text'),
            entityId: 'extractor_source_text_target_text_entity_1',
            language: 'es',
            entityTitle: 'extractor_source_text_target_text_entity_1',
            currentValue: 'Text target Changed (es)',
          },
        ]);

        expect(await suggestionsOf('extractor_source_text_target_text_1')).toMatchObject([
          {
            extractorId: factory.id('extractor_source_text_target_text_1'),
            entityId: 'extractor_source_text_target_text_entity_1',
            language: 'en',
            entityTitle: 'extractor_source_text_target_text_entity_1',
            currentValue: 'text_target_1_value',
          },

          {
            extractorId: factory.id('extractor_source_text_target_text_1'),
            entityId: 'extractor_source_text_target_text_entity_1',
            language: 'es',
            entityTitle: 'extractor_source_text_target_text_entity_1',
            currentValue: 'text_target_1_value_es',
          },
        ]);
      });
    });

    describe('given the source Property is updated', () => {
      // These three assert on `state.obsolete`, which is sticky once set — the recompute carries a
      // row's own `obsolete` forward. Without a reset they would depend on each other's order.
      beforeEach(setUpStore);

      const withSource = (entity: any, sourceText: string) => ({
        ...entity,
        metadata: { ...entity.metadata, source_text: [{ value: sourceText }] },
      });

      it('should mark the suggestion obsolete, because its result no longer describes the source', async () => {
        const before = extractorSourceTextTargetTextEntity1.map(entity =>
          withSource(entity, 'the original source text')
        );
        const after = extractorSourceTextTargetTextEntity1.map(entity =>
          withSource(entity, 'a completely different source text')
        );

        const { sut } = createSut();
        await sut.execute({ entities: after, previousEntities: before });

        const suggestions = await suggestionsOf('extractor_source_text_target_text');

        expect(suggestions.map(suggestion => suggestion.state?.obsolete)).toEqual([true, true]);
      });

      it('should leave the suggestion alone when the source did not change', async () => {
        const before = extractorSourceTextTargetTextEntity1.map(entity =>
          withSource(entity, 'an unchanged source text')
        );
        const after = before.map(entity => ({ ...entity, title: 'only the title moved' }));

        const { sut } = createSut();
        await sut.execute({ entities: after, previousEntities: before });

        const suggestions = await suggestionsOf('extractor_source_text_target_text');

        expect(suggestions.map(suggestion => suggestion.state?.obsolete)).toEqual([false, false]);
        expect(suggestions.map(suggestion => suggestion.entityTitle)).toEqual([
          'only the title moved',
          'only the title moved',
        ]);
      });

      it('should treat the title as the source when the extractor reads from it', async () => {
        const before = extractorSourceTextTargetTextEntity1;
        const after = extractorSourceTextTargetTextEntity1.map(entity => ({
          ...entity,
          title: 'a brand new title',
        }));

        const { sut } = createSut();
        await sut.execute({ entities: after, previousEntities: before });

        const [suggestion] = await suggestionsOf('extractor_source_title_target_text');

        expect(suggestion?.state?.obsolete).toBe(true);
      });
    });
  });

  /** Mongo only: Postgres cannot hold a suggestion whose extractor is gone. */
  describe('given a suggestion whose extractor no longer exists', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp(fixtures, { postgresMirror: [] });
    });

    it('should skip it rather than throwing', async () => {
      const input: Input = {
        entities: [
          { ...extractorSourceTextTargetTextEntity1[0], title: 'Another title' },
          { ...extractorSourceTextTargetTextEntity1[1], title: 'Another title (es)' },
        ],
      };
      const { sut } = createSut();

      await sut.execute(input);

      const orphaned = await ixTestAccess.readOneSuggestion({
        extractorId: factory.id('deleted_extractor'),
      });

      expect(orphaned).toMatchObject({ entityTitle: 'untouched', currentValue: 'untouched' });
    });
  });
});
