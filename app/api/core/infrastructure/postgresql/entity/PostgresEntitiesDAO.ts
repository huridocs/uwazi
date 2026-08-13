/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import type { PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { PostgresPermissionEnforcedTable } from '../common/PostgresPermissionEnforcedTable.js';
import { PostgresTable } from '../common/PostgresTable.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import type { EntityRow } from './PostgresEntityRow.js';
import type { PostgresFilesDAO } from '../files/PostgresFilesDAO.js';
import type { FilesRow } from '../files/PostgresFilesRow.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { LocalizedLabels } from '#shared/types/datavizSchema.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import {
  EntitiesDAO,
  EntityFilters,
  EntityWithFiles,
  FindByLanguagePairsQuery,
  FindByMetadataCriteriaQuery,
  FindByTemplateIdRangeQuery,
  FindOptions,
  GetByIdsWithDocumentsOptions,
  GetWithFilesMatch,
  LabelInfo,
} from '#api/core/application/contracts/EntitiesDAO.js';

type Deps = PostgresDataSourceDeps & {
  filesDAO: PostgresFilesDAO;
  accessContext: AccessContext;
};

const toDBO = (row: EntityRow): EntityDBO => ({
  _id: new ObjectId(row._id),
  sharedId: row.sharedId,
  language: row.language,
  template: new ObjectId(row.template),
  title: row.title,
  icon: (row.icon ?? undefined) as EntityDBO['icon'],
  metadata: row.metadata as EntityDBO['metadata'],
  obsoleteMetadata: [],
  user: row.user ? new ObjectId(row.user) : undefined,
  published: row.published,
  creationDate: row.creationDate,
  editDate: row.editDate,
  generatedToc: row.generatedToc ?? undefined,
  permissions: row.permissions as EntityDBO['permissions'],
  preview: row.preview ?? undefined,
});

class PostgresEntitiesDAO extends PostgresDataSource<EntityRow> implements EntitiesDAO {
  private filesDAO: PostgresFilesDAO;

  private accessContext: AccessContext;

  private tenantId: string;

  private pgTransactionManager: PostgresTransactionManager;

  private permissionTable: PostgresPermissionEnforcedTable<EntityRow>;

  private unrestrictedInstance?: EntitiesDAO;

  constructor(deps: Deps) {
    super('entities', deps);
    this.filesDAO = deps.filesDAO;
    this.accessContext = deps.accessContext;
    this.tenantId = deps.tenantId;
    this.pgTransactionManager = deps.pgTransactionManager;

    this.permissionTable = PostgresPermissionEnforcedTable.for<EntityRow>({
      tableName: 'entities',
      tenantId: deps.tenantId,
      transactionManager: deps.pgTransactionManager,
      accessContext: deps.accessContext,
    });
  }

  protected override get table(): PostgresTable<EntityRow> {
    return this.permissionTable;
  }

  unrestricted(): EntitiesDAO {
    if (!this.unrestrictedInstance) {
      this.unrestrictedInstance = new PostgresEntitiesDAO({
        tenantId: this.tenantId,
        pgTransactionManager: this.pgTransactionManager,
        filesDAO: this.filesDAO,
        accessContext: AccessContext.system(),
      });
    }
    return this.unrestrictedInstance;
  }

  private applyFilters(filters: EntityFilters) {
    return this.applyFilterBranches(this.table, filters);
  }

  private applyFilterBranches(
    q: ReturnType<typeof this.table.where>,
    filters: EntityFilters
  ): ReturnType<typeof this.table.where> {
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

    if (filters.languages && filters.languages.length > 0) {
      q = q.whereIn('language', filters.languages);
    }

    if (filters.template) {
      q = q.where({ template: filters.template });
    }

    if (filters.templateIds && filters.templateIds.length > 0) {
      q = q.whereIn('template', filters.templateIds);
    }

    if (filters.title) {
      q = q.where({ title: filters.title });
    }

    if (filters.titleNotEmpty) {
      q = q.whereNot('title', '');
    }

    if (filters.published !== undefined) {
      q = q.where({ published: filters.published });
    }

    if (filters.metadataValueIn && filters.metadataValueIn.length > 0) {
      q = q.whereJsonSupersetOfAny(
        'metadata',
        filters.metadataValueIn.map(({ property, value }) => ({ [property]: [{ value }] }))
      );
    }

    return q;
  }

  private applyFindOptions(
    q: ReturnType<typeof this.table.where>,
    options: FindOptions
  ): ReturnType<typeof this.table.where> {
    let result = q;

    if (options.select && options.select.length > 0) {
      result = result.select(options.select);
    }

    if (options.sort && options.sort.length > 0) {
      options.sort.forEach(({ field, direction }) => {
        result = result.orderBy(field, direction);
      });
    }

    if (options.limit) {
      result = result.limit(options.limit);
    }

    return result;
  }

  async getIds(filters: EntityFilters = {}): Promise<string[]> {
    const q = this.applyFilters(filters).select(['_id']);
    const rows = await q.all();
    return rows.map(r => r._id);
  }

  async findByLanguagePairs(
    query: FindByLanguagePairsQuery,
    options: FindOptions = {}
  ): Promise<EntityDBO[]> {
    if (query.pairs.length === 0) {
      return [];
    }
    const q = this.table.whereAny(
      query.pairs.map(pair => ({ sharedId: pair.sharedId, language: pair.language }))
    );
    const rows = await this.applyFindOptions(q, options).all();
    return rows.map(toDBO);
  }

  async findByTemplateIdRange(
    query: FindByTemplateIdRangeQuery,
    options: FindOptions = {}
  ): Promise<EntityDBO[]> {
    let q = this.table.where({ template: query.templateId });

    if (query.from && query.to) {
      q = q.whereBetween('_id', [query.from, query.to]);
    } else if (query.from) {
      q = q.whereRaw('?? >= ?', ['_id', query.from]);
    } else if (query.to) {
      q = q.whereRaw('?? <= ?', ['_id', query.to]);
    }

    if (query.language) {
      q = q.where({ language: query.language });
    }

    const rows = await this.applyFindOptions(q, options).all();
    return rows.map(toDBO);
  }

  async findByMetadataCriteria(
    query: FindByMetadataCriteriaQuery,
    options: FindOptions = {}
  ): Promise<EntityDBO[]> {
    let q: ReturnType<typeof this.table.where> = this.table;

    query.criteria.forEach(criteria => {
      if (criteria.exists) {
        q = q.whereRaw('?? @> ?', ['metadata', JSON.stringify({ [criteria.property]: [] })]);
      }
      if (criteria.nonEmpty) {
        q = q.whereRaw('jsonb_array_length(??->?) > 0', ['metadata', criteria.property]);
      }
      if (criteria.hasValues) {
        q = q.whereRaw(
          "EXISTS (SELECT 1 FROM jsonb_array_elements(??->?) AS elem WHERE elem->>'value' IS NOT NULL AND elem->>'value' NOT IN ('', 'null'))",
          ['metadata', criteria.property]
        );
      }
    });

    if (query.filters) {
      q = this.applyFilterBranches(q, query.filters);
    }

    const rows = await this.applyFindOptions(q, options).all();
    return rows.map(toDBO);
  }

  async find(filters: EntityFilters = {}, options: FindOptions = {}): Promise<EntityDBO[]> {
    const rows = await this.applyFindOptions(this.applyFilters(filters), options).all();
    return rows.map(toDBO);
  }

  async findOne(filters: EntityFilters = {}, options: FindOptions = {}): Promise<EntityDBO | null> {
    let q = this.applyFilters(filters);

    if (options.select && options.select.length > 0) {
      q = q.select(options.select);
    }

    const row = await q.first();
    return row ? toDBO(row) : null;
  }

  async count(filters: EntityFilters = {}): Promise<number> {
    return this.applyFilters(filters).count();
  }

  async getByIdsWithDocuments(
    ids: string[],
    options: GetByIdsWithDocumentsOptions = {}
  ): Promise<EntityWithFiles[]> {
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
        ...toDBO(e),
        documents: entityFiles.filter(f => f.type === 'document'),
        attachments: entityFiles.filter(f => f.type === 'attachment'),
      } as unknown as EntityWithFiles;
    });
  }

  async getWithFiles(match: GetWithFilesMatch): Promise<EntityWithFiles[]> {
    const filters: EntityFilters = {};
    if (match.sharedId) {
      filters.sharedId = match.sharedId;
    }
    if (match.sharedIds && match.sharedIds.length > 0) {
      filters.sharedIds = match.sharedIds;
    }
    if (match.language) {
      filters.language = match.language;
    }
    if (match.published !== undefined) {
      filters.published = match.published;
    }

    const ids = await this.getIds(filters);
    return this.getByIdsWithDocuments(ids);
  }

  async getBySharedId(sharedId: string): Promise<EntityDBO[]>;
  async getBySharedId(sharedId: string, language: LanguageISO6391): Promise<EntityDBO | null>;
  async getBySharedId(
    sharedId: string,
    language?: LanguageISO6391
  ): Promise<EntityDBO[] | EntityDBO | null> {
    if (language) {
      return this.findOne({ sharedId, language });
    }
    return this.find({ sharedId });
  }

  async getByInternalId(
    id: string,
    projection: Record<string, number> = {}
  ): Promise<EntityDBO | null> {
    const select = Object.keys(projection).length > 0 ? Object.keys(projection) : undefined;
    return this.findOne({ _id: id }, select ? { select } : undefined);
  }

  async countByTemplate(templateId: string): Promise<number> {
    const rows = await this.table.distinct(['sharedId']).where({ template: templateId }).all();
    return rows.length;
  }

  async countDistinctSharedIds(): Promise<number> {
    const rows = await this.table.distinct(['sharedId']).all();
    return rows.length;
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
      icon: r.icon as LabelInfo['icon'],
    }));
  }

  async getTitleLabelsBySharedIds(
    sharedIds: string[],
    languages: LanguageISO6391[]
  ): Promise<Map<string, LocalizedLabels>> {
    const result = new Map<string, LocalizedLabels>();

    if (sharedIds.length === 0 || languages.length === 0) {
      return result;
    }

    const rows = await this.table
      .select(['sharedId', 'language', 'title'])
      .whereIn('sharedId', sharedIds)
      .whereIn('language', languages)
      .all();

    rows.forEach(row => {
      const labels = result.get(row.sharedId) ?? {};
      labels[row.language] = row.title;
      result.set(row.sharedId, labels);
    });

    return result;
  }

  async cloneForLanguage(
    from: LanguageISO6391,
    to: LanguageISO6391,
    onBatch?: (clonedEntities: Omit<EntityDBO, '_id'>[]) => Promise<void>
  ): Promise<void> {
    const BATCH_SIZE = 500;

    let batch: EntityRow[] = [];
    for await (const row of this.table.where({ language: from }).stream()) {
      batch.push(row);
      if (batch.length >= BATCH_SIZE) {
        await this.insertClonedBatch(batch, to, onBatch);
        batch = [];
      }
    }
    if (batch.length > 0) {
      await this.insertClonedBatch(batch, to, onBatch);
    }
  }

  private async insertClonedBatch(
    rows: EntityRow[],
    to: LanguageISO6391,
    onBatch?: (clonedEntities: Omit<EntityDBO, '_id'>[]) => Promise<void>
  ): Promise<void> {
    const toInsert = rows.map(({ _id: _discarded, ...rest }) => ({
      ...rest,
      _id: MongoIdHandler.generate(),
      language: to,
    }));

    await this.table.insert(toInsert);
    if (onBatch) {
      await onBatch(
        toInsert.map(({ _id: _discarded, ...rest }) => rest as unknown as Omit<EntityDBO, '_id'>)
      );
    }
  }

  async deleteByLanguage(
    language: LanguageISO6391,
    onBatch?: (sharedIds: string[]) => Promise<void>
  ): Promise<void> {
    const BATCH_SIZE = 500;

    let batch: { _id: string; sharedId: string }[] = [];
    for await (const row of this.table
      .select(['_id', 'sharedId'])
      .where({ language })
      .stream()) {
      batch.push(row);
      if (batch.length >= BATCH_SIZE) {
        await this.deleteBatch(batch, language, onBatch);
        batch = [];
      }
    }
    if (batch.length > 0) {
      await this.deleteBatch(batch, language, onBatch);
    }
  }

  private async deleteBatch(
    rows: { _id: string; sharedId: string }[],
    language: LanguageISO6391,
    onBatch?: (sharedIds: string[]) => Promise<void>
  ): Promise<void> {
    const sharedIds = rows.map(r => r.sharedId);
    // eslint-disable-next-line no-await-in-loop
    await this.table.where({ language }).whereIn('sharedId', sharedIds).delete();
    if (onBatch) {
      await onBatch(sharedIds);
    }
  }
}

export { PostgresEntitiesDAO };
