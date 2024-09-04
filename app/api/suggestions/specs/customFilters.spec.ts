import { testingDB } from 'api/utils/testing_db';
import { SuggestionCustomFilter } from 'shared/types/suggestionType';
import { factory as f, stateFilterFixtures } from './fixtures';
import { Suggestions } from '../suggestions';

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
  await testingDB.setupFixturesAndContext(stateFilterFixtures);
  await Suggestions.updateStates({});
});

afterAll(async () => testingDB.disconnect());

describe('suggestions with CustomFilters', () => {
  describe('get()', () => {
    it('should return all suggestions (except processing) when no custom filter is provided', async () => {
      const result = await Suggestions.get(
        {
          extractorId: f.id('test_extractor').toString(),
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
          extractorId: f.id('test_extractor').toString(),
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
            extractorId: f.id('test_extractor').toString(),
            customFilter,
          },
          {}
        );
        expect(result.suggestions).toMatchObject(expectedSuggestions);
      }
    );
  });

  describe('aggreagate()', () => {
    it('should return count of labeled and non labeled suggestions', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { labeled: true } }),
          f.ixSuggestion({
            extractorId: f.id('another_extractor'),
            state: { labeled: true },
          }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { labeled: false } }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { labeled: false } }),
        ],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 3,
        labeled: 1,
        nonLabeled: 2,
      });
    });

    it('should return count of match and missmatch', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { match: true } }),
          f.ixSuggestion({ extractorId: f.id('another_extractor'), state: { match: true } }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { match: true } }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { match: false } }),
        ],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 3,
        match: 2,
        mismatch: 1,
      });
    });

    it('should return count of obsolete suggestions', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { obsolete: true } }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { obsolete: true } }),
          f.ixSuggestion({
            extractorId: f.id('another_extractor'),
            state: { obsolete: true },
          }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { obsolete: false } }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: {} }),
        ],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 4,
        obsolete: 2,
      });
    });

    it('should return count of errors in suggestions', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { error: true } }),
          f.ixSuggestion({ extractorId: f.id('another_extractor'), state: { error: true } }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: {} }),
        ],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 2,
        error: 1,
      });
    });

    it('should correctly return all zeroes if no suggestions found', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 0,
        labeled: 0,
        nonLabeled: 0,
        match: 0,
        mismatch: 0,
        obsolete: 0,
        error: 0,
      });
    });
  });
});
