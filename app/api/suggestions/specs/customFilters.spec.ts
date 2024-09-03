import db, { DBFixture, testingDB } from 'api/utils/testing_db';
import { IXSuggestionType, SuggestionCustomFilter } from 'shared/types/suggestionType';
import { getIdMapper } from 'api/utils/fixturesFactory';
import { factory, stateFilterFixtures } from './fixtures';
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
      const file = stateFilterFixtures.files?.find(
        f => f._id?.toString() === factory.idString(fileId)
      );
      const entity = stateFilterFixtures.entities?.find(e => e.sharedId === file?.entity);

      return {
        _id: factory.id(`suggestion_for_${fileId}`),
        entityId: file?.entity,
        status: 'ready' as const,
        entityTemplate: entity?.template,
        language: file?.language,
        fileId: factory.id(fileId),
        propertyName: Object.keys(entity?.metadata || {})[0],
        extractorId: factory.id('test_extractor'),
        error: '',
        segment: '',
        suggestedValue,
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

    type PartialSuggestion = Partial<Omit<IXSuggestionType, 'state'>> & {
      state?: Partial<IXSuggestionType['state']>;
    };

    const nFactory = () => ({
      suggestion(props: PartialSuggestion): IXSuggestionType {
        const { state, ...otherProps } = props;

        return {
          _id: testingDB.id(),
          entityId: testingDB.id().toString(),
          status: 'ready' as const,
          entityTemplate: testingDB.id().toString(),
          language: 'en',
          fileId: testingDB.id().toString(),
          propertyName: 'propertyName',
          extractorId: testingDB.id(),
          error: '',
          segment: '',
          suggestedValue: '',
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
            ...state,
          },
          ...otherProps,
        };
      },
    });

    it('should return count of match and missmatch', async () => {
      const f = nFactory();

      await db.setupFixturesAndContext({
        ixsuggestions: [
          f.suggestion({ extractorId: factory.id('test_extractor'), state: { match: true } }),
          f.suggestion({ extractorId: factory.id('another_extractor'), state: { match: true } }),
          f.suggestion({ extractorId: factory.id('test_extractor'), state: { match: true } }),
          f.suggestion({ extractorId: factory.id('test_extractor'), state: { match: false } }),
        ],
      });

      const result = await Suggestions.aggregate(factory.id('test_extractor').toString());
      expect(result).toMatchObject({
        match: 2,
        mismatch: 1,
      });
    });

    it('should return count of labeled and non labeled suggestions', async () => {
      const f = nFactory();

      await db.setupFixturesAndContext({
        ixsuggestions: [
          f.suggestion({ extractorId: factory.id('test_extractor'), state: { labeled: true } }),
          f.suggestion({ extractorId: factory.id('another_extractor'), state: { labeled: true } }),
          f.suggestion({ extractorId: factory.id('test_extractor'), state: { labeled: false } }),
          f.suggestion({ extractorId: factory.id('test_extractor'), state: { labeled: false } }),
        ],
      });

      const result = await Suggestions.aggregate(factory.id('test_extractor').toString());
      expect(result).toMatchObject({
        labeled: 1,
        nonLabeled: 2,
      });
    });

    it('should return count of obsolete suggestions', async () => {
      const f = nFactory();

      await db.setupFixturesAndContext({
        ixsuggestions: [
          f.suggestion({ extractorId: factory.id('test_extractor'), state: { obsolete: true } }),
          f.suggestion({ extractorId: factory.id('test_extractor'), state: { obsolete: true } }),
          f.suggestion({ extractorId: factory.id('another_extractor'), state: { obsolete: true } }),
          f.suggestion({ extractorId: factory.id('test_extractor'), state: { obsolete: false } }),
          f.suggestion({ extractorId: factory.id('test_extractor'), state: {} }),
        ],
      });

      const result = await Suggestions.aggregate(factory.id('test_extractor').toString());
      expect(result).toMatchObject({
        obsolete: 2,
      });
    });

    it('should return count of errors in suggestions', async () => {
      const f = nFactory();

      await db.setupFixturesAndContext({
        ixsuggestions: [
          f.suggestion({ extractorId: factory.id('test_extractor'), state: { error: true } }),
          f.suggestion({ extractorId: factory.id('another_extractor'), state: { error: true } }),
          f.suggestion({ extractorId: factory.id('test_extractor'), state: {} }),
        ],
      });

      const result = await Suggestions.aggregate(factory.id('test_extractor').toString());
      expect(result).toMatchObject({
        error: 1,
      });
    });
  });
});
