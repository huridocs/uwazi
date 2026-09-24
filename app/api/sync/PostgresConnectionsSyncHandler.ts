import { Db, ObjectId } from 'mongodb';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { ConnectionsSyncHandler, ConnectionSyncDocument } from './ConnectionsSyncHandler.js';

type ConnectionRow = {
  _id: string;
  entity: string | null;
  hub: string | null;
  template: string | null;
  file: string | null;
  metadata: Record<string, unknown>;
  reference: Record<string, unknown> | null;
  sharedId: string | null;
  filename: string | null;
  range: Record<string, unknown> | null;
};

const toIdString = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  if (value instanceof ObjectId) return value.toHexString();
  if (typeof value === 'object' && '_id' in value) {
    return toIdString((value as { _id: unknown })._id);
  }
  return String(value);
};

const toRow = (document: Partial<ConnectionSyncDocument>): ConnectionRow => {
  const id = toIdString(document._id);
  if (!id) {
    throw new Error('PostgresConnectionsSyncHandler: document._id is required');
  }
  return {
    _id: id,
    entity: typeof document.entity === 'string' ? document.entity : null,
    hub: toIdString(document.hub),
    template: toIdString(document.template),
    file: toIdString(document.file),
    metadata: document.metadata ?? {},
    reference: document.reference ?? null,
    sharedId: toIdString(document.sharedId),
    filename: typeof document.filename === 'string' ? document.filename : null,
    range: document.range ?? null,
  };
};

export class PostgresConnectionsSyncHandler
  extends PostgresDataSource<ConnectionRow>
  implements ConnectionsSyncHandler
{
  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
  }) {
    super('connections', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'connections' },
    });
  }

  async getById(id: string): Promise<ConnectionSyncDocument | null> {
    const row = await this.table.where({ _id: id }).first();
    return row || null;
  }

  async getHubConnections(hubId: string): Promise<ConnectionSyncDocument[]> {
    return this.table.where({ hub: hubId }).all();
  }

  async save(document: Partial<ConnectionSyncDocument>): Promise<ConnectionSyncDocument> {
    const row = toRow(document);
    await this.table.upsert(row);
    return (await this.table.where({ _id: row._id }).first())!;
  }

  async saveMultiple(
    documents: Partial<ConnectionSyncDocument>[]
  ): Promise<ConnectionSyncDocument[]> {
    if (documents.length === 0) {
      return [];
    }
    const rows = documents.map(toRow);
    await this.table.upsert(rows);
    const ids = rows.map(row => row._id);
    return this.table.whereIn('_id', ids).all();
  }

  async delete(id: string): Promise<void> {
    await this.table.where({ _id: id }).delete();
  }
}
