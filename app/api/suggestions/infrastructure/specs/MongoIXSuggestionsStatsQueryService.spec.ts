import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { IXSuggestionsStatsQueryServiceFactory } from '../IXSuggestionsStatsQueryServiceFactory.js';

const factory = getFixturesFactory();

const queryService = () => IXSuggestionsStatsQueryServiceFactory.default();

const extractorId = factory.id('extractor');
const otherExtractorId = factory.id('otherExtractor');

/**
 * Contract test for the stats bar behind `GET /api/suggestions/aggregation`.
 *
 * Written as a query-service spec rather than through `Suggestions.aggregate` so the Postgres
 * implementation of stage 6 has something to be verified against: every rule the mongo pipeline
 * encodes is asserted here, not merely exercised.
 */
describe('MongoIXSuggestionsStatsQueryService', () => {
  afterAll(async () => testingEnvironment.tearDown());

  describe('getStatsForExtractor', () => {
    it('should count only the suggestions of the given extractor', async () => {
      await testingEnvironment.setUp({
        ixsuggestions: [
          factory.ixSuggestion({ extractorId, state: { labeled: true } }),
          factory.ixSuggestion({ extractorId, state: { labeled: false } }),
          factory.ixSuggestion({ extractorId: otherExtractorId, state: { labeled: true } }),
        ],
      } as any);

      const stats = await queryService().getStatsForExtractor(extractorId);

      expect(stats).toMatchObject({ total: 2, labeled: 1, nonLabeled: 1 });
    });

    /**
     * `nonLabeled` is not "not labeled": a suggestion whose `state.labeled` is absent counts
     * towards neither side. Dropping that distinction would silently inflate the denominator the
     * sidepanel shows.
     */
    it('should not count a suggestion with no labeled state as either labeled or nonLabeled', async () => {
      await testingEnvironment.setUp({
        ixsuggestions: [
          factory.ixSuggestion({ extractorId, state: { labeled: true } }),
          factory.ixSuggestion({ extractorId, state: { labeled: undefined } as any }),
        ],
      } as any);

      const stats = await queryService().getStatsForExtractor(extractorId);

      expect(stats).toMatchObject({ total: 2, labeled: 1, nonLabeled: 0 });
    });

    it('should count useForTraining suggestions', async () => {
      await testingEnvironment.setUp({
        ixsuggestions: [
          factory.ixSuggestion({ extractorId, useForTraining: true }),
          factory.ixSuggestion({ extractorId, useForTraining: false }),
          factory.ixSuggestion({ extractorId }),
        ],
      } as any);

      const stats = await queryService().getStatsForExtractor(extractorId);

      expect(stats).toMatchObject({ total: 3, useForTraining: 1 });
    });

    describe('status counts', () => {
      it('should count an undated suggestion as nonProcessed, whatever its state', async () => {
        await testingEnvironment.setUp({
          ixsuggestions: [
            factory.ixSuggestion({ extractorId, date: null as any }),
            factory.ixSuggestion({
              extractorId,
              date: null as any,
              state: { obsolete: true, error: true },
            }),
            factory.ixSuggestion({ extractorId, date: 1000 }),
          ],
        } as any);

        const stats = await queryService().getStatsForExtractor(extractorId);

        expect(stats).toMatchObject({ total: 3, nonProcessed: 2, obsolete: 0, error: 0 });
      });

      it('should count dated obsolete and errored suggestions separately', async () => {
        await testingEnvironment.setUp({
          ixsuggestions: [
            factory.ixSuggestion({ extractorId, date: 1000, state: { obsolete: true } }),
            factory.ixSuggestion({ extractorId, date: 1000, state: { error: true } }),
            factory.ixSuggestion({ extractorId, date: 1000 }),
          ],
        } as any);

        const stats = await queryService().getStatsForExtractor(extractorId);

        expect(stats).toMatchObject({ total: 3, nonProcessed: 0, obsolete: 1, error: 1 });
      });
    });

    /**
     * match / mismatch / noContext describe *processed* suggestions only — dated, not obsolete,
     * not errored. An obsolete suggestion that happened to match before going stale must not be
     * counted, or the accuracy figure drifts upwards over time on its own.
     */
    describe('quality counts, restricted to processed suggestions', () => {
      it('should count match, mismatch and noContext among processed suggestions', async () => {
        await testingEnvironment.setUp({
          ixsuggestions: [
            factory.ixSuggestion({
              extractorId,
              date: 1000,
              state: { match: true, hasContext: true },
            }),
            factory.ixSuggestion({
              extractorId,
              date: 1000,
              state: { match: false, hasContext: false },
            }),
          ],
        } as any);

        const stats = await queryService().getStatsForExtractor(extractorId);

        expect(stats).toMatchObject({ total: 2, match: 1, mismatch: 1, noContext: 1 });
      });

      it('should not count an obsolete, errored or undated suggestion as a match', async () => {
        await testingEnvironment.setUp({
          ixsuggestions: [
            factory.ixSuggestion({
              extractorId,
              date: 1000,
              state: { match: true, obsolete: true },
            }),
            factory.ixSuggestion({ extractorId, date: 1000, state: { match: true, error: true } }),
            factory.ixSuggestion({ extractorId, date: null as any, state: { match: true } }),
          ],
        } as any);

        const stats = await queryService().getStatsForExtractor(extractorId);

        expect(stats).toMatchObject({ total: 3, match: 0, mismatch: 0 });
      });

      it('should not count a suggestion with no match state as a mismatch', async () => {
        await testingEnvironment.setUp({
          ixsuggestions: [
            factory.ixSuggestion({ extractorId, date: 1000, state: { match: undefined } as any }),
          ],
        } as any);

        const stats = await queryService().getStatsForExtractor(extractorId);

        expect(stats).toMatchObject({ total: 1, match: 0, mismatch: 0 });
      });
    });

    /**
     * The denominator is processed *labeled* suggestions; the numerator is the `match` tally,
     * which is not itself restricted to labeled rows. That is sound only because
     * `getIXSuggestionState` can set `match` only when a current value exists, which is the same
     * condition that sets `labeled` — so matches are a subset of labeled. A fixture that breaks
     * that invariant by hand can push the percentage over 100.
     */
    describe('accuracy', () => {
      it('should be the percentage of matches among processed labeled suggestions', async () => {
        await testingEnvironment.setUp({
          ixsuggestions: [
            factory.ixSuggestion({
              extractorId,
              date: 1000,
              state: { labeled: true, match: true },
            }),
            factory.ixSuggestion({
              extractorId,
              date: 1000,
              state: { labeled: true, match: false },
            }),
            factory.ixSuggestion({
              extractorId,
              date: 1000,
              state: { labeled: true, match: false },
            }),
            // unlabeled: neither numerator nor denominator
            factory.ixSuggestion({ extractorId, date: 1000, state: { match: false } }),
            // labeled but not processed: excluded from the denominator
            factory.ixSuggestion({
              extractorId,
              date: null as any,
              state: { labeled: true, match: false },
            }),
          ],
        } as any);

        const stats = await queryService().getStatsForExtractor(extractorId);

        expect(stats.accuracy).toBe(33.33);
      });

      it('should be 0 when no processed labeled suggestion exists', async () => {
        await testingEnvironment.setUp({
          ixsuggestions: [factory.ixSuggestion({ extractorId, date: null as any })],
        } as any);

        const stats = await queryService().getStatsForExtractor(extractorId);

        expect(stats.accuracy).toBe(0);
      });
    });

    it('should return zeroed stats for an extractor with no suggestions', async () => {
      await testingEnvironment.setUp({ ixsuggestions: [] } as any);

      const stats = await queryService().getStatsForExtractor(extractorId);

      expect(stats).toEqual({
        total: 0,
        labeled: 0,
        nonLabeled: 0,
        match: 0,
        mismatch: 0,
        obsolete: 0,
        error: 0,
        noContext: 0,
        nonProcessed: 0,
        accuracy: 0,
      });
    });

    /** `processedLabeled` is scratch space for the accuracy division, not part of the contract. */
    it('should not leak the accuracy denominator into the result', async () => {
      await testingEnvironment.setUp({
        ixsuggestions: [factory.ixSuggestion({ extractorId, state: { labeled: true } })],
      } as any);

      const stats = await queryService().getStatsForExtractor(extractorId);

      expect(stats).not.toHaveProperty('processedLabeled');
      expect(stats).not.toHaveProperty('_id');
    });
  });
});
