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

  private async fetchAndInsert(config: MigrationConfig, table: PostgresTable): Promise<number> {
    const cursor = this.mongoDb
      .collection<Record<string, unknown>>(config.mongoCollection)
      .find({})
      .batchSize(BATCH_SIZE);

    let migrated = 0;
    let batch: Record<string, unknown>[] = [];

    for await (const doc of cursor) {
      batch.push(config.mapDocument(doc));
      migrated += 1;
      if (batch.length === BATCH_SIZE) {
        batch = await flushBatch(table, batch);
      }
    }

    await insertBatch(table, batch);
    return migrated;
  }

  async migrate(config: MigrationConfig): Promise<{ migrated: number; skipped: boolean }> {
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

    if (config.assertDocumentCount) {
      const count = await this.mongoDb.collection(config.mongoCollection).countDocuments();
      config.assertDocumentCount(count);
    }

    const migrated = await this.fetchAndInsert(config, table);
    return { migrated, skipped: false };
  }
}

export type { MigrationConfig };
export { BATCH_SIZE, MigrateCollectionToPostgres };
