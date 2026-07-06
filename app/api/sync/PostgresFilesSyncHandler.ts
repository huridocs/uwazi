import { Db } from 'mongodb';
import { PostgresFilesDAO } from '#api/core/infrastructure/postgresql/files/PostgresFilesDAO.js';
import type { FilesRow } from '#api/core/infrastructure/postgresql/files/PostgresFilesRow.js';
import { SyncHandler } from './SyncHandler.js';

export class PostgresFilesSyncHandler implements SyncHandler<FilesRow> {
  private dao: PostgresFilesDAO;

  constructor(deps: { tenantId: string; mongoDb: Db }) {
    this.dao = new PostgresFilesDAO({
      tenantId: deps.tenantId,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'files' },
    });
  }

  async getById(id: string): Promise<FilesRow | null> {
    const result = await this.dao.getById(id, { withFullText: true });

    if (result.isError()) return null;

    return result.getData();
  }

  async save(document: Partial<FilesRow>): Promise<FilesRow> {
    const { _id: rawId, ...rest } = document as FilesRow;
    if (!rawId) throw new Error('PostgresFilesSyncHandler: document._id is required');
    const id = rawId.toString();

    await this.dao.getTable().upsert({ _id: id, ...rest } as Record<string, unknown>);

    const saved = await this.dao.getById(id, { withFullText: true });

    return saved.getDataOrThrow();
  }

  async saveMultiple(documents: Partial<FilesRow>[]): Promise<FilesRow[]> {
    if (documents.length === 0) return [];

    const rows = documents.map(doc => {
      const rawId = (doc as FilesRow)._id;
      if (!rawId) throw new Error('PostgresFilesSyncHandler: document._id is required');
      const id = rawId.toString();
      const { _id: _ignored, ...rest } = doc as FilesRow;
      return { _id: id, ...rest } as Record<string, unknown>;
    });

    await this.dao.getTable().upsert(rows);

    const ids = rows.map(row => row._id as string);

    const files = await this.dao.getTable().query<FilesRow>().whereIn('_id', ids).all();

    return files;
  }

  async delete(id: string): Promise<void> {
    await this.dao.getTable().query().where({ _id: id }).delete();
  }
}
