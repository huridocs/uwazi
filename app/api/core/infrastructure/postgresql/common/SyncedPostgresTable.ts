import { Db, ObjectId } from 'mongodb';
import { PostgresTable, PostgresConnectionConfig, WhereCondition } from './PostgresTable.js';

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

  private syncLogOp(
    _id: string,
    deleted: boolean = false
  ): {
    updateOne: {
      filter: { mongoId: ObjectId };
      update: {
        $set: {
          timestamp: number;
          namespace: string;
          mongoId: ObjectId;
          deleted: boolean;
        };
      };
      upsert: true;
    };
  } {
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

  override async insert(row: Record<string, unknown>): Promise<void> {
    await super.insert(row);
    if (typeof row._id === 'string') {
      await this.upsertSyncLogs([row._id], false);
    }
  }

  override async insertMany(rows: Record<string, unknown>[]): Promise<void> {
    await super.insertMany(rows);
    const ids = rows.map(row => row._id).filter((id): id is string => typeof id === 'string');
    await this.upsertSyncLogs(ids, false);
  }

  override async upsert(row: Record<string, unknown>, conflictKeys: string[]): Promise<void> {
    await super.upsert(row, conflictKeys);
    if (typeof row._id === 'string') {
      await this.upsertSyncLogs([row._id], false);
    }
  }

  override async update<TRow>(
    where: WhereCondition<TRow>,
    changes: Record<string, unknown>
  ): Promise<void> {
    const ids = await this.findIds<TRow>(where);
    await super.update(where, changes);
    await this.upsertSyncLogs(ids, false);
  }

  override async delete<TRow>(where: WhereCondition<TRow>): Promise<void> {
    const ids = await this.findIds<TRow>(where);
    await super.delete(where);
    await this.upsertSyncLogs(ids, true);
  }
}
