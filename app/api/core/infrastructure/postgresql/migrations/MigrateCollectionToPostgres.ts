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
  table: PostgresTable;
  batch: Record<string, unknown>[];
  migrated: number;
  insertOptions: InsertBatchOptions;
};

const accumulateDoc = async ({
  doc,
  mapRows,
  table,
  batch,
  migrated,
  insertOptions,
}: AccumulateDocArgs): Promise<{ batch: Record<string, unknown>[]; migrated: number }> => {
  const nextBatch = [...batch, ...mapRows(doc)];
  const nextMigrated = migrated + 1;
  if (nextBatch.length < BATCH_SIZE) {
    return { batch: nextBatch, migrated: nextMigrated };
  }
  return {
    batch: await flushBatch(table, nextBatch, insertOptions),
    migrated: nextMigrated,
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

  private async fetchAndInsert(
    config: AnyMigrationConfig,
    table: PostgresTable,
    options: InsertBatchOptions & {
      mapRows: (doc: Record<string, unknown>) => Record<string, unknown>[];
    }
  ): Promise<number> {
    const insertOptions = { force: options.force, conflictColumns: options.conflictColumns };
    const cursor = this.mongoDb
      .collection<Record<string, unknown>>(config.mongoCollection)
      .find({})
      .batchSize(BATCH_SIZE);

    let migrated = 0;
    let batch: Record<string, unknown>[] = [];

    for await (const doc of cursor) {
      ({ batch, migrated } = await accumulateDoc({
        doc,
        mapRows: options.mapRows,
        table,
        batch,
        migrated,
        insertOptions,
      }));
    }

    await insertBatch(table, batch, insertOptions);
    return migrated;
  }

  async migrate(
    config: AnyMigrationConfig,
    options: MigrateOptions = {}
  ): Promise<{ migrated: number; skipped: boolean }> {
    const table = this.tableFor(config.pgTable);

    if (!options.force && (await table.first()) !== undefined) {
      return { migrated: 0, skipped: true };
    }

    await this.assertConfiguredCount(config);

    const migrated = await this.fetchAndInsert(config, table, {
      mapRows: rowsMapperOf(config),
      force: options.force ?? false,
      conflictColumns: config.conflictColumns ?? DEFAULT_CONFLICT_COLUMNS,
    });
    return { migrated, skipped: false };
  }
}

export type { AnyMigrationConfig, MigrateOptions, MigrationConfig, RowsMigrationConfig };
export { BATCH_SIZE, MigrateCollectionToPostgres };
