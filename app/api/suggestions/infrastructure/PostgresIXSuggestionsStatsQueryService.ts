import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import {
  emptyStats,
  IXSuggestionsStatsQueryService,
  SuggestionStats,
} from '../domain/IXSuggestionsStatsQueryService.js';
import type { IXSuggestionsRow } from './PostgresIXSuggestionsRow.js';
import { toHex } from './postgresSuggestionQueries.js';

type Deps = Omit<PostgresDataSourceDeps, 'sync'>;

const flag = (name: string) => `("state"->'${name}')`;

const isTrue = (name: string) => `${flag(name)} = 'true'::jsonb`;

const notTrue = (name: string) => `${flag(name)} IS DISTINCT FROM 'true'::jsonb`;

/**
 * Mongo's present-and-false test: a false flag, or no flag at all — a missing key or a missing
 * `state` — but not a JSON null.
 */
const falseOrAbsent = (name: string) => `(${flag(name)} = 'false'::jsonb OR ${flag(name)} IS NULL)`;

const dated = '"date" IS NOT NULL';

/** Dated, and neither obsolete nor errored. */
const processed = `${dated} AND ${notTrue('obsolete')} AND ${notTrue('error')}`;

const tally = (condition: string) => `count(*) FILTER (WHERE ${condition})`;

const matches = tally(`${processed} AND ${isTrue('match')}`);

const processedLabeled = tally(`${processed} AND ${isTrue('labeled')}`);

/** Every tally of the stats bar in one pass over the extractor's suggestions. */
const statsColumns = [
  'count(*) AS "total"',
  `${tally(isTrue('labeled'))} AS "labeled"`,
  `${tally(falseOrAbsent('labeled'))} AS "nonLabeled"`,
  `${tally('"useForTraining"')} AS "useForTraining"`,
  `${tally('"date" IS NULL')} AS "nonProcessed"`,
  `${tally(`${dated} AND ${isTrue('obsolete')}`)} AS "obsolete"`,
  `${tally(`${dated} AND ${isTrue('error')}`)} AS "error"`,
  `${matches} AS "match"`,
  `${tally(`${processed} AND ${falseOrAbsent('match')}`)} AS "mismatch"`,
  `${tally(`${processed} AND ${notTrue('hasContext')}`)} AS "noContext"`,
  `COALESCE(round(${matches} * 100.0 / NULLIF(${processedLabeled}, 0), 2), 0)::float8 AS "accuracy"`,
].join(', ');

/**
 * Postgres implementation of {@link IXSuggestionsStatsQueryService}, with the tally rules of the
 * Mongo pipeline.
 *
 * `round` rounds half away from zero where Mongo's `$round` rounds half to even, so an accuracy
 * landing exactly on a third decimal of 5 can differ by 0.01.
 */
export class PostgresIXSuggestionsStatsQueryService
  extends PostgresDataSource<IXSuggestionsRow>
  implements IXSuggestionsStatsQueryService
{
  constructor(deps: Deps) {
    super('ix_suggestions', deps);
  }

  async getStatsForExtractor(extractorId: ObjectIdSchema): Promise<SuggestionStats> {
    const stats = await this.table
      .query<SuggestionStats>()
      .where({ extractorId: toHex(extractorId) })
      .selectRaw(statsColumns)
      .first();

    return stats?.total ? stats : { ...emptyStats };
  }
}
