import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { Suggestion } from '../IXSuggestionsDataSource.js';
import {
  IXSuggestionsSampleQueryService,
  SampleQuery,
} from '../IXSuggestionsSampleQueryService.js';
import { IXSuggestionsSampleQueryServiceFactory } from '../../infrastructure/IXSuggestionsSampleQueryServiceFactory.js';
import {
  comparable,
  extractors,
  fixtures,
  suggestions,
  TENANT_ID,
  testConfigs,
} from './IXSuggestionsContractFixtures.js';

type Sut = () => IXSuggestionsSampleQueryService;

/**
 * The text extractor's pending suggestions in the shared fixtures: `pending` is undated and
 * labeled; `stateless` is undated with no state, `obsolete` and `errored` are dated and flagged, and
 * all three are unlabeled. `otherExtractor` is pending too, for another extractor.
 */
const { pending, stateless, obsolete, errored } = suggestions;
const unlabeledPending = [stateless, obsolete, errored];

const sample = async (sut: Sut, query: Partial<SampleQuery> = {}) =>
  sut().sampleForProcess({
    extractorId: extractors.text,
    sizes: { labeled: 10, unlabeled: 10 },
    ...query,
  });

const isLabeled = (suggestion: Suggestion) => suggestion.state?.labeled === true;

/**
 * The IXSuggestionsSampleQueryService contract suite, run against the Mongo and the Postgres
 * implementation. The draw is random, so cases assert counts and membership only. How big each half
 * should be is `balancedSampleSizes`, tested without a database.
 */
describe('IXSuggestionsSampleQueryService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresCore: usePostgres },
      });

      await testingEnvironment.setFixtures(fixtures);
    });

    const sut: Sut = () =>
      testingEnvironment.runWithContext(() => IXSuggestionsSampleQueryServiceFactory.default());

    it('should take exactly sizes.labeled labeled and sizes.unlabeled unlabeled pending rows', async () => {
      const sampled = await sample(sut, { sizes: { labeled: 1, unlabeled: 2 } });

      const unlabeled = sampled.filter(suggestion => !isLabeled(suggestion));
      expect(sampled).toHaveLength(3);
      expect(comparable(sampled.filter(isLabeled))).toEqual(comparable([pending]));
      expect(unlabeled).toHaveLength(2);
      expect(comparable(unlabeled)).toEqual(
        comparable(
          unlabeledPending.filter(({ _id }) => unlabeled.some(drawn => drawn._id.equals(_id)))
        )
      );
    });

    /**
     * The sizes are computed from a count over the same status filter, so sampling a different
     * set than the one counted would silently hand the run rows it had not accounted for.
     */
    it('should draw only from the filtered pending statuses of the extractor', async () => {
      expect(comparable(await sample(sut, { statusFilter: { error: true } }))).toEqual(
        comparable([errored])
      );
      expect(comparable(await sample(sut, { statusFilter: { nonProcessed: true } }))).toEqual(
        comparable([pending, stateless])
      );
      expect(comparable(await sample(sut))).toEqual(comparable([pending, ...unlabeledPending]));
    });

    it('should return fewer when fewer exist, and nothing for a size of 0', async () => {
      expect(await sample(sut, { sizes: { labeled: 0, unlabeled: 0 } })).toEqual([]);
      expect(comparable(await sample(sut, { sizes: { labeled: 0, unlabeled: 10 } }))).toEqual(
        comparable(unlabeledPending)
      );
    });

    /**
     * Fixtures are mirrored into both stores, so every other case would pass against the wrong
     * one. With the other store's suggestions gone, only the tenant's store can answer.
     */
    it("should read from the tenant's store", async () => {
      if (usePostgres) {
        await testingDB.clear(['ixsuggestions']);
      } else {
        await testingPG.clear(['ix_suggestions']);
      }

      expect(comparable(await sample(sut))).toEqual(comparable([pending, ...unlabeledPending]));
    });
  });
});
