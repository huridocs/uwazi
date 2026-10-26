import { ObjectId, Db } from 'mongodb';
import { Knex } from 'knex';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { LoggerFactory } from '../../../factories/LoggerFactory.js';
import { PostgresTable } from '../../common/PostgresTable.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { Statements } from '../../common/Statement.js';

const UPDATE_LOGS_BATCH_SIZE = 50;
const CONFLICT_COLUMNS = ['tenant_id', 'namespace', 'id'];
const SYSTEM_PERMISSION_CONTEXT = { bypass: true, refIds: [] as string[] };

type UpdateLogRow = {
  id: string;
  namespace: unknown;
  timestamp: unknown;
  deleted: boolean;
  tenant_id?: string;
};

type CopyResult = { migrated: number; orphansSkipped: number; skipped: boolean };

type CopyOptions = { force?: boolean };

const mapUpdateLog = (doc: Record<string, unknown>): UpdateLogRow => {
  const { mongoId, namespace, timestamp, deleted } = doc;
  const id = mongoId instanceof ObjectId ? mongoId.toHexString() : String(mongoId);
  return {
    id,
    namespace,
    timestamp,
    deleted: Boolean(deleted),
  };
};

const logKey = (row: UpdateLogRow): string => `${String(row.namespace)}\0${row.id}`;

/** One insert cannot update the same row twice, so a batch keeps the later timestamp. */
const collapseToLatest = (rows: UpdateLogRow[]): UpdateLogRow[] => {
  const kept = new Map<string, UpdateLogRow>();
  rows.forEach(row => {
    const key = logKey(row);
    const current = kept.get(key);
    if (!current || Number(row.timestamp) > Number(current.timestamp)) {
      kept.set(key, row);
    }
  });
  return [...kept.values()];
};

const tableFor = (tenantId: string): PostgresTable => {
  const transactionManager = new PostgresTransactionManager(
    PostgresDB.knex,
    tenantId,
    LoggerFactory.systemLogger()
  );
  return PostgresTable.for({
    tableName: 'updatelogs',
    tenantId,
    transactionManager,
    accessContext: AccessContext.system(),
  });
};

/** Inserts the rows, keeping on each conflict whichever log is the most recent. */
const insertKeepingLatest = (rows: UpdateLogRow[]): Knex.QueryBuilder =>
  Statements.builder('updatelogs')
    .insert(rows)
    .onConflict(CONFLICT_COLUMNS)
    .merge(['timestamp', 'deleted'])
    .where(Statements.fragment('??.?? < excluded.??', ['updatelogs', 'timestamp', 'timestamp']));

const insertBatch = async (
  table: PostgresTable,
  batch: UpdateLogRow[],
  force: boolean
): Promise<void> => {
  if (!batch.length) {
    return;
  }
  const rows = collapseToLatest(batch.map(row => ({ ...row, tenant_id: table.tenantId })));
  try {
    const insert = force
      ? Statements.builder('updatelogs').insert(rows).onConflict(CONFLICT_COLUMNS).ignore()
      : insertKeepingLatest(rows);
    await table.transactionManager.query(Statements.fromBuilder(insert, SYSTEM_PERMISSION_CONTEXT));
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('[copyUpdateLogs] Insert failed for batch:', JSON.stringify(batch, null, 2));
    throw err;
  }
};

type CopyState = { migrated: number; batch: UpdateLogRow[] };

type TakeDocumentArgs = {
  table: PostgresTable;
  state: CopyState;
  doc: Record<string, unknown>;
  force: boolean;
};

const takeDocument = async ({ table, state, doc, force }: TakeDocumentArgs): Promise<CopyState> => {
  const batch = [...state.batch, mapUpdateLog(doc)];
  const migrated = state.migrated + 1;
  if (batch.length < UPDATE_LOGS_BATCH_SIZE) {
    return { migrated, batch };
  }
  await insertBatch(table, batch, force);
  return { migrated, batch: [] };
};

const storedRow = async (table: PostgresTable): Promise<boolean> => {
  const { rows } = await table.transactionManager.query(
    Statements.fromBuilder(Statements.builder('updatelogs').first(), SYSTEM_PERMISSION_CONTEXT)
  );
  return rows.length > 0;
};

const streamLogs = async (mongoDb: Db, table: PostgresTable, force: boolean): Promise<number> => {
  const cursor = mongoDb
    .collection<Record<string, unknown>>('updatelogs')
    .find({})
    .sort({ _id: 1 })
    .batchSize(UPDATE_LOGS_BATCH_SIZE);
  let state: CopyState = { migrated: 0, batch: [] };

  for await (const doc of cursor) {
    state = await takeDocument({ table, state, doc, force });
  }

  await insertBatch(table, state.batch, force);
  return state.migrated;
};

const copyUpdateLogs = async (
  mongoDb: Db,
  tenantId: string,
  options: CopyOptions = {}
): Promise<CopyResult> => {
  const table = tableFor(tenantId);
  const force = options.force ?? false;
  if (!force && (await storedRow(table))) {
    return { migrated: 0, orphansSkipped: 0, skipped: true };
  }

  const migrated = await streamLogs(mongoDb, table, force);
  return { migrated, orphansSkipped: 0, skipped: false };
};

export { UPDATE_LOGS_BATCH_SIZE, copyUpdateLogs, mapUpdateLog };
export type { CopyResult };
