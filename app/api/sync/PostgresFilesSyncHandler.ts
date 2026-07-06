import { PostgresFilesDAO } from '#api/core/infrastructure/postgresql/files/PostgresFilesDAO.js';
import type { FilesRow } from '#api/core/infrastructure/postgresql/files/PostgresFilesRow.js';
import { SyncHandler } from './SyncHandler.js';

const ALLOWED_FILES_COLUMNS: (keyof FilesRow)[] = [
  '_id',
  'originalname',
  'filename',
  'mimetype',
  'size',
  'creationDate',
  'type',
  'entity',
  'status',
  'totalPages',
  'language',
  'generatedToc',
  'url',
  'toc',
  'propertySelections',
  'fullText',
];

export class PostgresFilesSyncHandler implements SyncHandler<FilesRow> {
  private dao: PostgresFilesDAO;

  constructor(deps: { tenantId: string }) {
    this.dao = new PostgresFilesDAO({
      tenantId: deps.tenantId,
    });
  }

  async getById(id: string): Promise<FilesRow | null> {
    const result = await this.dao.getById(id, { withFullText: true });

    if (result.isError()) return null;

    return result.getData();
  }

  private stripNonRowFields(doc: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const key of ALLOWED_FILES_COLUMNS) {
      if (key in doc) {
        cleaned[key] = doc[key];
      }
    }
    return cleaned;
  }

  async save(document: Partial<FilesRow>): Promise<FilesRow> {
    const { _id: rawId, ...rest } = document as FilesRow;
    if (!rawId) throw new Error('PostgresFilesSyncHandler: document._id is required');
    const id = rawId.toString();

    const cleaned = this.stripNonRowFields({ _id: id, ...rest });

    await this.dao.getTable().upsert(cleaned);

    const saved = await this.dao.getById(id, { withFullText: true });

    return saved.getDataOrThrow();
  }

  async saveMultiple(documents: Partial<FilesRow>[]): Promise<FilesRow[]> {
    if (documents.length === 0) return [];

    const rows = documents.map(doc => {
      const rawId = (doc as FilesRow)._id;
      if (!rawId) throw new Error('PostgresFilesSyncHandler: document._id is required');
      const _id = rawId.toString();

      return this.stripNonRowFields({ ...doc, _id } as FilesRow);
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
