import { Db } from 'mongodb';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { PostgresTable } from '../common/PostgresTable.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';

const BATCH_SIZE = 50;

interface MigrationConfig {
  mongoCollection: string;
  pgTable: string;
  mapDocument(doc: Record<string, unknown>): Record<string, unknown>;
  assertDocumentCount?(count: number): void;
  /**
   * Columns for `ON CONFLICT ... DO NOTHING` when `--force` is set.
   * Defaults to `['_id', 'tenant_id']` (most core tables).
   * Settings is a singleton keyed only by `tenant_id`.
   */
  conflictColumns?: string[];
  /**
   * Skip documents whose `field` is not the `_id` of a document in `collection`, which a
   * foreign key on the Postgres table would reject. Skipped documents are counted, not migrated.
   */
  excludeOrphansOf?: { field: string; collection: string };
}

/** For collections where one mongo document becomes several postgres rows. */
interface RowsMigrationConfig {
  mongoCollection: string;
  pgTable: string;
  mapRows(doc: Record<string, unknown>): Record<string, unknown>[];
  conflictColumns?: string[];
}

type AnyMigrationConfig = MigrationConfig | RowsMigrationConfig;

type MigrateOptions = {
  /**
   * Migrate even when the PostgreSQL table already contains rows for the
   * tenant. Existing rows are left untouched; conflicting rows are ignored.
   */
  force?: boolean;
};

const rowsMapperOf = (
  config: AnyMigrationConfig
): ((doc: Record<string, unknown>) => Record<string, unknown>[]) =>
  'mapRows' in config ? doc => config.mapRows(doc) : doc => [config.mapDocument(doc)];

const SYSTEM_PERMISSION_CONTEXT = { bypass: true, refIds: [] as string[] };

const serializeRow = (row: Record<string, unknown>): Record<string, unknown> => {
  const serialized = { ...row };
  for (const key of Object.keys(serialized)) {
    const value = serialized[key];
    if (typeof value === 'object' && value !== null) {
      serialized[key] = JSON.stringify(value);
    }
  }
  return serialized;
};

const DEFAULT_CONFLICT_COLUMNS = ['_id', 'tenant_id'];

type InsertBatchOptions = {
  force: boolean;
  conflictColumns: string[];
};

type Counts = { migrated: number; orphansSkipped: number };

const insertBatch = async (
  table: PostgresTable,
  batch: Record<string, unknown>[],
  { force, conflictColumns }: InsertBatchOptions
): Promise<void> => {
  if (!batch.length) {
    return;
  }
  const rows = batch.map(row => serializeRow({ ...row, tenant_id: table.tenantId }));
  try {
    await table.transactionManager.withConnection(async trx => {
      if (force) {
        await trx(table.tableName).insert(rows).onConflict(conflictColumns).ignore();
      } else {
        await trx(table.tableName).insert(rows);
      }
    }, SYSTEM_PERMISSION_CONTEXT);
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(
      '[MigrateCollectionToPostgres] Insert failed for batch:',
      JSON.stringify(batch, null, 2)
    );
    throw err;
  }
};

const flushBatch = async (
  table: PostgresTable,
  batch: Record<string, unknown>[],
  options: InsertBatchOptions
): Promise<Record<string, unknown>[]> => {
  await insertBatch(table, batch, options);
  return [];
};

type AccumulateDocArgs = {
  doc: Record<string, unknown>;
  mapRows: (doc: Record<string, unknown>) => Record<string, unknown>[];
  isOrphan: (doc: Record<string, unknown>) => boolean;
  table: PostgresTable;
  batch: Record<string, unknown>[];
  counts: Counts;
  insertOptions: InsertBatchOptions;
};

/**
 * Adds the rows a document becomes to the batch — none when it is an orphan, counted either way —
 * and flushes the batch once it is full.
 */
const accumulateDoc = async ({
  doc,
  mapRows,
  isOrphan,
  table,
  batch,
  counts,
  insertOptions,
}: AccumulateDocArgs): Promise<{ batch: Record<string, unknown>[]; counts: Counts }> => {
  if (isOrphan(doc)) {
    return { batch, counts: { ...counts, orphansSkipped: counts.orphansSkipped + 1 } };
  }
  const nextBatch = [...batch, ...mapRows(doc)];
  const nextCounts = { ...counts, migrated: counts.migrated + 1 };
  if (nextBatch.length < BATCH_SIZE) {
    return { batch: nextBatch, counts: nextCounts };
  }
  return {
    batch: await flushBatch(table, nextBatch, insertOptions),
    counts: nextCounts,
  };
};

class MigrateCollectionToPostgres {
  constructor(
    private mongoDb: Db,
    private tenantId: string
  ) {}

  private tableFor(pgTable: string) {
    const pgTransactionManager = new PostgresTransactionManager(
      PostgresDB.knex,
      this.tenantId,
      LoggerFactory.systemLogger()
    );
    return PostgresTable.for({
      tableName: pgTable,
      tenantId: this.tenantId,
      transactionManager: pgTransactionManager,
    });
  }

  private async assertConfiguredCount(config: AnyMigrationConfig): Promise<void> {
    if (!('assertDocumentCount' in config) || !config.assertDocumentCount) {
      return;
    }
    const count = await this.mongoDb.collection(config.mongoCollection).countDocuments();
    config.assertDocumentCount(count);
  }

  /** Parent `_id`s are read once per run and compared as hex strings. */
  private async orphanCheckFor(
    config: AnyMigrationConfig
  ): Promise<(doc: Record<string, unknown>) => boolean> {
    if (!('excludeOrphansOf' in config) || !config.excludeOrphansOf) {
      return () => false;
    }

    const { field, collection } = config.excludeOrphansOf;
    const parentIds = new Set(
      await this.mongoDb
        .collection(collection)
        .find({}, { projection: { _id: 1 } })
        .map(parent => String(parent._id))
        .toArray()
    );
    return doc => !parentIds.has(String(doc[field]));
  }

  private async fetchAndInsert(
    config: AnyMigrationConfig,
    table: PostgresTable,
    options: InsertBatchOptions & {
      mapRows: (doc: Record<string, unknown>) => Record<string, unknown>[];
      isOrphan: (doc: Record<string, unknown>) => boolean;
    }
  ): Promise<Counts> {
    const insertOptions = { force: options.force, conflictColumns: options.conflictColumns };
    const cursor = this.mongoDb
      .collection<Record<string, unknown>>(config.mongoCollection)
      .find({})
      .batchSize(BATCH_SIZE);

    let counts: Counts = { migrated: 0, orphansSkipped: 0 };
    let batch: Record<string, unknown>[] = [];

    for await (const doc of cursor) {
      ({ batch, counts } = await accumulateDoc({
        doc,
        mapRows: options.mapRows,
        isOrphan: options.isOrphan,
        table,
        batch,
        counts,
        insertOptions,
      }));
    }

    await insertBatch(table, batch, insertOptions);
    return counts;
  }

  async migrate(
    config: AnyMigrationConfig,
    options: MigrateOptions = {}
  ): Promise<{ migrated: number; orphansSkipped: number; skipped: boolean }> {
    const table = this.tableFor(config.pgTable);

    if (!options.force && (await table.first()) !== undefined) {
      return { migrated: 0, orphansSkipped: 0, skipped: true };
    }

    await this.assertConfiguredCount(config);

    const counts = await this.fetchAndInsert(config, table, {
      mapRows: rowsMapperOf(config),
      isOrphan: await this.orphanCheckFor(config),
      force: options.force ?? false,
      conflictColumns: config.conflictColumns ?? DEFAULT_CONFLICT_COLUMNS,
    });
    return { ...counts, skipped: false };
  }
}

export type { AnyMigrationConfig, MigrateOptions, MigrationConfig, RowsMigrationConfig };
export { BATCH_SIZE, MigrateCollectionToPostgres };
