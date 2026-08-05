import { Db } from 'mongodb';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { SyncHandler } from './SyncHandler.js';

type ThesaurusRow = {
  _id: string;
  name: string;
  values: { id: string; label: string; values?: { id: string; label: string }[] }[];
};

export class PostgresThesauriSyncHandler
  extends PostgresDataSource<ThesaurusRow>
  implements SyncHandler<ThesaurusRow>
{
  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
  }) {
    super('thesauri', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'dictionaries' },
    });
  }

  async getById(id: string): Promise<ThesaurusRow | null> {
    const row = await this.table.where({ _id: id }).first();
    return row || null;
  }

  async save(document: Partial<ThesaurusRow>): Promise<ThesaurusRow> {
    const { _id: rawId, ...rest } = document as ThesaurusRow;
    if (!rawId) throw new Error('PostgresThesauriSyncHandler: document._id is required');
    const id = rawId.toString();

    await this.table.upsert({ _id: id, ...rest } as Record<string, unknown>);

    const row = await this.table.where({ _id: id }).first();
    return row!;
  }

  async saveMultiple(documents: Partial<ThesaurusRow>[]): Promise<ThesaurusRow[]> {
    if (documents.length === 0) return [];

    const rows = documents.map(doc => {
      const rawId = (doc as ThesaurusRow)._id;
      if (!rawId) throw new Error('PostgresThesauriSyncHandler: document._id is required');
      const id = rawId.toString();
      const { _id: _ignored, ...rest } = doc as ThesaurusRow;
      return { _id: id, ...rest } as Record<string, unknown>;
    });

    await this.table.upsert(rows);

    const ids = rows.map(row => row._id as string);
    return this.table.whereIn('_id', ids).all();
  }

  async delete(id: string): Promise<void> {
    await this.table.where({ _id: id }).delete();
  }
}
