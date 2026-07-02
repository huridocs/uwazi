import { Db } from 'mongodb';
import { PostgresTable } from '../common/PostgresTable.js';

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
    const table = new PostgresTable(config.pgTable, this.tenantId);
    const existingRow = await table.query().first();

    if (existingRow !== undefined) {
      return { migrated: 0, skipped: true };
    }

    const migrated = await this.fetchAndInsert(config, table);
    return { migrated, skipped: false };
  }
}
