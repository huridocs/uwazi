import { ObjectId } from 'mongodb';
import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import type { PostgresTable } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { CurrentValue } from '#shared/getIXSuggestionState.js';
import { LanguagesListSchema } from '#shared/types/commonTypes.js';
import {
  IXSuggestionsStateQueryService,
  StateRecomputeQuery,
  StateRecomputeRow,
  StateRecomputeScope,
} from '../domain/IXSuggestionsStateQueryService.js';
import type { IXSuggestionsRow } from './PostgresIXSuggestionsRow.js';
import { toHex } from './postgresSuggestionQueries.js';

type Deps = Omit<PostgresDataSourceDeps, 'sync'>;

type StoredRow = Pick<
  IXSuggestionsRow,
  | '_id'
  | 'propertyName'
  | 'extractorId'
  | 'suggestedValue'
  | 'error'
  | 'date'
  | 'segment'
  | 'status'
> & { currentValue: CurrentValue[] };

const tableName = 'ix_suggestions';

const suggestion = (column: keyof IXSuggestionsRow | 'tenant_id') => `"${tableName}"."${column}"`;

const columns = [
  '_id',
  'propertyName',
  'extractorId',
  'suggestedValue',
  'error',
  'date',
  'segment',
  'status',
];

/**
 * The entity a suggestion is judged against: its own language when the instance has that language
 * configured, the default language otherwise.
 */
const entityLanguage = `CASE WHEN ${suggestion('language')} = ANY(?::text[]) THEN ${suggestion('language')} ELSE ? END`;

/**
 * The extractor's property dug out of that entity, or its title. Always an array, and `[]` when the
 * entity or the property is missing, as the Mongo pipeline gives.
 */
const currentValue = `COALESCE((
  SELECT CASE
    WHEN ${suggestion('propertyName')} = 'title' THEN jsonb_build_array(e."title")
    ELSE jsonb_path_query_array(e."metadata" -> ${suggestion('propertyName')}, '$[*].value')
  END
  FROM entities e
  WHERE e."tenant_id" = ${suggestion('tenant_id')}
    AND e."sharedId" = ${suggestion('entityId')}
    AND e."language" = ${entityLanguage}
), '[]'::jsonb) AS "currentValue"`;

const languageBindings = (languages: LanguagesListSchema) => [
  languages.map(language => language.key),
  languages.find(language => language.default)?.key ?? null,
];

const inScope = (query: PostgresTable<StoredRow>, scope: StateRecomputeScope) =>
  scope.kind === 'all' ? query : query.whereIn('_id', scope.ids.map(toHex));

/**
 * Asserts the port's row type as the Mongo sibling's `aggregate<StateRecomputeRow>` does: neither
 * store projects `obsolete`, which `SuggestionValues` declares and the state arithmetic never reads.
 */
const toRecomputeRow = ({ _id, extractorId, ...row }: StoredRow) =>
  ({
    ...row,
    _id: new ObjectId(_id),
    extractorId: new ObjectId(extractorId),
  }) as StateRecomputeRow;

/**
 * Postgres implementation of {@link IXSuggestionsStateQueryService}: the pairing is a correlated
 * subquery on `entities`, so rows stream straight off `ix_suggestions`.
 *
 * `entities` carries permission RLS. A recompute walks every suggestion whoever triggered it, so it
 * reads entities bypassing it; otherwise a collaborator's recompute would judge suggestions against
 * an empty value wherever they cannot see the entity.
 */
export class PostgresIXSuggestionsStateQueryService
  extends PostgresDataSource<IXSuggestionsRow>
  implements IXSuggestionsStateQueryService
{
  constructor(deps: Deps) {
    super(tableName, deps);
  }

  async *streamForStateRecompute({ scope, languages }: StateRecomputeQuery) {
    const rows = inScope(this.table.query<StoredRow>(), scope)
      .select(columns)
      .selectRaw(currentValue, languageBindings(languages))
      .stream({ bypass: true, refIds: [] });

    for await (const row of rows) {
      yield toRecomputeRow(row);
    }
  }
}
