import { Db } from 'mongodb';
import { PostgresTable, PostgresConnectionConfig } from './PostgresTable.js';
import { PostgresQueryBuilder } from './PostgresQueryBuilder.js';
import { SyncLogWriter } from './SyncLogWriter.js';

class SyncedPostgresQueryBuilder<TRow> extends PostgresQueryBuilder<TRow> {
  private syncWriter: SyncLogWriter;

  constructor(
    knex: import('knex').Knex,
    tableName: string,
    tenantId: string,
    syncDb: Db,
    syncNamespace: string
  ) {
    super(knex, tableName, tenantId);
    this.syncWriter = new SyncLogWriter(syncDb, syncNamespace);
  }

  override async update(changes: Record<string, unknown>): Promise<void> {
    const result = await this.qb.clone().returning(['_id']).update(changes);
    const ids = (result as unknown as { _id: string }[]).map(r => r._id);
    await this.syncWriter.upsertSyncLogs(ids, false);
  }

  override async delete(): Promise<void> {
    const result = await this.qb.clone().returning(['_id']).del();
    const ids = (result as unknown as { _id: string }[]).map(r => r._id);
    await this.syncWriter.upsertSyncLogs(ids, true);
  }
}

export class SyncedPostgresTable extends PostgresTable {
  private syncWriter: SyncLogWriter;

  constructor(
    connection: PostgresConnectionConfig,
    tableName: string,
    tenantId: string,
    syncDb: Db,
    syncNamespace: string
  ) {
    super(connection, tableName, tenantId);
    this.syncWriter = new SyncLogWriter(syncDb, syncNamespace);
  }

  /**
   * Returns a SyncedPostgresQueryBuilder which writes sync logs on update/delete.
   * Note: via PostgresDataSource.table (typed as PostgresTable) this returns
   * PostgresQueryBuilder at compile time, but the runtime object is always a
   * SyncedPostgresQueryBuilder when sync options were provided to the data source.
   */
  override query<TRow = Record<string, unknown>>(): SyncedPostgresQueryBuilder<TRow> {
    return new SyncedPostgresQueryBuilder<TRow>(
      this.knex,
      this.tableName,
      this.tenantId,
      this.syncWriter.syncDb,
      this.syncWriter.syncNamespace
    );
  }

  override async insert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    await super.insert(doc);
    const rows = Array.isArray(doc) ? doc : [doc];
    const ids = rows.map(row => row._id).filter((id): id is string => typeof id === 'string');
    await this.syncWriter.upsertSyncLogs(ids, false);
  }

  override async upsert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    await super.upsert(doc);
    const rows = Array.isArray(doc) ? doc : [doc];
    const ids = rows.map(row => row._id).filter((id): id is string => typeof id === 'string');
    await this.syncWriter.upsertSyncLogs(ids, false);
  }
}
