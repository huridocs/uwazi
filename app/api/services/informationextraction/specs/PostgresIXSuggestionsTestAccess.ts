import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresIXSuggestionsMapper } from '#api/suggestions/infrastructure/PostgresIXSuggestionsMapper.js';
import type { IXSuggestionsRow } from '#api/suggestions/infrastructure/PostgresIXSuggestionsRow.js';
import { postgresTransactionManager } from '../infrastructure/contextTransactionManagers.js';
import {
  definedOnly,
  IXSuggestionsTestAccess,
  SuggestionFilter,
  SuggestionPatch,
} from './IXSuggestionsTestAccess.js';

type Deps = Omit<PostgresDataSourceDeps, 'sync'>;

/** Ids are stored as hex strings. */
const whereFor = ({ extractorId, fileId, ...rest }: SuggestionFilter) =>
  definedOnly({
    ...rest,
    extractorId: extractorId === undefined ? undefined : String(extractorId),
    fileId: fileId === undefined ? undefined : String(fileId),
  });

/** The patch as column changes; `state` and `modelData` are merged into the row's own. */
const changesFor = (
  row: IXSuggestionsRow,
  {
    useForTraining,
    trainingSample,
    date,
    obsolete,
    error,
    suggestionsRunTimestamp,
  }: SuggestionPatch
) => {
  const state = definedOnly({ obsolete, error });
  return definedOnly({
    useForTraining,
    trainingSample,
    date,
    state: Object.keys(state).length ? { ...row.state, ...state } : undefined,
    modelData:
      suggestionsRunTimestamp === undefined
        ? undefined
        : { ...row.modelData, suggestionsRunTimestamp },
  });
};

/**
 * Test-only access to `ix_suggestions`, the Postgres sibling of `MongoIXSuggestionsTestAccess`.
 *
 * **Not for production code.** Everything production needs is a named operation on the port.
 */
export class PostgresIXSuggestionsTestAccess
  extends PostgresDataSource<IXSuggestionsRow>
  implements IXSuggestionsTestAccess
{
  static default() {
    return new PostgresIXSuggestionsTestAccess({
      tenantId: ExecutionContext.currentTenant.name,
      pgTransactionManager: postgresTransactionManager(),
    });
  }

  constructor(deps: Deps) {
    super('ix_suggestions', deps);
  }

  async find(filter: SuggestionFilter) {
    const rows = await this.table.where(whereFor(filter)).all();
    return rows.map(row => PostgresIXSuggestionsMapper.toDomain(row));
  }

  async deleteMany(filter: SuggestionFilter) {
    await this.table.where(whereFor(filter)).delete();
  }

  async setOnMany(filter: SuggestionFilter, patch: SuggestionPatch) {
    const rows = await this.table.where(whereFor(filter)).all();
    await Promise.all(
      rows.map(async row => this.table.where({ _id: row._id }).update(changesFor(row, patch)))
    );
  }
}
