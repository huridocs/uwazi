import { testingDB } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { factory as f, stateFilterFixtures } from './fixtures';
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
