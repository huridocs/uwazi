import { ObjectId } from 'mongodb';
import { PostgresTransactionManager } from './PostgresTransactionManager.js';

type UpdateLogRecord = {
  mongoId: ObjectId;
  namespace: string;
  timestamp: number;
  deleted: boolean;
};

class SyncLogWriter {
  readonly syncNamespace: string;

  private readonly transactionManager: PostgresTransactionManager;

  private readonly tenantId: string;

  constructor(
    transactionManager: PostgresTransactionManager,
    tenantId: string,
    syncNamespace: string
  ) {
    this.transactionManager = transactionManager;
    this.tenantId = tenantId;
    this.syncNamespace = syncNamespace;
  }

  async upsertSyncLogs(ids: string[], deleted: boolean = false): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const timestamp = Date.now();
    const rows = ids.map(documentId => ({
      tenant_id: this.tenantId,
      id: new ObjectId(documentId).toHexString(),
      namespace: this.syncNamespace,
      timestamp,
      deleted,
    }));

    await this.transactionManager.withConnection(
      async trx => {
        await trx('updatelogs')
          .insert(rows)
          .onConflict(['tenant_id', 'id'])
          .merge(['namespace', 'timestamp', 'deleted']);
      },
      undefined,
      { preservePermission: true }
    );
  }
}

const readUpdateLogs = async (
  transactionManager: PostgresTransactionManager,
  filter: { namespace: string; since: number; until?: number; limit?: number }
): Promise<UpdateLogRecord[]> => {
  const rows = await transactionManager.withConnection(
    async trx => {
      const query = trx('updatelogs')
        .select(['id', 'namespace', 'timestamp', 'deleted'])
        .where({ namespace: filter.namespace })
        .andWhere('timestamp', '>', filter.since)
        .orderBy('timestamp', 'asc');

      if (filter.until !== undefined) {
        query.andWhere('timestamp', '<=', filter.until);
      }
      if (filter.limit !== undefined) {
        query.limit(filter.limit);
      }
      return query;
    },
    undefined,
    { preservePermission: true }
  );

  return rows.map(row => ({
    mongoId: new ObjectId(String(row.id)),
    namespace: String(row.namespace),
    timestamp: Number(row.timestamp),
    deleted: Boolean(row.deleted),
  }));
};

export { SyncLogWriter, readUpdateLogs };
export type { UpdateLogRecord };
