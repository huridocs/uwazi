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

  async migrate(
    config: MigrationConfig
  ): Promise<{ migrated: number; skipped: boolean }> {
    const table = new PostgresTable(config.pgTable, this.tenantId);
    const existingCount = await table.query().count();

    if (existingCount > 0) {
      return { migrated: 0, skipped: true };
    }

    const mongoDocs = await this.mongoDb
      .collection<Record<string, unknown>>(config.mongoCollection)
      .find({})
      .toArray();

    if (mongoDocs.length === 0) {
      return { migrated: 0, skipped: false };
    }

    for (let i = 0; i < mongoDocs.length; i += BATCH_SIZE) {
      const batch = mongoDocs.slice(i, i + BATCH_SIZE);
      const rows = batch.map(doc => config.mapDocument(doc));

      // eslint-disable-next-line no-await-in-loop
      await table.insert(rows);
    }

    return { migrated: mongoDocs.length, skipped: false };
  }
}
