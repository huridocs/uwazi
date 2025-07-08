import { testingEnvironment } from 'api/utils/testingEnvironment';
import { SuggestionCustomFilter } from 'shared/types/suggestionType';
import { ObjectId } from 'mongodb';
import { DBFixture } from 'api/utils/testing_db';
import { Suggestions } from '../suggestions';
import { factory } from './fixtures';
import { GetSuggestionsForTableQuery } from '../getSuggestionsForTableQuery/getSuggestionsForTableQuery';

const blankCustomFilter: SuggestionCustomFilter = {
  labeled: false,
  nonLabeled: false,
  match: false,
  mismatch: false,
  obsolete: false,
  error: false,
};

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
  ],
  ixextractors: [
    factory.ixExtractor('extractor_source_pdf_target_text', 'target_text', [
      'extractor_source_pdf_target_text_template',
    ]),
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
      fileId: factory.id('extractor_source_pdf_target_text_entity_1_pdf_2'),
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
    }),
  ],
  files: [
    factory.document('extractor_source_pdf_target_text_entity_1_pdf_1', {
      language: 'en',
      entity: 'extractor_source_pdf_target_text_entity_1',
    }),

    factory.document('extractor_source_pdf_target_text_entity_1_pdf_2', {
      language: 'es',
      entity: 'extractor_source_pdf_target_text_entity_1',
    }),
  ],
};

describe('getSuggestionsForTableQuery', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    await Suggestions.updateStates({});
  });

  afterAll(async () => testingEnvironment.tearDown());

  // it('should paginate correctly', async () => {
  //   const { sut } = createSut();
  //   const { suggestions, total, totalPages } = await sut.execute({
  //     extractorId: factory.id('extractor_source_pdf_target_text'),
  //     paginationDto: {
  //       size: 2,
  //       number: 1,
  //     },
  //   });

  //   expect(total).toBe(14);
  //   expect(totalPages).toBe(7);
  //   expect(suggestions.length).toBe(2);
  // });

  fit('should return Suggestions for Extractor of PDF', async () => {
    const { sut } = createSut();
    const extractorId = factory.id('extractor_source_pdf_target_text');
    const { suggestions } = await sut.execute({
      extractorId,
      paginationDto: {
        size: 2,
        number: 1,
      },
    });

    expect(suggestions[0]).toMatchObject({
      _id: expect.any(ObjectId),
      fileId: factory.id('extractor_source_pdf_target_text_entity_1_pdf_2'),
      extractorId,
      entityId: expect.any(ObjectId),
      entityTemplateId: expect.any(ObjectId),
      sharedId: 'extractor_source_pdf_target_text_entity_1',

      language: 'es',
      entityTitle: 'extractor_source_pdf_target_text_entity_1',
      currentValue: 'labeled_match_context_value',
      suggestedValue: 'labeled_match_context_value',
      propertyName: 'target_text',
      segment: 'any_segment',
      error: '',
      date: 1001,
      state: expect.any(Object),
      // extractedMetadata: [{ name: 'target_text', selection: expect.any(Object) }],
    });
  });
});
