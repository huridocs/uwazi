import { Db, ObjectId } from 'mongodb';
import { PostgresTable, PostgresConnectionConfig } from './PostgresTable.js';
import { PostgresQueryBuilder } from './PostgresQueryBuilder.js';

class SyncedPostgresQueryBuilder<TRow> extends PostgresQueryBuilder<TRow> {
  private syncDb: Db;

  private syncNamespace: string;

  constructor(
    knex: import('knex').Knex,
    tableName: string,
    tenantId: string,
    syncDb: Db,
    syncNamespace: string
  ) {
    super(knex, tableName, tenantId);
    this.syncDb = syncDb;
    this.syncNamespace = syncNamespace;
  }

  private syncLogOp(_id: string, deleted: boolean = false) {
    return {
      updateOne: {
        filter: { mongoId: new ObjectId(_id) },
        update: {
          $set: {
            timestamp: Date.now(),
            namespace: this.syncNamespace,
            mongoId: new ObjectId(_id),
            deleted,
          },
        },
        upsert: true,
      },
    };
  }

  private async upsertSyncLogs(ids: string[], deleted: boolean = false): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.syncDb
      .collection('updatelogs')
      .bulkWrite(ids.map(id => this.syncLogOp(id, deleted)));
  }

  private async findIds(): Promise<string[]> {
    const rows = (await this.qb.clone().select('_id')) as { _id: string }[];
    return rows.map((r: { _id: string }) => r._id);
  }

  override async update(changes: Record<string, unknown>): Promise<void> {
    const ids = await this.findIds();
    await super.update(changes);
    await this.upsertSyncLogs(ids, false);
  }

  override async delete(): Promise<void> {
    const ids = await this.findIds();
    await super.delete();
    await this.upsertSyncLogs(ids, true);
  }
}

export class SyncedPostgresTable extends PostgresTable {
  private syncDb: Db;

  private syncNamespace: string;

  constructor(
    connection: PostgresConnectionConfig,
    tableName: string,
    tenantId: string,
    syncDb: Db,
    syncNamespace: string
  ) {
    super(connection, tableName, tenantId);
    this.syncDb = syncDb;
    this.syncNamespace = syncNamespace;
  }

  override query<TRow = Record<string, unknown>>(): SyncedPostgresQueryBuilder<TRow> {
    return new SyncedPostgresQueryBuilder<TRow>(
      this.knex,
      this.tableName,
      this.tenantId,
      this.syncDb,
      this.syncNamespace
    );
  }

  override async insert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    await super.insert(doc);
    const rows = Array.isArray(doc) ? doc : [doc];
    const ids = rows.map(row => row._id).filter((id): id is string => typeof id === 'string');
    await this.upsertSyncLogs(ids, false);
  }

  override async upsert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    await super.upsert(doc);
    const rows = Array.isArray(doc) ? doc : [doc];
    const ids = rows.map(row => row._id).filter((id): id is string => typeof id === 'string');
    await this.upsertSyncLogs(ids, false);
  }

  private syncLogOp(_id: string, deleted: boolean = false) {
    return {
      updateOne: {
        filter: { mongoId: new ObjectId(_id) },
        update: {
          $set: {
            timestamp: Date.now(),
            namespace: this.syncNamespace,
            mongoId: new ObjectId(_id),
            deleted,
          },
        },
        upsert: true,
      },
    };
  }

  private async upsertSyncLogs(ids: string[], deleted: boolean = false): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.syncDb
      .collection('updatelogs')
      .bulkWrite(ids.map(id => this.syncLogOp(id, deleted)));
  }
}
