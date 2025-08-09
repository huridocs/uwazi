import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { CreateBlankSuggestionsFromDocument } from '../useCases/createBlankSuggestionsFromDocument';
import {
  ExtractorsNotAvailableError,
  FileTypeNotSupportedError,
  LanguageNotSupportedError,
} from '../ixValidationError';

const factory = getFixturesFactory();

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
    factory.ixExtractor('extractor_1', 'target_text', ['template_1']),
    factory.ixExtractor('extractor_2', 'target_text', ['template_2']),
    factory.ixExtractor('extractor_3', 'target_text', ['template_1'], {
      property: 'source_text',
    }),
    factory.ixExtractor('extractor_4', 'target_text', ['template_1']),
  ],
  templates: [
    factory.template('template_1', [
      factory.property('source_text', 'text'),
      factory.property('target_text', 'text'),
    ]),
    factory.template('template_2', [factory.property('target_text', 'text')]),
    factory.template('template_3', [factory.property('target_text', 'text')]),
  ],
  entities: [
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_1', 'template_1', {
      target_text: [{ value: 'text_target_value' }],
    }),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_2', 'template_1'),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_3', 'template_2'),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_4', 'template_3'),
  ],
};

describe('CreateBlankSuggestionsFromDocument', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create blank Suggestions for a Document', async () => {
    const useCase = new CreateBlankSuggestionsFromDocument();

    const file = factory.document('document_1', { entity: 'entity_1', language: 'en' });

    await useCase.execute({ file });

    const suggestions = await testingEnvironment.db.getAllFrom('ixsuggestions');

    expect(suggestions).toHaveLength(2);

    const fromExtractor1 = suggestions?.filter(
      s => s.extractorId.toString() === factory.id('extractor_1').toString()
    );

    const fromExtractor4 = suggestions?.filter(
      s => s.extractorId.toString() === factory.id('extractor_4').toString()
    );

    expect(fromExtractor1).toMatchObject([
      {
        extractorId: factory.id('extractor_1'),
        entityId: 'entity_1',
        entityTemplate: factory.id('template_1').toString(),
        fileId: factory.id('document_1'),

        language: 'en',
        propertyName: 'target_text',
        status: 'ready' as any,
        suggestedValue: '',
        error: '',
        segment: '',
        date: null,
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },

        currentValue: 'text_target_value',
        entityTitle: 'entity_1',
      },
    ]);

    expect(fromExtractor4).toMatchObject([
      {
        extractorId: factory.id('extractor_4'),
        entityId: 'entity_1',
        entityTemplate: factory.id('template_1').toString(),
        fileId: factory.id('document_1'),

        language: 'en',
        propertyName: 'target_text',
        status: 'ready' as any,
        suggestedValue: '',
        error: '',
        segment: '',
        date: null,
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },

        currentValue: 'text_target_value',
        entityTitle: 'entity_1',
      },
    ]);
  });

  it('should throw FileTypeNotSupportedError if the file is not a Document', async () => {
    const useCase = new CreateBlankSuggestionsFromDocument();

    const file = factory.file('file_1', { entity: 'entity_1', language: 'en' });

    await expect(useCase.execute({ file })).rejects.toThrow(
      new FileTypeNotSupportedError(file.type!)
    );
  });

  it("should throw LanguageNotSupportedError if Document's language is not supported", async () => {
    const useCase = new CreateBlankSuggestionsFromDocument();

    const file = factory.document('document_1', { entity: 'entity_1', language: 'fr' });

    await expect(useCase.execute({ file })).rejects.toThrow(
      new LanguageNotSupportedError(file.language!)
    );
  });

  it('should throw ExtractorsNotAvailableError if there are no Extractors for the Document', async () => {
    const useCase = new CreateBlankSuggestionsFromDocument();

    const file = factory.document('document_1', { entity: 'entity_4', language: 'en' });

    await expect(useCase.execute({ file })).rejects.toThrow(
      new ExtractorsNotAvailableError(factory.id('template_3').toString())
    );
  });
});
