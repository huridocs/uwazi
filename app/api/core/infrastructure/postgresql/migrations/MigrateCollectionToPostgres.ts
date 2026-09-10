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
}

/** For collections where one mongo document becomes several postgres rows. */
interface RowsMigrationConfig {
  mongoCollection: string;
  pgTable: string;
  mapRows(doc: Record<string, unknown>): Record<string, unknown>[];
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

const insertBatch = async (
  table: PostgresTable,
  batch: Record<string, unknown>[],
  force: boolean
): Promise<void> => {
  if (!batch.length) {
    return;
  }
  const rows = batch.map(row => serializeRow({ ...row, tenant_id: table.tenantId }));
  try {
    await table.transactionManager.withConnection(async trx => {
      if (force) {
        await trx(table.tableName).insert(rows).onConflict(['_id', 'tenant_id']).ignore();
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
  force: boolean
): Promise<Record<string, unknown>[]> => {
  await insertBatch(table, batch, force);
  return [];
};

class MigrateCollectionToPostgres {
  constructor(
    private mongoDb: Db,
    private tenantId: string
  ) {}

  private async fetchAndInsert(
    config: AnyMigrationConfig,
    table: PostgresTable,
    options: {
      mapRows: (doc: Record<string, unknown>) => Record<string, unknown>[];
      force: boolean;
    }
  ): Promise<number> {
    const cursor = this.mongoDb
      .collection<Record<string, unknown>>(config.mongoCollection)
      .find({})
      .batchSize(BATCH_SIZE);

    let migrated = 0;
    let batch: Record<string, unknown>[] = [];

    for await (const doc of cursor) {
      batch.push(...options.mapRows(doc));
      migrated += 1;
      if (batch.length >= BATCH_SIZE) {
        batch = await flushBatch(table, batch, options.force);
      }
    }

    await insertBatch(table, batch, options.force);
    return migrated;
  }

  async migrate(
    config: AnyMigrationConfig,
    options: MigrateOptions = {}
  ): Promise<{ migrated: number; skipped: boolean }> {
    const pgTransactionManager = new PostgresTransactionManager(
      PostgresDB.knex,
      this.tenantId,
      LoggerFactory.systemLogger()
    );
    const table = PostgresTable.for({
      tableName: config.pgTable,
      tenantId: this.tenantId,
      transactionManager: pgTransactionManager,
    });

    if (!options.force) {
      const existingRow = await table.first();

      if (existingRow !== undefined) {
        return { migrated: 0, skipped: true };
      }
    }

    if ('assertDocumentCount' in config && config.assertDocumentCount) {
      const count = await this.mongoDb.collection(config.mongoCollection).countDocuments();
      config.assertDocumentCount(count);
    }

    const migrated = await this.fetchAndInsert(config, table, {
      mapRows: rowsMapperOf(config),
      force: options.force ?? false,
    });
    return { migrated, skipped: false };
  }
}

export type { AnyMigrationConfig, MigrateOptions, MigrationConfig, RowsMigrationConfig };
export { BATCH_SIZE, MigrateCollectionToPostgres };
