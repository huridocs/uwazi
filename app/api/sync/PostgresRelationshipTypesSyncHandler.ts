import { Db } from 'mongodb';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { SyncHandler } from './SyncHandler.js';

type RelationshipTypeSyncDocument = {
  _id: string;
  name?: string;
};

type RelationshipTypeRow = {
  _id: string;
  name: string;
};

const toIdString = (id: unknown): string => {
  if (id == null) {
    throw new Error('PostgresRelationshipTypesSyncHandler: document._id is required');
  }
  return String(id);
};

const toRow = (document: Partial<RelationshipTypeSyncDocument>): RelationshipTypeRow => {
  const id = toIdString(document._id);
  if (typeof document.name !== 'string') {
    throw new Error('PostgresRelationshipTypesSyncHandler: document.name is required');
  }
  return { _id: id, name: document.name };
};

export class PostgresRelationshipTypesSyncHandler
  extends PostgresDataSource<RelationshipTypeRow>
  implements SyncHandler<RelationshipTypeRow>
{
  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
  }) {
    super('relationship_types', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'relationtypes' },
    });
  }

  async getById(id: string): Promise<RelationshipTypeRow | null> {
    const row = await this.table.where({ _id: id }).first();
    return row || null;
  }

  async save(document: Partial<RelationshipTypeSyncDocument>): Promise<RelationshipTypeRow> {
    const row = toRow(document);
    await this.table.upsert(row);
    const saved = await this.table.where({ _id: row._id }).first();
    return saved!;
  }

  async saveMultiple(
    documents: Partial<RelationshipTypeSyncDocument>[]
  ): Promise<RelationshipTypeRow[]> {
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
