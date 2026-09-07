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
}

/** For collections where one mongo document becomes several postgres rows. */
interface RowsMigrationConfig {
  mongoCollection: string;
  pgTable: string;
  mapRows(doc: Record<string, unknown>): Record<string, unknown>[];
}

type AnyMigrationConfig = MigrationConfig | RowsMigrationConfig;

const rowsMapperOf = (
  config: AnyMigrationConfig
): ((doc: Record<string, unknown>) => Record<string, unknown>[]) =>
  'mapRows' in config ? doc => config.mapRows(doc) : doc => [config.mapDocument(doc)];

const insertBatch = async (
  table: PostgresTable,
  batch: Record<string, unknown>[]
): Promise<void> => {
  if (!batch.length) {
    return;
  }
  try {
    await table.insert(batch);
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
  batch: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> => {
  await insertBatch(table, batch);
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
    mapRows: (doc: Record<string, unknown>) => Record<string, unknown>[]
  ): Promise<number> {
    const cursor = this.mongoDb
      .collection<Record<string, unknown>>(config.mongoCollection)
      .find({})
      .batchSize(BATCH_SIZE);

    let migrated = 0;
    let batch: Record<string, unknown>[] = [];

    for await (const doc of cursor) {
      batch.push(...mapRows(doc));
      migrated += 1;
      if (batch.length >= BATCH_SIZE) {
        batch = await flushBatch(table, batch);
      }
    }

    await insertBatch(table, batch);
    return migrated;
  }

  async migrate(config: AnyMigrationConfig): Promise<{ migrated: number; skipped: boolean }> {
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
    const existingRow = await table.first();

    if (existingRow !== undefined) {
      return { migrated: 0, skipped: true };
    }

    const migrated = await this.fetchAndInsert(config, table, rowsMapperOf(config));
    return { migrated, skipped: false };
  }
}

export type { AnyMigrationConfig, MigrationConfig, RowsMigrationConfig };
export { BATCH_SIZE, MigrateCollectionToPostgres };
