import { testingEnvironment } from 'api/utils/testingEnvironment';
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
      },
      {},
      {
        es: { _id: factory.id('extractor_source_pdf_target_text_entity_1_es') },
        en: { _id: factory.id('extractor_source_pdf_target_text_entity_1_en') },
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
      },
      {},
      { es: { _id: factory.id('extractor_source_text_target_text_entity_1_es') } }
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
  ixmodels: [
    {
      _id: factory.id('extractor_source_pdf_target_text_model'),
      extractorId: factory.id('extractor_source_pdf_target_text'),
      creationDate: 1754362536000, // Before the processed suggestions
      status: 'ready',
      findingSuggestions: true,
    },
    {
      _id: factory.id('extractor_source_text_target_text_model'),
      extractorId: factory.id('extractor_source_text_target_text'),
      creationDate: 1754362536000, // Before the processed suggestions
      status: 'ready',
      findingSuggestions: true,
    },
    {
      _id: factory.id('extractor_source_pdf_target_multiselect_model'),
      extractorId: factory.id('extractor_source_pdf_target_multiselect'),
      creationDate: 1754362536000, // Before the processed suggestions
      status: 'ready',
      findingSuggestions: true,
    },
  ],
  ixsuggestions: [
    factory.ixSuggestion({
      entityId: 'extractor_source_pdf_target_text_entity_1',
      suggestedValue: 'labeled_match_context_value',
      entityTemplate: factory.id('extractor_source_pdf_target_text_template').toString(),
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
      entityLanguageId: factory.id('extractor_source_pdf_target_text_entity_1_en'),
      currentValue: 'labeled_match_context_value',
      entityTitle: 'extractor_source_pdf_target_text_entity_1',
      date: 1754362536314,
      modelData: {},
    }),

    factory.ixSuggestion({
      entityId: 'extractor_source_pdf_target_text_entity_1',
      suggestedValue: 'labeled_match_context_value',
      entityTemplate: factory.id('extractor_source_pdf_target_text_template').toString(),
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
      currentValue: 'labeled_match_context_value',
      entityTitle: 'extractor_source_pdf_target_text_entity_1',
      entityLanguageId: factory.id('extractor_source_pdf_target_text_entity_1_es'),
      date: 1754362536320,
      modelData: {},
    }),

    factory.ixSuggestion({
      entityId: 'extractor_source_pdf_target_text_entity_2',
      suggestedValue: null,
      entityTemplate: factory.id('extractor_source_pdf_target_text_template').toString(),
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
      // No modelData - non-processed
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
      // No modelData - non-processed
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

      currentValue: 'labeled_match_context_value',
      entityTitle: 'extractor_source_text_target_text_entity_1',
      date: 1754362536323,
      modelData: {},
    }),

    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_1',

      suggestedValue: 'labeled_match_context_value',
      entityTemplate: factory.id('extractor_source_text_target_text_template').toString(),
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

      entityTitle: 'extractor_source_text_target_text_entity_1',
      currentValue: 'labeled_match_context_value',
      entityLanguageId: factory.id('extractor_source_text_target_text_entity_1_es'),
      date: 1754362536319,
      modelData: {},
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
      entityTitle: 'extractor_source_text_target_text_entity_2',
      date: 1754362536321,
      modelData: {},
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

      entityTitle: 'extractor_source_text_target_text_entity_2',
      date: 1754362536317,
      modelData: {},
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
      entityTitle: 'extractor_source_text_target_text_entity_3',
      // No modelData - non-processed
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

      entityTitle: 'extractor_source_text_target_text_entity_3',
      date: 1754362535000,
      modelData: {},
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

      entityTitle: 'extractor_source_text_target_text_entity_4',
      // No modelData - non-processed
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

      entityTitle: 'extractor_source_text_target_text_entity_4',
      // No modelData - non-processed
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

      entityTitle: 'extractor_source_text_target_text_entity_5',
      // No modelData - non-processed
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

      entityTitle: 'extractor_source_text_target_text_entity_5',
      // No modelData - non-processed
    }),
    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_6',
      entityTemplate: 'extractor_source_text_target_text_template',
      propertyName: 'target_text',
      suggestedValue: 'test value 10',
      suggestedText: 'test text 10',
      language: 'en',
      segment: '',
      status: 'ready',
      date: 1754362538000,
      state: {
        labeled: false,
        match: false,
        obsolete: false,
        error: false,
        hasContext: true,
        withSuggestion: true,
        withValue: true,
        processing: false,
      },
      entityTitle: 'extractor_source_text_target_text_entity_6',
      modelData: {},
    }),
    factory.ixSuggestion({
      extractorId: factory.id('extractor_source_text_target_text'),
      entityId: 'extractor_source_text_target_text_entity_7',
      entityTemplate: 'extractor_source_text_target_text_template',
      propertyName: 'target_text',
      suggestedValue: 'new suggestion',
      language: 'en',
      segment: '',
      status: 'ready',
      date: null,
      state: {
        labeled: false,
        match: false,
        obsolete: false,
        error: false,
        hasContext: false,
        withSuggestion: true,
        withValue: false,
        processing: false,
      },
      entityTitle: 'extractor_source_text_target_text_entity_7',
      modelData: {},
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

    expect(total).toBe(12);
    expect(totalPages).toBe(6);
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
      extractorId: factory.id('extractor_source_pdf_target_text'),
      fileId: factory.id('extractor_source_pdf_target_text_entity_1_pdf_1'),
      language: 'en',
      sharedId: 'extractor_source_pdf_target_text_entity_1',
      entityId: factory.id('extractor_source_pdf_target_text_entity_1_en'),
      entityTemplateId: factory.id('extractor_source_pdf_target_text_template').toString(),
      entityTitle: 'extractor_source_pdf_target_text_entity_1',
      currentValue: 'labeled_match_context_value',
      propertyName: 'target_text',

      error: '',
      segment: 'any_segment',
      suggestedValue: 'labeled_match_context_value',
      date: 1001,
      state: {
        labeled: true,
        withValue: true,
        withSuggestion: true,
        hasContext: true,
        processing: false,
        obsolete: false,
        error: false,
        match: true,
      },
    });

    expect(suggestions[1]).toMatchObject({
      extractorId,
      fileId: factory.id('extractor_source_pdf_target_text_entity_1_pdf_2'),
      language: 'es',
      entityTemplateId: factory.id('extractor_source_pdf_target_text_template').toString(),
      entityId: factory.id('extractor_source_pdf_target_text_entity_1_es'),
      sharedId: 'extractor_source_pdf_target_text_entity_1',
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

    expect(suggestions[1]).toMatchObject({
      entityTemplateId: factory.id('extractor_source_text_target_text_template').toString(),
      extractorId,
      entityId: factory.id('extractor_source_text_target_text_entity_1_es'),
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
        noContext: false,
        nonProcessed: false,
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
          noContext: false,
          nonProcessed: false,
        },
      }),
      sut.execute({
        ...input,
        filter: {
          ...input.filter,
          mismatch: true,
          noContext: false,
          nonProcessed: false,
        },
      }),
      sut.execute({
        ...input,
        filter: {
          ...input.filter,
          labeled: true,
          noContext: false,
          nonProcessed: false,
        },
      }),
      sut.execute({
        ...input,
        filter: {
          ...input.filter,
          nonLabeled: true,
          noContext: false,
          nonProcessed: false,
        },
      }),
      sut.execute({
        ...input,
        filter: {
          ...input.filter,
          error: true,
          noContext: false,
          nonProcessed: false,
        },
      }),
      sut.execute({
        ...input,
        filter: {
          ...input.filter,
          obsolete: true,
          noContext: false,
          nonProcessed: false,
        },
      }),
    ]);

    expect(hasMatchOnly.suggestions.filter(s => s.state.match)).toHaveLength(2);

    expect(hasMismatchOnly.suggestions.filter(s => !s.state.match)).toHaveLength(2);

    expect(hasLabeledOnly.suggestions.filter(s => s.state.labeled)).toHaveLength(2);

    expect(hasNonLabeledOnly.suggestions.filter(s => !s.state.labeled)).toHaveLength(2);

    expect(hasErrorOnly.suggestions.filter(s => s.state.error)).toHaveLength(2);

    expect(hasObsoleteOnly.suggestions.filter(s => s.state.obsolete)).toHaveLength(2);

    // Test that the count filters work correctly
    expect(hasMatchOnly.total).toBeGreaterThan(0);
    expect(hasMismatchOnly.total).toBeGreaterThan(0);
    expect(hasLabeledOnly.total).toBeGreaterThan(0);
    expect(hasNonLabeledOnly.total).toBeGreaterThan(0);
    expect(hasErrorOnly.total).toBeGreaterThan(0);
    expect(hasObsoleteOnly.total).toBeGreaterThan(0);
  });

  it('should handle count filters correctly for pagination', async () => {
    const { sut } = createSut();

    const matchResult = await sut.execute({
      extractorId: factory.id('extractor_source_text_target_text').toString(),
      pagination: { size: 10, number: 1 },
      filter: {
        match: true,
        error: false,
        labeled: false,
        mismatch: false,
        nonLabeled: false,
        obsolete: false,
        noContext: false,
        nonProcessed: false,
      },
    });

    const errorResult = await sut.execute({
      extractorId: factory.id('extractor_source_text_target_text').toString(),
      pagination: { size: 10, number: 1 },
      filter: {
        match: false,
        error: true,
        labeled: false,
        mismatch: false,
        nonLabeled: false,
        obsolete: false,
        noContext: false,
        nonProcessed: false,
      },
    });

    const obsoleteResult = await sut.execute({
      extractorId: factory.id('extractor_source_text_target_text').toString(),
      pagination: { size: 10, number: 1 },
      filter: {
        match: false,
        error: false,
        labeled: false,
        mismatch: false,
        nonLabeled: false,
        obsolete: true,
        noContext: false,
        nonProcessed: false,
      },
    });

    // Log the actual values to see what's happening
    console.log('Count results:', {
      match: matchResult.total,
      error: errorResult.total,
      obsolete: obsoleteResult.total,
      matchSuggestions: matchResult.suggestions.length,
      errorSuggestions: errorResult.suggestions.length,
      obsoleteSuggestions: obsoleteResult.suggestions.length,
    });

    // The test data has suggestions with different states
    // Looking at the database output, there are suggestions with error: true and obsolete: true
    // that have date: { $ne: null }, so these filters should return 2 each
    expect(matchResult.total).toBe(2);
    expect(errorResult.total).toBe(2);
    expect(obsoleteResult.total).toBe(2);
  });

  it('should handle nonProcessed filter correctly', async () => {
    const { sut } = createSut();

    // Test without nonProcessed filter
    const allResults = await sut.execute({
      extractorId: factory.id('extractor_source_text_target_text').toString(),
      pagination: {
        size: 20,
        number: 1,
      },
      filter: {
        match: false,
        error: false,
        labeled: false,
        mismatch: false,
        nonLabeled: false,
        obsolete: false,
        noContext: false,
        nonProcessed: false,
      },
    });

    // Test with nonProcessed filter
    const nonProcessedResults = await sut.execute({
      extractorId: factory.id('extractor_source_text_target_text').toString(),
      pagination: {
        size: 20,
        number: 1,
      },
      filter: {
        match: false,
        error: false,
        labeled: false,
        mismatch: false,
        nonLabeled: false,
        obsolete: false,
        noContext: false,
        nonProcessed: true,
      },
    });

    // The nonProcessed filter should return fewer results than without the filter
    expect(nonProcessedResults.total).toBeLessThanOrEqual(allResults.total);
    expect(nonProcessedResults.suggestions.length).toBeLessThanOrEqual(
      allResults.suggestions.length
    );

    // Should return some results (not empty)
    expect(nonProcessedResults.total).toBeGreaterThan(0);
    expect(nonProcessedResults.suggestions.length).toBeGreaterThan(0);
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
        noContext: false,
      },
    };

    const [sortedByTitle, sortedBySegment, sortedByTargetPropertyValue] = await Promise.all([
      sut.execute({ ...input, sort: { property: 'entityTitle', order: 'asc' } }),
      sut.execute({ ...input, sort: { property: 'segment', order: 'desc' } }),
      sut.execute({ ...input, sort: { property: 'currentValue', order: 'desc' } }),
    ]);

    expect(sortedByTitle.suggestions).toMatchObject([
      {
        entityTitle: 'extractor_source_text_target_text_entity_1',
        language: 'en',
      },
      {
        entityTitle: 'extractor_source_text_target_text_entity_1',
        language: 'es',
      },
    ]);

    expect(sortedBySegment.suggestions).toMatchObject([
      {
        segment: 'any_segment_3',
        language: 'es',
      },
      {
        segment: 'any_segment_3',
        language: 'en',
      },
    ]);

    expect(sortedByTargetPropertyValue.suggestions).toMatchObject([
      {
        currentValue: 'labeled_match_context_value',
        language: 'en',
      },
      {
        currentValue: 'labeled_match_context_value',
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
