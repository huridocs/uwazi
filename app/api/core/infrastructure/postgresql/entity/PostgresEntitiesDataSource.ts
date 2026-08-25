/* eslint-disable max-lines */
import { Db } from 'mongodb';
import { EntityNotFoundError } from '#api/core/application/errors.js';
import { Property } from '#api/core/domain/template/Property.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { search } from '#api/search/index.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { PostgresTable } from '../common/PostgresTable.js';
import { PostgresPermissionEnforcedTable } from '../common/PostgresPermissionEnforcedTable.js';
import { PostgresResultSet } from '../common/PostgresResultSet.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager.js';
import { MongoEntityMapper } from '../../mongodb/entity/MongoEntityMapper.js';
import { TemplatesDAOFactory } from '../../factories/TemplatesDAOFactory.js';
import { EntityRow } from './PostgresEntityRow.js';
import { PostgresEntityMapper } from './PostgresEntityMapper.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';

type TemplatesDAO = Awaited<ReturnType<typeof TemplatesDAOFactory.default>>;

type Deps = PostgresDataSourceDeps & {
  transactionManager: MongoTransactionManager;
  templatesDAO: TemplatesDAO;
  settingsDataSource: SettingsDataSource;
  mongoDb: Db;
  accessContext: AccessContext;
  skipOnCommits?: boolean;
};

export class PostgresEntitiesDataSource
  extends PostgresDataSource<EntityRow>
  implements EntitiesDataSource
{
  private transactionManager: MongoTransactionManager;

  private pgTransactionManager: PostgresTransactionManager;

  private templatesDAO: TemplatesDAO;

  private settingsDataSource: SettingsDataSource;

  private mongoDb: Db;

  private accessContext: AccessContext;

  private permissionTable: PostgresPermissionEnforcedTable<EntityRow>;

  private modifiedSharedIds = new Set<string>();

  private unrestrictedInstance?: EntitiesDataSource;

  constructor(deps: Deps) {
    super('entities', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'entities' },
    });

    this.transactionManager = deps.transactionManager;
    this.pgTransactionManager = deps.pgTransactionManager;
    this.templatesDAO = deps.templatesDAO;
    this.settingsDataSource = deps.settingsDataSource;
    this.mongoDb = deps.mongoDb;
    this.accessContext = deps.accessContext;

    this.permissionTable = PostgresPermissionEnforcedTable.for<EntityRow>({
      tableName: 'entities',
      tenantId: deps.tenantId,
      transactionManager: deps.pgTransactionManager,
      accessContext: deps.accessContext,
    });

    if (!deps.skipOnCommits) {
      this.transactionManager.onCommitted(async () => {
        await search.indexEntities({ sharedId: { $in: Array.from(this.modifiedSharedIds) } });
      });
    }
  }

  protected override get table(): PostgresTable<EntityRow> {
    return this.permissionTable;
  }

  unrestricted(): EntitiesDataSource {
    if (!this.unrestrictedInstance) {
      this.unrestrictedInstance = new PostgresEntitiesDataSource({
        tenantId: this.permissionTable.tenantId,
        transactionManager: this.transactionManager,
        pgTransactionManager: this.pgTransactionManager,
        templatesDAO: this.templatesDAO,
        settingsDataSource: this.settingsDataSource,
        mongoDb: this.mongoDb,
        accessContext: AccessContext.system(),
        skipOnCommits: true,
      });
    }
    return this.unrestrictedInstance;
  }

  private toUpdateRow(row: EntityRow): Record<string, unknown> {
    const { published, permissions, generatedToc, user, ...content } = row;
    const update: Record<string, unknown> = { ...content };
    if (row.generatedToc !== null) update.generatedToc = generatedToc;
    if (row.user !== null) update.user = user;
    return update;
  }

  async getById(id: string): Promise<ResultType<Entity, EntityNotFoundError>> {
    const [entity] = await (await this.getByQuery({ sharedId: id })).all();

    if (!entity) {
      return Result.fail(new EntityNotFoundError(id));
    }

    return Result.ok(entity);
  }

  async existsByIdAndTemplateId(id: string, templateId: string): Promise<boolean> {
    const row = await this.table
      .where({ sharedId: id, template: templateId })
      .select(['_id'])
      .first();
    return Boolean(row);
  }

  async update(entities: Entity | Entity[]): Promise<void> {
    return this.bulkUpdate(ArrayUtils.asArray(entities));
  }

  private async bulkUpdate(entities: Entity[]): Promise<void> {
    const allRows = entities.flatMap(entity => PostgresEntityMapper.toDBO(entity));
    if (allRows.length === 0) return;

    await this.table.bulkUpdate(allRows.map(row => this.toUpdateRow(row)));

    entities.forEach(entity => this.modifiedSharedIds.add(entity.sharedId));
  }

  async getSharedIdsUsingThesaurus(thesaurusId: string) {
    const defaultLanguage = await this.settingsDataSource.getDefaultLanguageKey();
    const uniqueTemplateIds = await this.templatesDAO.findTemplateIdsUsingThesaurus(thesaurusId);
    const templateIdStrings = uniqueTemplateIds.map(id => id.toHexString());

    const rows = await this.table
      .where({ language: defaultLanguage })
      .whereIn('template', templateIdStrings)
      .whereRaw(
        'EXISTS (SELECT 1 FROM jsonb_each(metadata) AS e WHERE jsonb_array_length(e.value) > 0)'
      )
      .select(['sharedId'])
      .all();

    return rows.map(r => r.sharedId);
  }

  async getSharedIdsByTemplateAndTitles(templateId: string, titles: string[]) {
    if (!titles.length) {
      return [];
    }

    const rows = await this.table
      .where({ template: templateId })
      .whereIn('title', titles)
      .select(['title', 'sharedId'])
      .orderBy('_id')
      .all();

    return rows.map(r => ({ title: r.title, sharedId: r.sharedId }));
  }

  async getSharedIdsByTitles(titles: string[]) {
    if (!titles.length) {
      return [];
    }

    const rows = await this.table
      .whereIn('title', titles)
      .select(['title', 'sharedId', 'template'])
      .orderBy('_id')
      .all();

    return rows.map(r => ({ title: r.title, sharedId: r.sharedId, templateId: r.template }));
  }

  async deleteReferencesToSharedIds(deletedSharedIds: string[]): Promise<void> {
    if (deletedSharedIds.length === 0) return;

    const propertyNames = await this.templatesDAO.getReferencePropertyNames();
    if (propertyNames.length === 0) return;

    const defaultLanguage = await this.settingsDataSource.getDefaultLanguageKey();
    const conditions = propertyNames.flatMap(propName =>
      deletedSharedIds.map(id => ({ [propName]: [{ value: id }] }))
    );
    const rows = await this.table
      .where({ language: defaultLanguage })
      .whereJsonSupersetOfAny('metadata', conditions)
      .select(['sharedId'])
      .all();
    const affectedSharedIds = rows.map(r => r.sharedId);
    if (affectedSharedIds.length === 0) return;

    affectedSharedIds.forEach(id => this.modifiedSharedIds.add(id));

    await this.table.raw(
      `UPDATE ?? SET metadata = COALESCE(
        (SELECT jsonb_object_agg(prop.key, COALESCE(
          (SELECT jsonb_agg(item) FROM jsonb_array_elements(prop.value) AS item
           WHERE NOT (item->>'value' = ANY(?::text[]))),
          '[]'::jsonb
        )) FROM jsonb_each(metadata) AS prop),
        '{}'::jsonb
      ) WHERE "sharedId" = ANY(?::text[])`,
      [this.table.tableName, deletedSharedIds, affectedSharedIds]
    );
  }

  async bulkDelete(sharedIds: string[]): Promise<void> {
    await this.table.whereIn('sharedId', sharedIds).delete();
    await search.bulkDeleteBySharedId(sharedIds);
  }

  async getAllBySharedId(sharedIds: string[]): Promise<ResultType<Entity[], Error>> {
    const entities = await (await this.getByQuery({ sharedId: sharedIds })).all();

    if (!entities.length) {
      return Result.fail(new Error(`Entities with sharedIds ${sharedIds.join(', ')} not found`));
    }

    return Result.ok(entities);
  }

  async touchEntitiesBySharedIds(sharedIds: string[]): Promise<void> {
    await this.table.whereIn('sharedId', sharedIds).update({ editDate: Date.now() });
    sharedIds.forEach(id => this.modifiedSharedIds.add(id));
  }

  async deleteMetadataProperties(propertyNames: string[], sharedIds: string[]): Promise<void> {
    if (!propertyNames.length || !sharedIds.length) return;

    await this.table.raw(
      'UPDATE ?? SET metadata = metadata - ?::text[] WHERE "sharedId" = ANY(?::text[])',
      [this.table.tableName, propertyNames, sharedIds]
    );
    sharedIds.forEach(id => this.modifiedSharedIds.add(id));
  }

  async renameMetadataProperties(
    propertyNames: { [oldName: string]: string },
    sharedIds: string[]
  ): Promise<void> {
    const entries = Object.entries(propertyNames);
    if (!entries.length || !sharedIds.length) return;

    let expr = 'metadata';
    const bindings: unknown[] = [this.table.tableName];
    entries.forEach(([oldName, newName]) => {
      expr = `(${expr} - ?::text[]) || jsonb_build_object(?::text, ${expr}->?)`;
      bindings.push([oldName], newName, oldName);
    });
    bindings.push(sharedIds);

    await this.table.raw(
      `UPDATE ?? SET metadata = ${expr} WHERE "sharedId" = ANY(?::text[])`,
      bindings
    );
    sharedIds.forEach(id => this.modifiedSharedIds.add(id));
  }

  async bulkUpdateDeprecated(entitiesToSave: Entity[], properties: Property[] = []) {
    await ArrayUtils.sequentialFor(entitiesToSave, async entity => {
      await ArrayUtils.sequentialFor(entity.translationsList, async ([language, translation]) => {
        const sets: { path: string; value: unknown }[] = [];
        properties.forEach(property => {
          const { value } = translation.getValue(property.name);
          if (value) {
            sets.push({ path: `{${property.name}}`, value });
          }
        });
        if (sets.length === 0) return;

        let expr = 'metadata';
        const bindings: unknown[] = [this.table.tableName];
        sets.forEach(({ path, value }) => {
          expr = `jsonb_set(${expr}, ?::text[], ?::jsonb)`;
          bindings.push(path, JSON.stringify(value));
        });
        bindings.push(entity.sharedId, language);

        await this.table.raw(
          `UPDATE ?? SET metadata = ${expr} WHERE "sharedId" = ? AND "language" = ?`,
          bindings
        );
      });
    });
    const sharedIds = entitiesToSave.map(e => e.sharedId);
    sharedIds.forEach(id => this.modifiedSharedIds.add(id));
  }

  async countByTemplateId(templateId: string): Promise<number> {
    const rows = await this.table.distinct(['sharedId']).where({ template: templateId }).all();
    return rows.length;
  }

  async getSharedIdsByTemplateId(templateId: string) {
    return new PostgresResultSet(
      this.table.distinct(['sharedId']).where({ template: templateId }).stream(),
      r => r.sharedId
    );
  }

  async getEntitiesByTemplateId(templateId: string) {
    return this.getByQuery({ template: templateId });
  }

  async getEntitiesBySharedIds(sharedIds: string[]) {
    return this.getByQuery({ sharedId: sharedIds });
  }

  async getEntitiesByRelatedProperties(
    entities: Entity[],
    properties: V1RelationshipProperty[]
  ): Promise<PostgresResultSet<EntityRow[], Entity>> {
    const relatedEntitiesSharedIds = entities
      .map(e => properties.map(prop => e.getValue(prop.name, e.languages[0]).value).flat())
      .flat()
      .map(metadataValue => metadataValue.value)
      .filter((v): v is string => typeof v === 'string');

    return this.getEntitiesBySharedIds(relatedEntitiesSharedIds);
  }

  private async *groupBySharedId(rows: AsyncGenerator<EntityRow>): AsyncGenerator<EntityRow[]> {
    let currentSharedId: string | undefined;
    let group: EntityRow[] = [];
    for await (const row of rows) {
      if (currentSharedId !== undefined && row.sharedId !== currentSharedId) {
        yield group;
        group = [];
      }
      currentSharedId = row.sharedId;
      group.push(row);
    }
    if (group.length > 0) yield group;
  }

  private async getByQuery(filters: { sharedId?: string | string[]; template?: string }) {
    let q = this.table;
    if (filters.sharedId !== undefined) {
      q = Array.isArray(filters.sharedId)
        ? q.whereIn('sharedId', filters.sharedId)
        : q.where({ sharedId: filters.sharedId });
    }
    if (filters.template !== undefined) {
      q = q.where({ template: filters.template });
    }

    const templateRows = await q.distinct(['template']).all();
    const templateIdStrings = templateRows.map(r => r.template);
    const templateDBOs = await this.templatesDAO.get(templateIdStrings);
    const templateMap = new Map(templateDBOs.map(t => [t._id.toString(), t]));

    const iterator = this.groupBySharedId(q.orderBy('sharedId').stream());
    return new PostgresResultSet(iterator, group => {
      const templateId = group[0].template;
      const templateDBO = templateMap.get(templateId)!;
      return MongoEntityMapper.toDomain(group.map(PostgresEntityMapper.toEntityDBO), templateDBO);
    });
  }

  async create(entity: Entity): Promise<void> {
    const rows = PostgresEntityMapper.toDBO(entity);

    await this.table.insert(rows);

    this.modifiedSharedIds.add(entity.sharedId);
  }

  async bulkInsert(entities: Entity[]): Promise<void> {
    if (entities.length === 0) {
      return;
    }

    const allRows = entities.flatMap(entity => PostgresEntityMapper.toDBO(entity));

    await this.table.insert(allRows);

    entities.forEach(entity => this.modifiedSharedIds.add(entity.sharedId));
  }
}
