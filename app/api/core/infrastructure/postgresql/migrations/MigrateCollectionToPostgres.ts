import { Db } from 'mongodb';
import { PostgresTable, PostgresConnectionConfig } from '../common/PostgresTable.js';

export const BATCH_SIZE = 1000;

export interface MigrationConfig {
  mongoCollection: string;
  pgTable: string;
  mapDocument(doc: Record<string, unknown>): Record<string, unknown>;
}

export class MigrateCollectionToPostgres {
  constructor(
    private mongoDb: Db,
    private connection: PostgresConnectionConfig,
    private tenantId: string
  ) {}

  async migrate(config: MigrationConfig): Promise<number> {
    const mongoDocs = await this.mongoDb
      .collection<Record<string, unknown>>(config.mongoCollection)
      .find({})
      .toArray();

    if (mongoDocs.length === 0) {
      return 0;
    }

    const table = new PostgresTable(this.connection, config.pgTable, this.tenantId);

    for (let i = 0; i < mongoDocs.length; i += BATCH_SIZE) {
      const batch = mongoDocs.slice(i, i + BATCH_SIZE);
      const rows = batch.map(doc => config.mapDocument(doc));

      // eslint-disable-next-line no-await-in-loop
      await table.upsert(rows);
    }

    return mongoDocs.length;
  }
}
