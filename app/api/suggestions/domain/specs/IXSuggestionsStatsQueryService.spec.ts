import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { IXSuggestionStateType } from '#shared/types/suggestionType.js';
import { IXSuggestionsStatsQueryService } from '../IXSuggestionsStatsQueryService.js';
import { IXSuggestionsStatsQueryServiceFactory } from '../../infrastructure/IXSuggestionsStatsQueryServiceFactory.js';
import {
  extractors,
  f,
  fixtures,
  TENANT_ID,
  testConfigs,
  textSuggestion,
} from './IXSuggestionsContractFixtures.js';

type Sut = () => IXSuggestionsStatsQueryService;

const statsExtractor = f.id('stats extractor');

type State = Partial<Record<keyof IXSuggestionStateType, boolean | null>>;

type RowOptions = { date?: number | null; state?: State; unset?: string[] };

/**
 * A suggestion of the stats extractor; `unset` drops state flags the factory would default. Ids are
 * prefixed so they cannot collide with the shared fixtures loaded beside these.
 */
const row = (name: string, { date = 1000, state = {}, unset = [] }: RowOptions) => {
  const suggestion = textSuggestion(`stats ${name}`, {
    extractorId: statsExtractor,
    entityId: name,
    date,
    state: state as IXSuggestionStateType,
  });
  const kept = Object.entries(suggestion.state!).filter(([flag]) => !unset.includes(flag));
  return { ...suggestion, state: Object.fromEntries(kept) as IXSuggestionStateType };
};

const statsSuggestions = [
  {
    ...row('match', { state: { labeled: true, match: true, hasContext: true } }),
    useForTraining: true,
  },
  row('mismatch', { state: { labeled: true, match: false, hasContext: true } }),
  row('mismatch without context', { state: { labeled: true, match: false } }),
  row('unlabeled, null match', { state: { labeled: false, match: null, hasContext: true } }),
  row('unlabeled, no match', { state: { labeled: false, hasContext: true } }),
  row('null labeled, mismatch', { state: { labeled: null, match: false, hasContext: true } }),
  row('no labeled', { state: { hasContext: true }, unset: ['labeled'] }),
  row('obsolete match', { state: { labeled: true, match: true, obsolete: true } }),
  row('errored match', { state: { labeled: true, match: true, error: true } }),
  row('undated match', {
    date: null,
    state: { labeled: true, match: true, obsolete: true, error: true },
  }),
  (({ state, ...suggestion }) => suggestion)(row('stateless', {})),
];

/**
 * What the stats bar shows for `statsSuggestions`. `processed` is dated, not obsolete, not errored:
 * the first seven and `stateless`. `processedLabeled` — the accuracy denominator — is the first
 * three, one of which matches. `nonLabeled` and `mismatch` count a false flag and an absent one,
 * but not a null one: `no labeled` and `stateless` are nonLabeled, and `unlabeled, no match`,
 * `no labeled` and `stateless` are mismatches.
 */
const statsExtractorStats = {
  total: 11,
  labeled: 6,
  nonLabeled: 4,
  useForTraining: 1,
  nonProcessed: 1,
  obsolete: 1,
  error: 1,
  match: 1,
  mismatch: 6,
  noContext: 2,
  accuracy: 33.33,
};

const statsFixtures = {
  ixextractors: [
    ...fixtures.ixextractors!,
    f.ixExtractor('stats extractor', 'stats_property', ['template'], { property: 'source' }),
  ],
  ixsuggestions: [...fixtures.ixsuggestions!, ...statsSuggestions],
};

const statsOf = async (sut: Sut) => sut().getStatsForExtractor(statsExtractor);

const shapeCases = (sut: Sut) => {
  it('should return exactly the stats keys, for the extractor only', async () => {
    expect(await statsOf(sut)).toEqual(statsExtractorStats);
  });

  it('should return emptyStats, without useForTraining, for an extractor with no suggestions', async () => {
    expect(await sut().getStatsForExtractor(f.id('no suggestions'))).toEqual({
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
};

const tallyCases = (sut: Sut) => {
  /**
   * A null `labeled` counts towards neither side of the tally, but an absent one counts as
   * nonLabeled: Mongo's present-and-false test lets a missing field through.
   */
  it('should count labeled for a true flag, nonLabeled for a false or absent one, neither for null', async () => {
    expect(await statsOf(sut)).toMatchObject({ labeled: 6, nonLabeled: 4 });
  });

  /** An undated suggestion is nonProcessed whatever its state; obsolete and error count dated rows. */
  it('should count the statuses, an undated suggestion only as nonProcessed', async () => {
    expect(await statsOf(sut)).toMatchObject({ nonProcessed: 1, obsolete: 1, error: 1 });
  });

  /**
   * An obsolete, errored or undated suggestion that matched must not count, or the accuracy figure
   * drifts upwards over time on its own.
   */
  it('should count match only for processed rows with state.match true', async () => {
    expect(await statsOf(sut)).toMatchObject({ match: 1 });
  });

  /** Same rule as nonLabeled: a null match is not a mismatch, an absent one is. */
  it('should count mismatch for a false or absent match among processed rows, not for null', async () => {
    expect(await statsOf(sut)).toMatchObject({ mismatch: 6 });
  });

  it('should count noContext among processed rows without a true hasContext', async () => {
    expect(await statsOf(sut)).toMatchObject({ noContext: 2 });
  });

  it('should compute accuracy as match / processedLabeled * 100, rounded to 2', async () => {
    expect(await statsOf(sut)).toMatchObject({ accuracy: 33.33 });
    // the pdf extractor's suggestions are processed but none is labeled
    expect(await sut().getStatsForExtractor(extractors.pdf)).toMatchObject({
      total: 2,
      accuracy: 0,
    });
  });
};

/**
 * Fixtures are mirrored into both stores, so every other case would pass against the wrong one.
 * With the other store's suggestions gone, only the tenant's store can answer.
 */
const storeCases = (sut: Sut, usePostgres: boolean) => {
  it("should read from the tenant's store", async () => {
    if (usePostgres) {
      await testingDB.clear(['ixsuggestions']);
    } else {
      await testingPG.clear(['ix_suggestions']);
    }

    expect(await statsOf(sut)).toEqual(statsExtractorStats);
  });
};

/**
 * The IXSuggestionsStatsQueryService contract suite, run against the Mongo and the Postgres
 * implementation: the stats bar behind `GET /api/suggestions/aggregation`. The stats extractor's
 * suggestions sit beside the shared fixtures, so every case also proves the count is scoped to it.
 */
describe('IXSuggestionsStatsQueryService', () => {
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

      await testingEnvironment.setFixtures(statsFixtures);
    });

    const sut: Sut = () =>
      testingEnvironment.runWithContext(() => IXSuggestionsStatsQueryServiceFactory.default());

    shapeCases(sut);
    tallyCases(sut);
    storeCases(sut, usePostgres);
  });
});
