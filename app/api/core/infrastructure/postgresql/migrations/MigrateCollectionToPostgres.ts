import { Db } from 'mongodb';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { PostgresTable } from '../common/PostgresTable.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';

export const BATCH_SIZE = 1;

export interface MigrationConfig {
  mongoCollection: string;
  pgTable: string;
  mapDocument(doc: Record<string, unknown>): Record<string, unknown>;
}

export class MigrateCollectionToPostgres {
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

    // eslint-disable-next-line no-await-in-loop
    for await (const doc of cursor) {
      batch.push(config.mapDocument(doc));
      migrated += 1;

      if (batch.length === BATCH_SIZE) {
        // eslint-disable-next-line no-await-in-loop
        await this.insertBatch(table, batch);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await this.insertBatch(table, batch);
    }

    return migrated;
  }

  private async insertBatch(table: PostgresTable, batch: Record<string, unknown>[]): Promise<void> {
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

    const migrated = await this.fetchAndInsert(config, table);
    return { migrated, skipped: false };
  }
}
