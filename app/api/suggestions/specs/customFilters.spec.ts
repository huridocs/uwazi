import db from 'api/utils/testing_db';
import { SuggestionCustomFilter } from 'shared/types/suggestionType';
import { factory, stateFilterFixtures } from './fixtures';
import { Suggestions } from '../suggestions';

const blankCustomFilter: SuggestionCustomFilter = {
  labeled: {
    match: false,
    mismatch: false,
  },
  nonLabeled: {
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
    it('should return correct aggregation', async () => {
      const result = await Suggestions.aggregate(factory.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 12,
        labeled: {
          _count: 4,
          match: 2,
          mismatch: 2,
        },
        nonLabeled: {
          _count: 8,
          noSuggestion: 2,
          noContext: 4,
          obsolete: 2,
          others: 2,
        },
      });
    });
  });
});
