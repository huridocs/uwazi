import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { DBFixture } from 'api/utils/testing_db';
import { factory } from './fixtures';
import { GetSuggestionsForTableQuery } from '../getSuggestionsForTableQuery/getSuggestionsForTableQuery';

const createSut = () => {
  const sut = new GetSuggestionsForTableQuery();

  return { sut };
};

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { label: 'English', key: 'en', default: true },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],
  templates: [
    factory.template('extractor_source_pdf_target_text_template', [
      factory.property('target_text', 'text'),
    ]),

    factory.template('extractor_source_pdf_target_multiselect_template', [
      factory.property('target_multiselect', 'multiselect'),
    ]),

    factory.template('extractor_source_text_target_text_template', [
      factory.property('target_text', 'text'),
      factory.property('source_text', 'text'),
    ]),
  ],
  ixextractors: [
    factory.ixExtractor('extractor_source_pdf_target_text', 'target_text', [
      'extractor_source_pdf_target_text_template',
    ]),

    factory.ixExtractor('extractor_source_pdf_target_multiselect', 'target_multiselect', [
      'extractor_source_pdf_target_multiselect_template',
    ]),

    factory.ixExtractor(
      'extractor_source_text_target_text',
      'target_text',
      ['extractor_source_text_target_text_template'],
      { property: 'source_text' }
    ),
  ],
  entities: [
    ...factory.entityInMultipleLanguages(
      ['es', 'en'],
      'extractor_source_pdf_target_text_entity_1',
      'extractor_source_pdf_target_text_template',
      {
        target_text: [{ value: 'labeled_match_context_value' }],
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['es', 'en'],
      'extractor_source_pdf_target_text_entity_2',
      'extractor_source_pdf_target_text_template',
      {
        target_text: [],
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['es', 'en'],
      'extractor_source_pdf_target_multiselect_entity_1',
      'extractor_source_pdf_target_multiselect_template',
      {
        target_multiselect: [],
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['es', 'en'],
      'extractor_source_text_target_text_entity_1',
      'extractor_source_text_target_text_template',
      {
        target_text: [{ value: 'labeled_match_context_value' }],
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['es', 'en'],
      'extractor_source_text_target_text_entity_2',
      'extractor_source_text_target_text_template',
      {
        target_text: [{ value: 'labeled_no-match_context_value' }],
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['es', 'en'],
      'extractor_source_text_target_text_entity_3',
      'extractor_source_text_target_text_template',
      {
        target_text: [{ value: '' }],
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['es', 'en'],
      'extractor_source_text_target_text_entity_4',
      'extractor_source_text_target_text_template',
      {
        target_text: [{ value: '' }],
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['es', 'en'],
      'extractor_source_text_target_text_entity_5',
      'extractor_source_text_target_text_template',
      {
        target_text: [{ value: '' }],
      }
    ),
  ],
  ixsuggestions: [
    factory.ixSuggestion({
      entityId: 'extractor_source_pdf_target_text_entity_1',
      suggestedValue: 'labeled_match_context_value',
      entityTemplate: 'extractor_source_pdf_target_text_template',
      propertyName: 'target_text',
      extractorId: factory.id('extractor_source_pdf_target_text'),
      language: 'en',
      segment: 'any_segment',
      status: 'ready',
      fileId: factory.id('extractor_source_pdf_target_text_entity_1_pdf_1'),
      state: {
        match: true,
        labeled: true,
        hasContext: true,
        withValue: true,
        withSuggestion: true,
        error: false,
        obsolete: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      entityId: 'extractor_source_pdf_target_text_entity_1',
      suggestedValue: 'labeled_match_context_value',
      entityTemplate: 'extractor_source_pdf_target_text_template',
      propertyName: 'target_text',
      extractorId: factory.id('extractor_source_pdf_target_text'),
      language: 'es',
      segment: 'any_segment',
      status: 'ready',
      fileId: factory.id('extractor_source_pdf_target_text_entity_1_pdf_2'),
      state: {
        match: true,
        labeled: true,
        hasContext: true,
        withValue: true,
        withSuggestion: true,
        error: false,
        obsolete: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      entityId: 'extractor_source_pdf_target_text_entity_2',
      suggestedValue: null,
      entityTemplate: 'extractor_source_pdf_target_text_template',
      propertyName: 'target_text',
      extractorId: factory.id('extractor_source_pdf_target_text'),
      language: 'en',
      segment: '',
      status: 'ready',
      fileId: factory.id('extractor_source_pdf_target_text_entity_2_pdf_1'),
      state: {
        match: false,
        labeled: false,
        hasContext: false,
        withValue: false,
        withSuggestion: false,
        error: false,
        obsolete: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      entityId: 'extractor_source_pdf_target_multiselect_entity_1',
      suggestedValue: null,
      entityTemplate: 'extractor_source_pdf_target_multiselect_template',
      propertyName: 'target_multiselect',
      extractorId: factory.id('extractor_source_pdf_target_multiselect'),
      language: 'en',
      segment: '',
      status: 'ready',
      fileId: factory.id('extractor_source_pdf_target_multiselect_entity_1_pdf_1'),
      state: {
        match: false,
        labeled: false,
        hasContext: false,
        withValue: false,
        withSuggestion: false,
        error: false,
        obsolete: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_1',

      suggestedValue: 'labeled_match_context_value',
      entityTemplate: 'extractor_source_text_target_text_template',
      propertyName: 'target_text',
      language: 'en',
      segment: 'any_segment_1',
      status: 'ready',
      state: {
        match: true,
        labeled: true,
        hasContext: true,
        withValue: true,
        withSuggestion: true,
        error: false,
        obsolete: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_1',

      suggestedValue: 'labeled_match_context_value',
      entityTemplate: 'extractor_source_text_target_text_template',
      propertyName: 'target_text',
      language: 'es',
      segment: 'any_segment_1',
      status: 'ready',
      state: {
        match: true,
        labeled: true,
        hasContext: true,
        withValue: true,
        withSuggestion: true,
        error: false,
        obsolete: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_2',

      suggestedValue: 'any_value',
      entityTemplate: 'extractor_source_text_target_text_template',
      propertyName: 'target_text',
      language: 'es',
      segment: 'any_segment_2',
      status: 'ready',
      state: {
        labeled: true,
        hasContext: true,
        withValue: true,
        withSuggestion: true,
        match: false,
        error: false,
        obsolete: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_2',

      suggestedValue: 'any_value',
      entityTemplate: 'extractor_source_text_target_text_template',
      propertyName: 'target_text',
      language: 'en',
      segment: 'any_segment_2',
      status: 'ready',
      state: {
        labeled: true,
        hasContext: true,
        withValue: true,
        withSuggestion: true,
        match: false,
        error: false,
        obsolete: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_3',

      suggestedValue: 'any_value',
      entityTemplate: 'extractor_source_text_target_text_template',
      propertyName: 'target_text',
      language: 'en',
      segment: 'any_segment_3',
      status: 'ready',
      state: {
        hasContext: true,
        withSuggestion: true,
        labeled: false,
        withValue: false,
        match: false,
        error: false,
        obsolete: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_3',

      suggestedValue: 'any_value',
      entityTemplate: 'extractor_source_text_target_text_template',
      propertyName: 'target_text',
      language: 'es',
      segment: 'any_segment_3',
      status: 'ready',
      state: {
        hasContext: true,
        withSuggestion: true,
        labeled: false,
        withValue: false,
        match: false,
        error: false,
        obsolete: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_4',
      entityTemplate: 'extractor_source_text_target_text_template',

      propertyName: 'target_text',
      suggestedValue: '',
      language: 'en',
      segment: '',
      status: 'failed',
      state: {
        error: true,
        hasContext: false,
        withSuggestion: false,
        labeled: false,
        withValue: false,
        match: false,
        obsolete: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_4',
      entityTemplate: 'extractor_source_text_target_text_template',

      propertyName: 'target_text',
      suggestedValue: '',
      language: 'es',
      segment: '',
      status: 'failed',
      state: {
        error: true,
        withSuggestion: false,
        hasContext: false,
        labeled: false,
        withValue: false,
        match: false,
        obsolete: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_5',
      entityTemplate: 'extractor_source_text_target_text_template',

      propertyName: 'target_text',
      suggestedValue: '',
      language: 'en',
      segment: '',
      status: 'failed',
      state: {
        obsolete: true,
        error: false,
        hasContext: false,
        withSuggestion: false,
        labeled: false,
        withValue: false,
        match: false,
        processing: false,
      },
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_5',
      entityTemplate: 'extractor_source_text_target_text_template',

      propertyName: 'target_text',
      suggestedValue: '',
      language: 'es',
      segment: '',
      status: 'failed',
      state: {
        obsolete: true,
        error: false,
        withSuggestion: false,
        hasContext: false,
        labeled: false,
        withValue: false,
        match: false,
        processing: false,
      },
    }),
  ],
  files: [
    factory.document('extractor_source_pdf_target_text_entity_1_pdf_1', {
      language: 'en',
      entity: 'extractor_source_pdf_target_text_entity_1',
      extractedMetadata: [],
    }),

    factory.document('extractor_source_pdf_target_text_entity_1_pdf_2', {
      language: 'es',
      entity: 'extractor_source_pdf_target_text_entity_1',
      extractedMetadata: [{ name: 'target_text', selection: { text: 'labeled_value' } }],
    }),

    factory.document('extractor_source_pdf_target_text_entity_2_pdf_1', {
      language: 'en',
      entity: 'extractor_source_pdf_target_text_entity_2',
      extractedMetadata: [],
    }),

    factory.document('extractor_source_pdf_target_multiselect_entity_1_pdf_1', {
      language: 'en',
      entity: 'extractor_source_pdf_target_multiselect_entity_1',
      extractedMetadata: [],
    }),
  ],
};

describe('getSuggestionsForTableQuery', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should paginate correctly', async () => {
    const { sut } = createSut();
    const { suggestions, total, totalPages } = await sut.execute({
      extractorId: factory.id('extractor_source_text_target_text').toString(),
      pagination: {
        size: 2,
        number: 2,
      },
    });

    expect(total).toBe(10);
    expect(totalPages).toBe(5);
    expect(suggestions.length).toBe(2);
  });

  it('should return Suggestions for Extractor of PDF', async () => {
    const { sut } = createSut();
    const extractorId = factory.id('extractor_source_pdf_target_text');
    const { suggestions } = await sut.execute({
      extractorId: extractorId.toString(),
      pagination: {
        size: 2,
        number: 1,
      },
    });

    expect(suggestions[0]).toMatchObject({
      _id: expect.any(ObjectId),
      fileId: factory.id('extractor_source_pdf_target_text_entity_1_pdf_2'),
      entityTemplateId: factory.id('extractor_source_pdf_target_text_template'),
      extractorId,
      entityId: expect.any(ObjectId),
      sharedId: 'extractor_source_pdf_target_text_entity_1',

      language: 'es',
      entityTitle: 'extractor_source_pdf_target_text_entity_1',
      currentValue: 'labeled_match_context_value',
      suggestedValue: 'labeled_match_context_value',
      propertyName: 'target_text',
      segment: 'any_segment',
      error: '',
      date: 1001,
      state: {
        match: true,
        labeled: true,
        hasContext: true,
        withValue: true,
        withSuggestion: true,
        error: false,
        obsolete: false,
        processing: false,
      },
      extractedMetadata: [{ name: 'target_text', selection: expect.any(Object) }],
      labeledValue: 'labeled_value',
    });

    expect(suggestions[1]).toMatchObject({
      fileId: factory.id('extractor_source_pdf_target_text_entity_1_pdf_1'),
      entityTemplateId: factory.id('extractor_source_pdf_target_text_template'),
      extractorId,
      sharedId: 'extractor_source_pdf_target_text_entity_1',

      language: 'en',
      extractedMetadata: [],
      labeledValue: '',
    });
  });

  it('should return Suggestions for Extractor of Property', async () => {
    const { sut } = createSut();
    const extractorId = factory.id('extractor_source_text_target_text');
    const { suggestions } = await sut.execute({
      extractorId: extractorId.toString(),
      pagination: {
        size: 2,
        number: 1,
      },
    });

    expect(suggestions[0]).toMatchObject({
      _id: expect.any(ObjectId),
      entityTemplateId: factory.id('extractor_source_text_target_text_template'),
      extractorId,
      entityId: expect.any(ObjectId),
      sharedId: 'extractor_source_text_target_text_entity_1',

      language: 'es',
      entityTitle: 'extractor_source_text_target_text_entity_1',
      currentValue: 'labeled_match_context_value',
      suggestedValue: 'labeled_match_context_value',
      propertyName: 'target_text',
      segment: 'any_segment_1',
      error: '',
      date: 1001,
      state: {
        match: true,
        labeled: true,
        hasContext: true,
        withValue: true,
        withSuggestion: true,
        error: false,
        obsolete: false,
        processing: false,
      },
    });
  });

  // eslint-disable-next-line max-statements
  it('should filter by status state', async () => {
    const { sut } = createSut();
    const input = {
      extractorId: factory.id('extractor_source_text_target_text').toString(),
      pagination: {
        size: 2,
        number: 1,
      },
      filter: {
        match: false,
        error: false,
        labeled: false,
        mismatch: false,
        nonLabeled: false,
        obsolete: false,
      },
    };

    const [
      hasMatchOnly,
      hasMismatchOnly,
      hasLabeledOnly,
      hasNonLabeledOnly,
      hasErrorOnly,
      hasObsoleteOnly,
    ] = await Promise.all([
      sut.execute({
        ...input,
        filter: {
          ...input.filter,
          match: true,
        },
      }),
      sut.execute({
        ...input,
        filter: {
          ...input.filter,
          mismatch: true,
        },
      }),
      sut.execute({
        ...input,
        filter: {
          ...input.filter,
          labeled: true,
        },
      }),
      sut.execute({
        ...input,
        filter: {
          ...input.filter,
          nonLabeled: true,
        },
      }),
      sut.execute({
        ...input,
        filter: {
          ...input.filter,
          error: true,
        },
      }),
      sut.execute({
        ...input,
        filter: {
          ...input.filter,
          obsolete: true,
        },
      }),
    ]);

    expect(hasMatchOnly.suggestions.filter(s => s.state.match)).toHaveLength(2);

    expect(hasMismatchOnly.suggestions.filter(s => !s.state.match)).toHaveLength(2);

    expect(hasLabeledOnly.suggestions.filter(s => s.state.labeled)).toHaveLength(2);

    expect(hasNonLabeledOnly.suggestions.filter(s => !s.state.labeled)).toHaveLength(2);

    expect(hasErrorOnly.suggestions.filter(s => s.state.error)).toHaveLength(2);

    expect(hasObsoleteOnly.suggestions.filter(s => s.state.obsolete)).toHaveLength(2);
  });

  it('should sort', async () => {
    const { sut } = createSut();
    const input = {
      extractorId: factory.id('extractor_source_text_target_text').toString(),
      pagination: {
        size: 2,
        number: 1,
      },
      stateFilter: {
        match: false,
        error: false,
        labeled: false,
        mismatch: false,
        nonLabeled: false,
        obsolete: false,
      },
    };

    const [sortedByTitle, sortedBySegment, sortedByTargetPropertyValue] = await Promise.all([
      sut.execute({ ...input, sort: { property: 'entityTitle', order: 'asc' } }),
      sut.execute({ ...input, sort: { property: 'segment', order: 'asc' } }),
      sut.execute({ ...input, sort: { property: 'currentValue', order: 'desc' } }),
    ]);

    expect(sortedByTitle.suggestions).toMatchObject([
      {
        entityTitle: 'extractor_source_text_target_text_entity_1',
        language: 'es',
      },
      {
        entityTitle: 'extractor_source_text_target_text_entity_1',
        language: 'en',
      },
    ]);

    expect(sortedBySegment.suggestions).toMatchObject([
      {
        segment: 'any_segment_1',
        language: 'es',
      },
      {
        segment: 'any_segment_1',
        language: 'en',
      },
    ]);

    expect(sortedByTargetPropertyValue.suggestions).toMatchObject([
      {
        currentValue: 'labeled_no-match_context_value',
        language: 'en',
      },
      {
        currentValue: 'labeled_no-match_context_value',
        language: 'es',
      },
    ]);
  });

  describe('given suggestedValue is null', () => {
    it('when target property is single value should fallback to empty string', async () => {
      const { sut } = createSut();

      const { suggestions } = await sut.execute({
        extractorId: factory.id('extractor_source_pdf_target_text').toString(),
      });

      expect(
        suggestions.find(
          s =>
            s.fileId.toString() ===
            factory.id('extractor_source_pdf_target_text_entity_2_pdf_1').toString()
        )
      ).toMatchObject({ suggestedValue: '' });
    });

    it('when target property is multi value should fallback to empty array', async () => {
      const { sut } = createSut();

      const { suggestions } = await sut.execute({
        extractorId: factory.id('extractor_source_pdf_target_multiselect').toString(),
      });

      expect(
        suggestions.find(
          s =>
            s.fileId.toString() ===
            factory.id('extractor_source_pdf_target_multiselect_entity_1_pdf_1').toString()
        )
      ).toMatchObject({ suggestedValue: [] });
    });
  });
});
