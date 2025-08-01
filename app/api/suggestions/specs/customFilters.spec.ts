import { testingDB } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { factory as f, stateFilterFixtures, comprehensiveTestFixtures } from './fixtures';
import { Suggestions } from '../suggestions';

beforeAll(async () => {
  await testingEnvironment.setUp(stateFilterFixtures);
  await Suggestions.updateStates({});
});

afterAll(async () => testingEnvironment.tearDown());

describe('suggestions with CustomFilters', () => {
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

    it('should return count of noContext suggestions', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { hasContext: false } }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { hasContext: false } }),
          f.ixSuggestion({
            extractorId: f.id('another_extractor'),
            state: { hasContext: false },
          }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { hasContext: true } }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: {} }),
        ],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 4,
        noContext: 3,
      });
    });

    it('should return count of nonProcessed suggestions', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [
          f.ixSuggestion({ extractorId: f.id('test_extractor'), status: 'processing' }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), status: 'processing' }),
          f.ixSuggestion({
            extractorId: f.id('another_extractor'),
            status: 'processing',
          }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), status: 'ready' }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), status: 'failed' }),
        ],
        ixmodels: [
          {
            _id: testingDB.id(),
            status: 'ready',
            creationDate: 1000,
            extractorId: f.id('test_extractor'),
          },
        ],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 4,
        nonProcessed: 4,
      });
    });

    it('should handle nonProcessed filtering with timestamp comparison logic', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: undefined,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: {},
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: { findSuggestionsRunTimestamp: undefined },
          }),
          
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: { findSuggestionsRunTimestamp: 500 }, // older than model (1000)
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: { findSuggestionsRunTimestamp: 800 },
          }),
          
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: { findSuggestionsRunTimestamp: 1500 }, // newer than model (1000)
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: { findSuggestionsRunTimestamp: 2000 },
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: { findSuggestionsRunTimestamp: 3000 },
          }),
          
          f.ixSuggestion({
            extractorId: f.id('another_extractor'),
            status: 'ready',
            modelData: { findSuggestionsRunTimestamp: 500 },
          }),
        ],
        ixmodels: [
          {
            _id: testingDB.id(),
            status: 'ready',
            creationDate: 1000, // model training timestamp
            extractorId: f.id('test_extractor'),
          },
          {
            _id: testingDB.id(),
            status: 'ready',
            creationDate: 1000,
            extractorId: f.id('another_extractor'),
          },
        ],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 8,
        nonProcessed: 5, // 3 new + 2 obsolete
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
        noContext: 0,
        nonProcessed: 0,
      });
    });

    it('should handle all states combined in a comprehensive test', async () => {
      await testingDB.setupFixturesAndContext(comprehensiveTestFixtures);

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 9,
        labeled: 2,
        nonLabeled: 7,
        match: 2,
        mismatch: 7,
        obsolete: 2,
        error: 2,
        noContext: 4,
        nonProcessed: 6, // 3 without timestamp + 3 obsolete
      });
    });
  });
});
