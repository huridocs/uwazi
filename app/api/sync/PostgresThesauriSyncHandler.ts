import { PostgresConnectionConfig } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { SyncHandler } from './SyncHandler.js';

type ThesaurusRow = {
  _id: string;
  name: string;
  values: { id: string; label: string; values?: { id: string; label: string }[] }[];
};

export class PostgresThesauriSyncHandler
  extends PostgresDataSource
  implements SyncHandler<ThesaurusRow>
{
  protected tableName = 'thesauri';

  constructor(deps: { connection: PostgresConnectionConfig; tenantId: string }) {
    super({ connection: deps.connection, tenantId: deps.tenantId });
  }

  async getById(id: string): Promise<ThesaurusRow | null> {
    const row = await this.table.query<ThesaurusRow>().where({ _id: id }).first();
    return row || null;
  }

  async save(document: Partial<ThesaurusRow>): Promise<ThesaurusRow> {
    const { _id: rawId, ...rest } = document as ThesaurusRow;
    if (!rawId) throw new Error('PostgresThesauriSyncHandler: document._id is required');
    const id = rawId.toString();

    await this.table.upsert({ _id: id, ...rest } as Record<string, unknown>);

    const row = await this.table.query<ThesaurusRow>().where({ _id: id }).first();
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
    return this.table.query<ThesaurusRow>().whereIn('_id', ids).all();
  }

  async delete(id: string): Promise<void> {
    await this.table.query().where({ _id: id }).delete();
  }
}
