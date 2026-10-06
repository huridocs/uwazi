import { ObjectId } from 'mongodb';

import type {
  EntitiesDAO,
  EntityFilters,
  EntityWithFiles,
  FindByLanguagePairsQuery,
  FindByMetadataCriteriaQuery,
  FindByTemplateIdRangeQuery,
  FindOptions,
  FindWithFilesOptions,
  LabelInfo,
} from '#api/core/application/contracts/EntitiesDAO.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import type { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import { TimedMethod } from '#api/core/libs/logger/TimedMethodDecorator.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { LocalizedLabels } from '#shared/types/datavizSchema.js';
import type { PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import { PostgresPermissionEnforcedTable } from '../common/PostgresPermissionEnforcedTable.js';
import { PostgresTable } from '../common/PostgresTable.js';
import { entitySyncLogging } from '../common/entitySyncLogging.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';
import type { PostgresFilesDAO } from '../files/PostgresFilesDAO.js';
import { entitiesWithFiles } from './entityFilesJoin.js';
import { cloneEntitiesForLanguage, deleteEntitiesForLanguage } from './entityLanguageBatches.js';
import {
  applyEntityFilters,
  applyFindOptions,
  applyMetadataCriteria,
  applyTemplateIdBounds,
} from './entityQuery.js';
import { toEntityDBO } from './entityRow.js';
import type { EntityRow } from './PostgresEntityRow.js';

type Deps = PostgresDataSourceDeps & {
  filesDAO: PostgresFilesDAO;
  accessContext: AccessContext;
};

type FileLoadOptions = { select?: string[]; limit?: number; fullText?: boolean };

class PostgresEntitiesDAO extends PostgresDataSource<EntityRow> implements EntitiesDAO {
  private filesDAO: PostgresFilesDAO;

  private tenantId: string;

  private pgTransactionManager: PostgresTransactionManager;

  private permissionTable: PostgresPermissionEnforcedTable<EntityRow>;

  private unrestrictedInstance?: EntitiesDAO;

  constructor(deps: Deps) {
    super('entities', deps);
    this.filesDAO = deps.filesDAO;
    this.tenantId = deps.tenantId;
    this.pgTransactionManager = deps.pgTransactionManager;

    const logging = entitySyncLogging({
      transactionManager: deps.pgTransactionManager,
      tenantId: deps.tenantId,
      accessContext: deps.accessContext,
    });
    this.permissionTable = PostgresPermissionEnforcedTable.for<EntityRow>({
      tableName: 'entities',
      tenantId: deps.tenantId,
      transactionManager: deps.pgTransactionManager,
      accessContext: deps.accessContext,
      syncWriter: logging.syncWriter,
      afterSyncLog: logging.afterSyncLog,
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

  async getIds(filters: EntityFilters = {}): Promise<string[]> {
    const rows = await applyEntityFilters(this.table, filters).select(['_id']).all();
    return rows.map(row => row._id);
  }

  async findByLanguagePairs(
    query: FindByLanguagePairsQuery,
    options: FindOptions = {}
  ): Promise<EntityDBO[]> {
    if (query.pairs.length === 0) {
      return [];
    }
    const rows = await applyFindOptions(
      this.table.whereAny(
        query.pairs.map(pair => ({ sharedId: pair.sharedId, language: pair.language }))
      ),
      options
    ).all();
    return rows.map(toEntityDBO);
  }

  async findByTemplateIdRange(
    query: FindByTemplateIdRangeQuery,
    options: FindOptions = {}
  ): Promise<EntityDBO[]> {
    if (query.from && !ObjectId.isValid(query.from)) return [];
    if (query.to && !ObjectId.isValid(query.to)) return [];

    const rows = await applyFindOptions(applyTemplateIdBounds(this.table, query), options).all();
    return rows.map(toEntityDBO);
  }

  async findByMetadataCriteria(
    query: FindByMetadataCriteriaQuery,
    options: FindOptions = {}
  ): Promise<EntityDBO[]> {
    const matched = applyMetadataCriteria(this.table, query.criteria);
    const filtered = query.filters ? applyEntityFilters(matched, query.filters) : matched;
    const rows = await applyFindOptions(filtered, options).all();
    return rows.map(toEntityDBO);
  }

  async find(
    filters: EntityFilters | undefined,
    options: FindWithFilesOptions
  ): Promise<EntityWithFiles[]>;

  async find(filters?: EntityFilters, options?: FindOptions): Promise<EntityDBO[]>;

  @TimedMethod('PostgresEntitiesDAO.find')
  async find(filters: EntityFilters = {}, options: FindOptions = {}): Promise<EntityDBO[]> {
    if (options.withFiles) {
      return this.getWithFiles(filters, {
        select: options.select,
        limit: options.limit,
        fullText: options.withFiles === true ? false : Boolean(options.withFiles?.fullText),
      });
    }
    const rows = await applyFindOptions(applyEntityFilters(this.table, filters), options).all();
    return rows.map(toEntityDBO);
  }

  async findOne(filters: EntityFilters = {}, options: FindOptions = {}): Promise<EntityDBO | null> {
    const filtered = applyEntityFilters(this.table, filters);
    const selected =
      options.select && options.select.length > 0 ? filtered.select(options.select) : filtered;
    const row = await selected.first();
    return row ? toEntityDBO(row) : null;
  }

  async count(filters: EntityFilters = {}): Promise<number> {
    return applyEntityFilters(this.table, filters).count();
  }

  async getBySharedId(sharedId: string): Promise<EntityDBO[]>;

  async getBySharedId(sharedId: string, language: LanguageISO6391): Promise<EntityDBO | null>;

  async getBySharedId(
    sharedId: string,
    language?: LanguageISO6391
  ): Promise<EntityDBO[] | EntityDBO | null> {
    if (language !== undefined) {
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

    return rows.map(row => ({
      sharedId: row.sharedId,
      title: row.title,
      icon: row.icon as LabelInfo['icon'],
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
    await cloneEntitiesForLanguage({ table: this.table, from, to, onBatch });
  }

  async deleteByLanguage(
    language: LanguageISO6391,
    onBatch?: (sharedIds: string[]) => Promise<void>
  ): Promise<void> {
    await deleteEntitiesForLanguage({ table: this.table, language, onBatch });
  }

  private async entitiesForFiles(filters: EntityFilters, options: FileLoadOptions) {
    const filtered = applyEntityFilters(this.table, filters);
    const selected = options.select?.length
      ? filtered.select([...new Set([...options.select, '_id', 'sharedId'])])
      : filtered;
    return (options.limit ? selected.limit(options.limit) : selected).all();
  }

  private async getWithFiles(
    filters: EntityFilters,
    options: FileLoadOptions = {}
  ): Promise<EntityWithFiles[]> {
    const entities = await this.entitiesForFiles(filters, options);
    if (entities.length === 0) {
      return [];
    }

    const sharedIds = [...new Set(entities.map(entity => entity.sharedId))];
    const files = await this.filesDAO.getByEntitySharedIds(
      sharedIds,
      options.fullText ? { withFullText: true } : undefined
    );
    return entitiesWithFiles(entities, files);
  }
}

export { PostgresEntitiesDAO };
