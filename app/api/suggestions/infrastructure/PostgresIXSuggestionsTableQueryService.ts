import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import {
  IXSuggestionsTableQueryService,
  SuggestionSort,
  SuggestionStatusFilter,
  SuggestionTableRow,
  TableQuery,
} from '../domain/IXSuggestionsTableQueryService.js';
import { IX_SUGGESTIONS_COLUMN_TYPES, SuggestionColumn } from './PostgresIXSuggestionsMapper.js';
import type { IXSuggestionsRow } from './PostgresIXSuggestionsRow.js';
import {
  healthyPredicate,
  obsoletePredicate,
  stateFlagPredicate,
} from './postgresSuggestionPredicates.js';
import { toHex } from './postgresSuggestionQueries.js';

type Deps = Omit<PostgresDataSourceDeps, 'sync'>;

const tableName = 'ix_suggestions';

const isTrue = (flag: Parameters<typeof stateFlagPredicate>[0]) =>
  stateFlagPredicate(flag, true).sql;

/** Mongo's `{ 'state.x': false }`: a stored false, not an absent flag nor a null one. */
const isStoredFalse = (flag: Parameters<typeof stateFlagPredicate>[0]) =>
  `("state"->'${flag}') = 'false'::jsonb`;

const dated = '"date" IS NOT NULL';

const processed = `(${healthyPredicate.sql})`;

/** One predicate per status flag, with the rules of `filterFragments` in the Mongo sibling. */
const filterPredicates: Record<keyof SuggestionStatusFilter, string> = {
  labeled: isTrue('labeled'),
  nonLabeled: isStoredFalse('labeled'),
  useForTraining: '"useForTraining"',
  nonProcessed: '"date" IS NULL',
  obsolete: `(${obsoletePredicate.sql})`,
  error: `${dated} AND ${isTrue('error')}`,
  match: `${processed} AND ${isTrue('match')}`,
  mismatch: `${processed} AND ${isStoredFalse('match')}`,
  noContext: `${processed} AND ${isStoredFalse('hasContext')}`,
};

/** The selected flags OR-ed together, or nothing when none is selected. */
const statusPredicate = (statusFilter?: SuggestionStatusFilter) => {
  const selected = (Object.keys(filterPredicates) as (keyof SuggestionStatusFilter)[]).filter(
    flag => statusFilter?.[flag]
  );

  return selected.length
    ? selected.map(flag => `(${filterPredicates[flag]})`).join(' OR ')
    : undefined;
};

const isSortColumn = (field: string): field is SuggestionColumn | '_id' =>
  field === '_id' || Object.hasOwn(IX_SUGGESTIONS_COLUMN_TYPES, field);

/**
 * Mongo's ordering for one stored column: strings compared byte by byte, as `COLLATE "C"` does
 * where the database collation would not, and null or absent before everything ascending. For a
 * JSON column the string values are compared that way, and the rest after them by JSONB order.
 * Columns are qualified so none resolves to a projected alias: `entityId` is one.
 */
const orderTermsFor = (column: SuggestionColumn | '_id', order: 'asc' | 'desc') => {
  const direction = `${order.toUpperCase()} NULLS ${order === 'asc' ? 'FIRST' : 'LAST'}`;
  const qualified = `"${tableName}"."${column}"`;
  const type = column === '_id' ? 'text' : IX_SUGGESTIONS_COLUMN_TYPES[column];

  if (type === 'text') {
    return [`${qualified} COLLATE "C" ${direction}`];
  }

  if (type === 'jsonb') {
    const stringValue = `(CASE WHEN jsonb_typeof(${qualified}) = 'string' THEN ${qualified} #>> '{}' END)`;
    return [`${stringValue} COLLATE "C" ${direction}`, `${qualified} ${direction}`];
  }

  return [`${qualified} ${direction}`];
};

/**
 * The requested order, or entityTitle ascending when there is none or its field is not a stored
 * column: the field reaches SQL, so nothing else may name it. `_id` breaks ties, so a page holds
 * the same rows every time it is asked for.
 */
const orderClause = (sort?: SuggestionSort) => {
  const terms =
    sort?.field && sort.order && isSortColumn(sort.field)
      ? orderTermsFor(sort.field, sort.order)
      : orderTermsFor('entityTitle', 'asc');

  return [...terms, `"${tableName}"."_id" ASC`].join(', ');
};

/**
 * The table renames three stored fields: `sharedId` is the suggestion's `entityId`, and `entityId`
 * is the id of the language-specific entity document. Ids are the stored hex strings, which is what
 * the Mongo sibling's ObjectIds serialise to.
 */
const projection = [
  'entityId as sharedId',
  'entityLanguageId as entityId',
  'entityTemplate as entityTemplateId',
  'currentValue',
  'entityTitle',
  'language',
  '_id',
  'propertyName',
  'extractorId',
  'suggestedValue',
  'segment',
  'state',
  'date',
  'error',
  'fileId',
  'status',
  'useForTraining',
];

/**
 * Postgres implementation of {@link IXSuggestionsTableQueryService}, with the match, sort and
 * projection of the Mongo sibling. A NULL column is left out of the row, as Mongo leaves out an
 * absent field.
 */
export class PostgresIXSuggestionsTableQueryService
  extends PostgresDataSource<IXSuggestionsRow>
  implements IXSuggestionsTableQueryService
{
  constructor(deps: Deps) {
    super(tableName, deps);
  }

  async getForTable({ extractorId, statusFilter, sort, page }: TableQuery) {
    const byExtractor = this.table
      .query<SuggestionTableRow>()
      .where({ extractorId: toHex(extractorId) });
    const status = statusPredicate(statusFilter);
    const matching = status ? byExtractor.whereRaw(`(${status})`) : byExtractor;

    const [total, rows] = await Promise.all([
      matching.count(),
      matching
        .select(projection)
        .orderByRaw(orderClause(sort))
        .offset(page.skip)
        .limit(page.limit)
        .all(),
    ]);

    return { rows, total };
  }
}
