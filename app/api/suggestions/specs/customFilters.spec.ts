import db, { DBFixture } from 'api/utils/testing_db';
import { IXSuggestionType, SuggestionCustomFilter } from 'shared/types/suggestionType';
import { factory, stateFilterFixtures } from './fixtures';
import { Suggestions } from '../suggestions';
import { getIdMapper } from 'api/utils/fixturesFactory';

const blankCustomFilter: SuggestionCustomFilter = {
  labeled: {
    match: false,
    mismatch: false,
  },
  nonLabeled: {
    withSuggestion: false,
    noSuggestion: false,
    noContext: false,
    obsolete: false,
    others: false,
  },
};

beforeAll(async () => {
  await db.setupFixturesAndContext(stateFilterFixtures);
  await Suggestions.updateStates({});
});

afterAll(async () => db.disconnect());

describe('suggestions with CustomFilters', () => {
  describe('get()', () => {
    it('should return all suggestions (except processing) when no custom filter is provided', async () => {
      const result = await Suggestions.get(
        {
          extractorId: factory.id('test_extractor').toString(),
        },
        {}
      );
      expect(result.suggestions).toMatchObject([
        { sharedId: 'unlabeled-obsolete', language: 'en' },
        { sharedId: 'unlabeled-obsolete', language: 'es' },
        { sharedId: 'labeled-match', language: 'en' },
        { sharedId: 'labeled-match', language: 'es' },
        { sharedId: 'labeled-mismatch', language: 'en' },
        { sharedId: 'labeled-mismatch', language: 'es' },
        { sharedId: 'unlabeled-error', language: 'en' },
        { sharedId: 'unlabeled-error', language: 'es' },
        { sharedId: 'unlabeled-no-context', language: 'en' },
        { sharedId: 'unlabeled-no-context', language: 'es' },
        { sharedId: 'unlabeled-no-suggestion', language: 'en' },
        { sharedId: 'unlabeled-no-suggestion', language: 'es' },
      ]);
    });

    it('should be able to paginate', async () => {
      const result = await Suggestions.get(
        {
          extractorId: factory.id('test_extractor').toString(),
        },
        { page: { number: 3, size: 2 } }
      );
      expect(result.suggestions).toMatchObject([
        { sharedId: 'labeled-mismatch', language: 'es' },
        { sharedId: 'labeled-mismatch', language: 'en' },
      ]);
    });

    it.each([
      {
        description: 'filtering for labeled - match',
        customFilter: {
          ...blankCustomFilter,
          labeled: {
            match: true,
            mismatch: false,
          },
        },
        expectedSuggestions: [
          { sharedId: 'labeled-match', language: 'en' },
          { sharedId: 'labeled-match', language: 'es' },
        ],
      },
      {
        description: 'filtering for labeled - mismatch',
        customFilter: {
          ...blankCustomFilter,
          labeled: {
            match: false,
            mismatch: true,
          },
        },
        expectedSuggestions: [
          { sharedId: 'labeled-mismatch', language: 'en' },
          { sharedId: 'labeled-mismatch', language: 'es' },
        ],
      },
      {
        description: 'filtering for nonLabeled - withSuggestion',
        customFilter: {
          ...blankCustomFilter,
          nonLabeled: {
            ...blankCustomFilter.nonLabeled,
            withSuggestion: true,
          },
        },
        expectedSuggestions: [
          { sharedId: 'unlabeled-obsolete', language: 'en' },
          { sharedId: 'unlabeled-obsolete', language: 'es' },
          { sharedId: 'unlabeled-error', language: 'en' },
          { sharedId: 'unlabeled-error', language: 'es' },
          { sharedId: 'unlabeled-no-context', language: 'en' },
          { sharedId: 'unlabeled-no-context', language: 'es' },
        ],
      },
      {
        description: 'filtering for nonLabeled - noSuggestion',
        customFilter: {
          ...blankCustomFilter,
          nonLabeled: {
            ...blankCustomFilter.nonLabeled,
            noSuggestion: true,
          },
        },
        expectedSuggestions: [
          { sharedId: 'unlabeled-no-suggestion', language: 'en' },
          { sharedId: 'unlabeled-no-suggestion', language: 'es' },
        ],
      },
      {
        description: 'filtering for nonLabeled - withSuggestions and noSuggestion',
        customFilter: {
          ...blankCustomFilter,
          nonLabeled: {
            ...blankCustomFilter.nonLabeled,
            withSuggestion: true,
            noSuggestion: true,
          },
        },
        expectedSuggestions: [
          { sharedId: 'unlabeled-obsolete', language: 'en' },
          { sharedId: 'unlabeled-obsolete', language: 'es' },
          { sharedId: 'unlabeled-error', language: 'en' },
          { sharedId: 'unlabeled-error', language: 'es' },
          { sharedId: 'unlabeled-no-context', language: 'en' },
          { sharedId: 'unlabeled-no-context', language: 'es' },
          { sharedId: 'unlabeled-no-suggestion', language: 'en' },
          { sharedId: 'unlabeled-no-suggestion', language: 'es' },
        ],
      },
      {
        description: 'filtering for nonLabeled - noContext',
        customFilter: {
          ...blankCustomFilter,
          nonLabeled: {
            ...blankCustomFilter.nonLabeled,
            noContext: true,
          },
        },
        expectedSuggestions: [
          { sharedId: 'unlabeled-no-context', language: 'en' },
          { sharedId: 'unlabeled-no-context', language: 'es' },
          { sharedId: 'unlabeled-no-suggestion', language: 'en' },
          { sharedId: 'unlabeled-no-suggestion', language: 'es' },
        ],
      },
      {
        description: 'filtering for nonLabeled - obsolete',
        customFilter: {
          ...blankCustomFilter,
          nonLabeled: {
            ...blankCustomFilter.nonLabeled,
            obsolete: true,
          },
        },
        expectedSuggestions: [
          { sharedId: 'unlabeled-obsolete', language: 'en' },
          { sharedId: 'unlabeled-obsolete', language: 'es' },
        ],
      },
      {
        description: 'filtering for nonLabeled - others',
        customFilter: {
          ...blankCustomFilter,
          nonLabeled: {
            ...blankCustomFilter.nonLabeled,
            others: true,
          },
        },
        expectedSuggestions: [
          { sharedId: 'unlabeled-error', language: 'en' },
          { sharedId: 'unlabeled-error', language: 'es' },
        ],
      },
      {
        description: 'filtering for labeled - match and nonLabeled - obsolete',
        customFilter: {
          ...blankCustomFilter,
          labeled: {
            match: true,
            mismatch: false,
          },
          nonLabeled: {
            ...blankCustomFilter.nonLabeled,
            obsolete: true,
          },
        },
        expectedSuggestions: [
          { sharedId: 'unlabeled-obsolete', language: 'en' },
          { sharedId: 'unlabeled-obsolete', language: 'es' },
          { sharedId: 'labeled-match', language: 'en' },
          { sharedId: 'labeled-match', language: 'es' },
        ],
      },
      {
        description: 'filtering for nonLabeled - noSuggestion and nonLabeled - noContext',
        customFilter: {
          ...blankCustomFilter,
          nonLabeled: {
            ...blankCustomFilter.nonLabeled,
            noSuggestion: true,
            noContext: true,
          },
        },
        expectedSuggestions: [
          { sharedId: 'unlabeled-no-context', language: 'en' },
          { sharedId: 'unlabeled-no-context', language: 'es' },
          { sharedId: 'unlabeled-no-suggestion', language: 'en' },
          { sharedId: 'unlabeled-no-suggestion', language: 'es' },
        ],
      },
    ])(
      'should use the custom filter properly when $description',
      async ({ customFilter, expectedSuggestions }) => {
        const result = await Suggestions.get(
          {
            extractorId: factory.id('test_extractor').toString(),
            customFilter,
          },
          {}
        );
        expect(result.suggestions).toMatchObject(expectedSuggestions);
      }
    );
  });

  describe('aggreagate()', () => {
    const suggestion = (fileId: string, suggestedValue: string) => {
      const file = stateFilterFixtures.files.find(
        f => f._id?.toString() === factory.idString(fileId)
      );
      const entity = stateFilterFixtures.entities.find(e => {
        return e.sharedId === file?.entity;
      });
      return {
        _id: factory.id(`suggestion_for_${fileId}`),
        entityId: file.entity,
        status: 'ready' as const,
        entityTemplate: entity?.template,
        language: file?.language,
        fileId: factory.id(fileId),
        propertyName: Object.keys(entity.metadata)[0],
        extractorId: factory.id('test_extractor'),
        error: '',
        segment: '',
        suggestedValue: suggestedValue,
        date: 1001,
        state: {
          labeled: false,
          withValue: true,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },
      } as IXSuggestionType;
    };

    // fit('should return count of labeled and non labeled suggestions', async () => {
    //   stateFilterFixtures.entities = [
    //     ...factory.entityInMultipleLanguages(['es', 'en'], 'labeled-match', 'template1', {
    //       testprop: [{ value: 'test-labeled-match' }],
    //     }),
    //     ...factory.entityInMultipleLanguages(['es', 'en'], 'unlabeled-no-suggestion', 'template1', {
    //       testprop: [{ value: 'test-unlabeled-no-suggestion' }],
    //     }),
    //   ];
    //   stateFilterFixtures.files = [
    //     factory.document('labeled-match', {
    //       extractedMetadata: [factory.fileExtractedMetadata('testprop', 'labeled-value')],
    //     }),
    //     factory.document('unlabeled-no-suggestion'),
    //   ];
    //   await db.setupFixturesAndContext({
    //     ...stateFilterFixtures,
    //     ixsuggestions: [
    //       suggestion('document_for_labeled-match', 'test-labeled-match'),
    //       suggestion('document_for_unlabeled-no-suggestion', 'test-labeled-match'),
    //     ],
    //   });
    //
    //   await Suggestions.updateStates({});
    //
    //   const result = await Suggestions.aggregate(factory.id('test_extractor').toString());
    //   expect(result).toMatchObject({
    //     labeled: {
    //       _count: 1,
    //     },
    //     nonLabeled: {
    //       _count: 1,
    //     },
    //   });
    // });

    const nFactory = (dbFixtures: DBFixture) => {
      return {
        suggestion(props: Partial<IXSuggestionType>): IXSuggestionType { 
          return {

          }
        },
      };
    };

    fit('should return count of match and missmatch', async () => {
      //in this scenario only match should matter for the aggregation, nothing else
      await db.setupFixturesAndContext({
        ixsuggestions: [
          { extractorId: factory.id('test_extractor'), state: { match: true } },
          { extractorId: factory.id('test_extractor'), state: { match: false } },
        ],
      });

      const result = await Suggestions.aggregate(factory.id('test_extractor').toString());
      expect(result).toMatchObject({
        labeled: {
          match: 1,
          mismatch: 1,
        },
      });
    });

    fit('should return count of labeled and non labeled suggestions', async () => {
      //in this scenario match should not be necessary to pass the test
      await db.setupFixturesAndContext({
        ixsuggestions: [
          { extractorId: factory.id('test_extractor'), state: { match: false, labeled: true } },
          { extractorId: factory.id('test_extractor'), state: { labeled: false } },
        ],
      });

      const result = await Suggestions.aggregate(factory.id('test_extractor').toString());
      expect(result).toMatchObject({
        labeled: {
          _count: 1,
        },
        nonLabeled: {
          _count: 1,
        },
      });
    });

    fit('should return count of obsolete suggestions', async () => {
      //in this scenatio we need to only filter by obsolete and not by labeled
      await db.setupFixturesAndContext({
        ixsuggestions: [
          { extractorId: factory.id('test_extractor'), state: { labeled: false, obsolete: true } },
          { extractorId: factory.id('test_extractor'), state: { labeled: false } },
        ],
      });

      const result = await Suggestions.aggregate(factory.id('test_extractor').toString());
      expect(result).toMatchObject({
        nonLabeled: {
          obsolete: 1,
        },
      });
    });

    it('should return correct aggregation', async () => {
      // const newFactory = {};
      // newFactory.suggestion(
      //   newFactory.file(newFactory.entity('entity_id', { prop: { value: 'test_value' } })),
      //   'suggested_value'
      // );
      //
      await db.setupFixturesAndContext({
        ...stateFilterFixtures,
        ixsuggestions: [
          suggestion('label-match-file-en', 'test-labeled-match'),
          suggestion({ file: 'label-match-file-en', suggestionValue: 'test-labeled-match' }),
          suggestion('label-match-file-es', 'test-labeled-match'),
          suggestion('label-mismatch-file-en', 'test-labeled-mismatch-mismatch'),
          suggestion('label-mismatch-file-es', 'test-labeled-mismatch-mismatch'),
          suggestion('unlabeled-no-suggestion-file-en', ''),
          suggestion('unlabeled-no-suggestion-file-es', ''),
          suggestion('unlabeled-no-context-file-en', 'test-unlabeled-no-context'),
          suggestion('unlabeled-no-context-file-es', 'test-unlabeled-no-context'),
          {
            ...suggestion('unlabeled-obsolete-file-en', 'test-unlabeled-obsolete'),
            segment: 'test-unlabeled-obsolete', // no context aggregation
            date: 0, // obsolete aggregation
          },
          {
            ...suggestion('unlabeled-obsolete-file-es', 'test-unlabeled-obsolete'),
            segment: 'test-unlabeled-obsolete', // no context aggregation
            date: 0, // obsolete aggregation
          },
          {
            ...suggestion('unlabeled-processing-file-en', 'test-unlabeled-processing'),
            status: 'processing', // withSuggestion aggregation should not have processing ones
          },
          {
            ...suggestion('unlabeled-processing-file-es', 'test-unlabeled-processing'),
            status: 'processing', // withSuggestion aggregation should not have processing ones
          },
          {
            ...suggestion('unlabeled-error-file-en', 'test-unlabeled-error'),
            segment: 'test-unlabeled-error', // no context aggregation
            status: 'failed',
          },
          {
            ...suggestion('unlabeled-error-file-es', 'test-unlabeled-error'),
            segment: 'test-unlabeled-error', // no context aggregation
            status: 'failed',
          },
        ],
      });
      await Suggestions.updateStates({});
      const result = await Suggestions.aggregate(factory.id('test_extractor').toString());
      expect(result).toEqual({
        total: 12,
        labeled: {
          _count: 4,
          match: 2,
          mismatch: 2,
        },
        nonLabeled: {
          _count: 8,
          withSuggestion: 6,
          noSuggestion: 2,
          noContext: 4,
          obsolete: 2,
          others: 2,
        },
      });
    });
  });
});
