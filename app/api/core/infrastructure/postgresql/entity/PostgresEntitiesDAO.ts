/* eslint-disable max-statements */
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import type { PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import type { EntityRow } from './PostgresEntityRow.js';
import type { PostgresFilesDAO } from '../files/PostgresFilesDAO.js';
import type { FilesRow } from '../files/PostgresFilesRow.js';
import type { EntityWithFilesSchema } from '#shared/types/entityType.js';

type EntityFilters = {
  _id?: string;
  ids?: string[];
  sharedId?: string;
  sharedIds?: string[];
  language?: string;
  template?: string;
  metadataValueIn?: { property: string; value: string }[];
};

type GetByIdsWithDocumentsOptions = {
  limit?: number;
  documentsFullText?: boolean;
};

type LabelInfo = {
  sharedId: string;
  title: string;
  icon: EntityRow['icon'];
};

type Deps = PostgresDataSourceDeps & {
  filesDAO: PostgresFilesDAO;
};

class PostgresEntitiesDAO extends PostgresDataSource<EntityRow> {
  private filesDAO: PostgresFilesDAO;

  constructor(deps: Deps) {
    super('entities', deps);
    this.filesDAO = deps.filesDAO;
  }

  private applyFilters(filters: EntityFilters) {
    let q = this.table;

    if (filters._id) {
      q = q.where({ _id: filters._id });
    }

    if (filters.ids && filters.ids.length > 0) {
      q = q.whereIn('_id', filters.ids);
    }

    if (filters.sharedId) {
      q = q.where({ sharedId: filters.sharedId });
    }

    if (filters.sharedIds && filters.sharedIds.length > 0) {
      q = q.whereIn('sharedId', filters.sharedIds);
    }

    if (filters.language) {
      q = q.where({ language: filters.language });
    }

    if (filters.template) {
      q = q.where({ template: filters.template });
    }

    if (filters.metadataValueIn && filters.metadataValueIn.length > 0) {
      q = q.whereJsonSupersetOfAny(
        'metadata',
        filters.metadataValueIn.map(({ property, value }) => ({ [property]: [{ value }] }))
      );
    }

    return q;
  }

  async getIds(filters: EntityFilters = {}): Promise<string[]> {
    const q = this.applyFilters(filters).select(['_id']);
    const rows = await q.all();
    return rows.map(r => r._id);
  }

  async getByIdsWithDocuments(
    ids: string[],
    options: GetByIdsWithDocumentsOptions = {}
  ): Promise<EntityWithFilesSchema[]> {
    let q: ReturnType<typeof this.table.whereIn> = this.table.whereIn('_id', ids);

    if (options.limit) {
      q = q.limit(options.limit);
    }

    const entities = await q.all();

    if (entities.length === 0) {
      return [];
    }

    const sharedIds = [...new Set(entities.map(e => e.sharedId))];
    const fileOptions: Record<string, unknown> = {};
    if (options.documentsFullText) {
      fileOptions.withFullText = true;
    }
    const files = await this.filesDAO.getByEntitySharedIds(sharedIds, fileOptions as any);

    const filesByEntity = new Map<string, FilesRow[]>();
    for (const file of files) {
      const key = file.entity ?? '';
      if (!filesByEntity.has(key)) {
        filesByEntity.set(key, []);
      }
      filesByEntity.get(key)!.push(file);
    }

    return entities.map(e => {
      const entityFiles = filesByEntity.get(e.sharedId) ?? [];
      return {
        ...e,
        documents: entityFiles.filter(f => f.type === 'document'),
        attachments: entityFiles.filter(f => f.type === 'attachment'),
      } as EntityWithFilesSchema;
    });
  }

  async count(filters: EntityFilters = {}): Promise<number> {
    return this.applyFilters(filters).count();
  }

  async getSharedIdLabelInfo(sharedIds: string[], language: string): Promise<LabelInfo[]> {
    if (sharedIds.length === 0) {
      return [];
    }

    const rows = await this.table
      .select(['sharedId', 'title', 'icon'])
      .whereIn('sharedId', sharedIds)
      .where({ language })
      .all();

    return rows.map(r => ({
      sharedId: r.sharedId,
      title: r.title,
      icon: r.icon,
    }));
  }
}

export type { EntityFilters, GetByIdsWithDocumentsOptions, LabelInfo };
export { PostgresEntitiesDAO };
