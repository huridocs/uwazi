/* eslint-disable max-statements */
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
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: true },
            date: 1000,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: true },
            date: 1000,
          }),
          f.ixSuggestion({
            extractorId: f.id('another_extractor'),
            state: { obsolete: true },
          }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { obsolete: false } }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: true },
            date: null,
          }),
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
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { error: true },
            date: 1000,
          }),
          f.ixSuggestion({ extractorId: f.id('another_extractor'), state: { error: true } }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { error: true },
            date: null,
          }),
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
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { hasContext: false },
            date: 1000,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { hasContext: false },
            date: 1000,
          }),
          f.ixSuggestion({
            extractorId: f.id('another_extractor'),
            state: { hasContext: false },
          }),
          f.ixSuggestion({ extractorId: f.id('test_extractor'), state: { hasContext: true } }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { hasContext: false },
            date: null,
          }),
        ],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 4,
        noContext: 2,
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
        nonProcessed: 0,
      });
    });

    it('should handle nonProcessed filtering with timestamp comparison logic', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: {},
            date: null, // New suggestion - not processed
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: {},
            date: 500,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: {},
            date: 800,
          }),

          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: {},
            date: 1500,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: {},
            date: 2000,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            status: 'ready',
            modelData: {},
            date: 3000,
          }),

          f.ixSuggestion({
            extractorId: f.id('another_extractor'),
            status: 'ready',
            modelData: {},
            date: 500,
          }),
        ],
        ixmodels: [
          {
            _id: testingDB.id(),
            status: 'ready',
            creationDate: 1000,
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
        total: 6,
        nonProcessed: 1,
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

    it('should handle all states combined', async () => {
      await testingDB.setupFixturesAndContext(comprehensiveTestFixtures);

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 9,
        labeled: 2,
        nonLabeled: 7,
        match: 1,
        mismatch: 2,
        obsolete: 2,
        error: 1,
        noContext: 1,
        nonProcessed: 3,
        accuracy: 50,
      });
    });

    // Test filtering logic for pipelineStages.ts
    it('should filter obsolete suggestions excluding new suggestions', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: true },
            date: 1000,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: true },
            date: 2000,
          }),
          // New obsolete suggestions - should be excluded
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: true },
            date: null,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: true },
            date: null,
          }),
          // Non-obsolete suggestions - should be excluded
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: false },
            date: 1000,
          }),
        ],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 5,
        obsolete: 2, // Only processed obsolete suggestions
      });
    });

    it('should filter error suggestions excluding new suggestions', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [
          // Processed error suggestions - should be included
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { error: true },
            date: 1000,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { error: true },
            date: 2000,
          }),
          // New error suggestions - should be excluded
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { error: true },
            date: null,
          }),
          // Non-error suggestions - should be excluded
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { error: false },
            date: 1000,
          }),
        ],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 4,
        error: 2, // Only processed error suggestions
      });
    });

    it('should filter noContext suggestions excluding new suggestions', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [
          // Processed noContext suggestions - should be included
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { hasContext: false },
            date: 1000,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { hasContext: false },
            date: 2000,
          }),
          // New noContext suggestions - should be excluded
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { hasContext: false },
            date: null,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { hasContext: false },
            date: null,
          }),
          // Has context suggestions - should be excluded
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { hasContext: true },
            date: 1000,
          }),
        ],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 5,
        noContext: 2, // Only processed noContext suggestions
      });
    });

    it('should handle mixed states with new suggestions properly', async () => {
      await testingDB.setupFixturesAndContext({
        ixsuggestions: [
          // Processed suggestions with various states
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: true, error: false, hasContext: true },
            date: 1000,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: false, error: true, hasContext: false },
            date: 2000,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: false, error: false, hasContext: false },
            date: 3000,
          }),
          // New suggestions with various states - should be excluded from all counts
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: true, error: false, hasContext: true },
            date: null,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: false, error: true, hasContext: false },
            date: null,
          }),
          f.ixSuggestion({
            extractorId: f.id('test_extractor'),
            state: { obsolete: false, error: false, hasContext: false },
            date: null,
          }),
        ],
      });

      const result = await Suggestions.aggregate(f.id('test_extractor').toString());
      expect(result).toMatchObject({
        total: 6,
        obsolete: 1, // Only processed obsolete
        error: 1, // Only processed error
        noContext: 1, // Only processed noContext (1 processed suggestion)
        nonProcessed: 3, // All new suggestions
        accuracy: 0,
      });
    });

    describe('filter by useForTraining', () => {
      it('should return suggestions marked as useForTraining for the extractor', async () => {
        await testingDB.setupFixturesAndContext({
          ixsuggestions: [
            f.ixSuggestion({ extractorId: f.id('test_extractor'), useForTraining: true }),
            f.ixSuggestion({ extractorId: f.id('test_extractor'), useForTraining: true }),
            f.ixSuggestion({ extractorId: f.id('test_extractor'), useForTraining: false }),
            f.ixSuggestion({ extractorId: f.id('another_extractor'), useForTraining: true }),
          ],
        });

        const result = await Suggestions.aggregate(f.id('test_extractor').toString());
        expect(result.useForTraining).toBe(2);
      });
    });
  });
});
