import { PostgresConnectionConfig } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { SyncHandler } from './SyncHandler.js';

type ThesaurusRow = {
  _id: string;
  name: string;
  values: { id: string; label: string; values?: { id: string; label: string }[] }[];
};

export class PostgresDictionariesSyncHandler
  extends PostgresDataSource
  implements SyncHandler<ThesaurusRow>
{
  protected tableName = 'thesauri';

  constructor(deps: { connection: PostgresConnectionConfig; tenantId: string }) {
    super({ connection: deps.connection, tenantId: deps.tenantId });
  }

  async getById(id: string): Promise<ThesaurusRow | null> {
    const row = await this.table.findOne<ThesaurusRow>({ _id: id });
    return row || null;
  }

  async save(document: Partial<ThesaurusRow>): Promise<ThesaurusRow> {
    const { _id: rawId, ...rest } = document as ThesaurusRow;
    if (!rawId) throw new Error('PostgresDictionariesSyncHandler: document._id is required');
    const id = rawId.toString();

    await this.table.upsert({ _id: id, ...rest } as Record<string, unknown>, ['_id', 'tenant_id']);

    const row = await this.table.findOne<ThesaurusRow>({ _id: id });
    return row!;
  }

  async saveMultiple(documents: Partial<ThesaurusRow>[]): Promise<ThesaurusRow[]> {
    if (documents.length === 0) return [];

    for (const doc of documents) {
      //eslint-disable-next-line no-await-in-loop
      await this.save(doc);
    }

    const ids = documents.map(doc => {
      const rawId = (doc as ThesaurusRow)._id;
      if (!rawId) throw new Error('PostgresDictionariesSyncHandler: document._id is required');
      return rawId.toString();
    });

    return this.table.findAll<ThesaurusRow>({ _id: { $in: ids } });
  }

  async delete(id: string): Promise<void> {
    await this.table.delete<ThesaurusRow>({ _id: id });
  }
}
