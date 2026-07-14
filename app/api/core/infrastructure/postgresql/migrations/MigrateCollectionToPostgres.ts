import { Db } from 'mongodb';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { PostgresTable } from '../common/PostgresTable.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';

export const BATCH_SIZE = 1000;

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
    const mongoDocs = await this.mongoDb
      .collection<Record<string, unknown>>(config.mongoCollection)
      .find({})
      .toArray();

    if (mongoDocs.length === 0) {
      return 0;
    }

    for (let i = 0; i < mongoDocs.length; i += BATCH_SIZE) {
      const batch = mongoDocs.slice(i, i + BATCH_SIZE);
      const rows = batch.map(doc => config.mapDocument(doc));

      // eslint-disable-next-line no-await-in-loop
      await table.insert(rows);
    }

    return mongoDocs.length;
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
