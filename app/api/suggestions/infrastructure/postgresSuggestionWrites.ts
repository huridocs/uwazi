import { ObjectId } from 'mongodb';
import { PostgresTable } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { IX_SUGGESTIONS_COLUMN_TYPES, SuggestionColumn } from './PostgresIXSuggestionsMapper.js';
import type { IXSuggestionsRow } from './PostgresIXSuggestionsRow.js';

/**
 * The multi-row statements behind `PostgresIXSuggestionsDataSource`'s writes. Rows are the
 * mapper's partial rows: ids as hex, JSONB values as JSON text.
 */

type Table = PostgresTable<IXSuggestionsRow>;
type Row = Partial<IXSuggestionsRow>;

/** Rows per statement: at 21 columns a row, well under Postgres' 65,535 bind parameters. */
const BATCH_SIZE = 1000;

const inBatches = <T>(items: T[]): T[][] =>
  Array.from({ length: Math.ceil(items.length / BATCH_SIZE) }, (_, batch) =>
    items.slice(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE)
  );

const sequentially = async <T>(items: T[], run: (item: T) => Promise<unknown>) =>
  items.reduce<Promise<unknown>>(async (previous, item) => {
    await previous;
    return run(item);
  }, Promise.resolve());

/** Rows grouped by the set of columns they carry. */
const byColumns = (rows: Row[]) => {
  const groups = new Map<string, Row[]>();
  rows.forEach(row => {
    const key = Object.keys(row).sort().join();
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });
  return [...groups.values()];
};

/** The defaults the mongoose schema applied on insert, and a generated id when there is none. */
const withInsertDefaults = (row: Row): Row => ({
  status: 'processing',
  useForTraining: false,
  ...row,
  _id: row._id ?? new ObjectId().toHexString(),
});

const existingIds = async (table: Table, ids: string[]) =>
  (
    await Promise.all(
      inBatches(ids).map(async batch => table.whereIn('_id', batch).select(['_id']).all())
    )
  )
    .flat()
    .map(({ _id }) => _id);

const insertRows = async (table: Table, rows: Row[]) =>
  sequentially(inBatches(rows.map(withInsertDefaults)), async batch => table.insert(batch));

/**
 * The natural keys `019-create-ix-tables.sql` enforces, as `ON CONFLICT` targets: one suggestion
 * per entity and language for a text source, one per file for a pdf source. Both indexes are
 * partial, so their predicate is repeated here — Postgres infers a partial index only from a
 * target that carries it.
 */
const TEXT_KEY = '("tenant_id", "extractorId", "entityId", "language") WHERE "fileId" IS NULL';
const PDF_KEY = '("tenant_id", "extractorId", "fileId") WHERE "fileId" IS NOT NULL';

const naturalKey = (row: Row) =>
  row.fileId
    ? `pdf:${row.extractorId}:${row.fileId}`
    : `text:${row.extractorId}:${row.entityId}:${row.language}`;

const byNaturalKey = (rows: Row[]) => [
  ...new Map(rows.map(row => [naturalKey(row), row])).values(),
];

/**
 * Inserts the rows whose natural key is not taken yet. Blank suggestions are created for keys
 * another writer may already have covered — the extractor sweep and the entity-created listener
 * overlap on a new entity — and a repeated key must cost only its own row, not the batch it
 * travels in (F48). The stored suggestion wins: it may already be trained or accepted.
 *
 * Rows repeating a key within one batch are collapsed first, so the statement never asks Postgres
 * to resolve a conflict against a row it is inserting in the same command.
 */
const insertNewKeys = async (table: Table, rows: Row[]) =>
  sequentially(
    [
      { target: TEXT_KEY, group: byNaturalKey(rows.filter(row => !row.fileId)) },
      { target: PDF_KEY, group: byNaturalKey(rows.filter(row => row.fileId)) },
    ].filter(({ group }) => group.length),
    async ({ target, group }) =>
      sequentially(inBatches(group.map(withInsertDefaults)), async batch =>
        table.upsert(batch, { targetRaw: target, ignore: true })
      )
  );

const updateBatch = async (table: Table, rows: Row[]) => {
  const columns = Object.keys(rows[0]).filter(column => column !== '_id') as SuggestionColumn[];
  if (!columns.length) {
    return;
  }

  const values = `(?, ${columns.map(column => `?::${IX_SUGGESTIONS_COLUMN_TYPES[column]}`).join(', ')})`;
  await table.raw(
    `UPDATE ?? AS t SET ${columns.map(column => `"${column}" = v."${column}"`).join(', ')}
     FROM (VALUES ${rows.map(() => values).join(', ')})
       AS v("_id", ${columns.map(column => `"${column}"`).join(', ')})
     WHERE t."_id" = v."_id" AND t."tenant_id" = ?`,
    [
      table.tableName,
      ...rows.flatMap(row => [row._id, ...columns.map(column => row[column])]),
      table.tenantId,
    ]
  );
};

/**
 * One `UPDATE … FROM (VALUES …)` per set of columns, so each row gets exactly the fields it
 * carries, nulls included. Every value is cast to its column's type: `PostgresTable.bulkUpdate`
 * casts only object values to JSONB, and most `suggestedValue`s are strings.
 */
const updateRows = async (table: Table, rows: Row[]) =>
  sequentially(
    byColumns(rows).flatMap(group => inBatches(group)),
    async batch => updateBatch(table, batch)
  );

/**
 * Merge `state` flags into every suggestion of the extractor, in one statement. A `null` flag is
 * stored as JSON null, as Mongo's `$set` stores it. With an `outcome`, only the suggestions still
 * processing are touched, and they also take the outcome's columns.
 */
const mergeIntoState = async (
  table: Table,
  extractorId: string,
  { state, outcome }: { state: Record<string, boolean | null>; outcome?: Record<string, string> }
) => {
  const outcomeColumns = Object.entries(outcome ?? {});
  const setOutcome = outcomeColumns.map(([column]) => `"${column}" = ?, `).join('');
  const onlyProcessing = outcome ? ` AND "status" = 'processing'` : '';

  await table.raw(
    `UPDATE ?? SET ${setOutcome}"state" = COALESCE("state", '{}'::jsonb) || ?::jsonb
     WHERE "extractorId" = ? AND "tenant_id" = ?${onlyProcessing}`,
    [
      table.tableName,
      ...outcomeColumns.map(([, value]) => value),
      JSON.stringify(state),
      extractorId,
      table.tenantId,
    ]
  );
};

/** Existing rows take only the fields they carry; the rest are inserted with the defaults. */
const upsertRows = async (table: Table, rows: Row[]) => {
  const existing = new Set(
    await existingIds(
      table,
      rows.map(({ _id }) => _id!)
    )
  );
  await updateRows(
    table,
    rows.filter(({ _id }) => existing.has(_id!))
  );
  await insertRows(
    table,
    rows.filter(({ _id }) => !existing.has(_id!))
  );
};

/** Every suggestion of the extractor becomes obsolete, with an unknown match. */
const markObsolete = async (table: Table, extractorId: string) =>
  mergeIntoState(table, extractorId, { state: { obsolete: true, match: null } });

/** The suggestions still processing fail with the run's error, keeping no result. */
const failProcessing = async (table: Table, extractorId: string, error: string) =>
  mergeIntoState(table, extractorId, {
    state: {
      processing: false,
      error: true,
      match: null,
      withSuggestion: false,
      hasContext: false,
    },
    outcome: { status: 'failed', error },
  });

/** The suggestions still processing are released as obsolete, for the next run to pick up. */
const releaseProcessingAsObsolete = async (table: Table, extractorId: string) =>
  mergeIntoState(table, extractorId, {
    state: { processing: false, obsolete: true, match: null },
    outcome: { status: 'ready' },
  });

export {
  failProcessing,
  insertNewKeys,
  insertRows,
  markObsolete,
  releaseProcessingAsObsolete,
  updateRows,
  upsertRows,
};
