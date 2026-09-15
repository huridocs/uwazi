import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTable } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { Suggestion } from '../domain/IXSuggestionsDataSource.js';
import {
  IXSuggestionsSampleQueryService,
  SampleQuery,
} from '../domain/IXSuggestionsSampleQueryService.js';
import type { IXSuggestionsRow } from './PostgresIXSuggestionsRow.js';
import { pendingPredicate, stateFlagPredicate } from './postgresSuggestionPredicates.js';
import { satisfying, toHex, toSuggestions } from './postgresSuggestionQueries.js';

type Deps = Omit<PostgresDataSourceDeps, 'sync'>;

/** Up to `size` rows of `query`, drawn at random; no query at all for a size of 0. */
const draw = async (query: PostgresTable<IXSuggestionsRow>, size: number): Promise<Suggestion[]> =>
  size > 0 ? toSuggestions(query.orderByRaw('random()').limit(size)) : [];

/**
 * Postgres implementation of {@link IXSuggestionsSampleQueryService}.
 *
 * Shares `pendingPredicate` with the counts the sizes were computed from: sampling a different set
 * than the one counted would hand the run rows it never accounted for.
 */
export class PostgresIXSuggestionsSampleQueryService
  extends PostgresDataSource<IXSuggestionsRow>
  implements IXSuggestionsSampleQueryService
{
  constructor(deps: Deps) {
    super('ix_suggestions', deps);
  }

  async sampleForProcess({ extractorId, statusFilter, sizes }: SampleQuery) {
    const pending = satisfying(
      this.table.where({ extractorId: toHex(extractorId) }),
      pendingPredicate(statusFilter)
    );

    const [unlabeled, labeled] = await Promise.all([
      draw(satisfying(pending, stateFlagPredicate('labeled', false)), sizes.unlabeled),
      draw(satisfying(pending, stateFlagPredicate('labeled', true)), sizes.labeled),
    ]);

    return [...unlabeled, ...labeled];
  }
}
