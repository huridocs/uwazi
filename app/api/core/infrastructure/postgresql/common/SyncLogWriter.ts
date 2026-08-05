import { Db, ObjectId } from 'mongodb';

export class SyncLogWriter {
  readonly syncDb: Db;

  readonly syncNamespace: string;

  constructor(syncDb: Db, syncNamespace: string) {
    this.syncDb = syncDb;
    this.syncNamespace = syncNamespace;
  }

  syncLogOp(_id: string, deleted: boolean = false) {
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

  async upsertSyncLogs(ids: string[], deleted: boolean = false): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.syncDb
      .collection('updatelogs')
      .bulkWrite(ids.map(id => this.syncLogOp(id, deleted)));
  }
}
