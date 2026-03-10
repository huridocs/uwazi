import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import {
  Input,
  UpdateSuggestionsAfterEntityUpdate,
} from '../useCases/updateSuggestionsAfterEntityUpdate';

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
  ],
};

const createSut = () => {
  const sut = new UpdateSuggestionsAfterEntityUpdate();

  return {
    sut,
  };
};

describe('UpdateSuggestionsAfterEntityUpdate', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

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

      const suggestions = await testingEnvironment.db
        .getCollection('ixsuggestions')
        ?.find({ entityId: extractorSourceTextTargetTextEntity1[0].sharedId })
        .toArray();

      const suggestionsFromExtractor1 = suggestions?.filter(
        s => s.extractorId.toString() === factory.id('extractor_source_text_target_text').toString()
      );

      const suggestionsFromExtractor2 = suggestions?.filter(
        s =>
          s.extractorId.toString() === factory.id('extractor_source_text_target_text_1').toString()
      );

      expect(suggestionsFromExtractor1).toMatchObject([
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

      expect(suggestionsFromExtractor2).toMatchObject([
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

      const suggestions = await testingEnvironment.db
        .getCollection('ixsuggestions')
        ?.find({ entityId: extractorSourceTextTargetTextEntity1[0].sharedId })
        .toArray();

      const suggestionsFromExtractor1 = suggestions?.filter(
        s => s.extractorId.toString() === factory.id('extractor_source_text_target_text').toString()
      );

      const suggestionsFromExtractor2 = suggestions?.filter(
        s =>
          s.extractorId.toString() === factory.id('extractor_source_text_target_text_1').toString()
      );

      expect(suggestionsFromExtractor1).toMatchObject([
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

      expect(suggestionsFromExtractor2).toMatchObject([
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
});
