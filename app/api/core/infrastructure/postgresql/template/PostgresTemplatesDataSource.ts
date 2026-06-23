/* eslint-disable max-lines */
import { Db, ObjectId } from 'mongodb';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import {
  DefaultTemplateNotFoundError,
  TemplateDoesNotExistError,
} from '#api/core/domain/template/errors.js';
import { GenerateIdProperty } from '#api/core/domain/template/GenerateIdProperty.js';
import { Property } from '#api/core/domain/template/Property.js';
import { Template } from '#api/core/domain/template/Template.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresConnectionConfig } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { MongoTemplateMapper } from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { resetIndex, updateMapping } from '#api/search/entitiesIndex.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { PostgresTemplatesDAO } from './PostgresTemplatesDAO.js';
import { PostgresTemplateMapper } from './PostgresTemplateMapper.js';

type Deps = {
  connection: PostgresConnectionConfig;
  tenantId: string;
  mongoDb: Db;
  transactionManager: TransactionManager;
  dao: PostgresTemplatesDAO;
};

export class PostgresTemplatesDataSource extends PostgresDataSource implements TemplatesDataSource {
  protected tableName = 'templates';

  private dao: PostgresTemplatesDAO;

  private transactionManager: TransactionManager;

  private templatesMutated = new Set<string>();

  constructor(deps: Deps) {
    super({
      connection: deps.connection,
      tenantId: deps.tenantId,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'templates' },
    });

    this.dao = deps.dao;

    this.transactionManager = deps.transactionManager;

    this.transactionManager.onCommitted(async () => {
      const ids = [...this.templatesMutated];
      this.templatesMutated.clear();
      if (ids.length > 0) {
        const templates = await this.getByIds(ids);
        await updateMapping(templates.map(t => MongoTemplateMapper.toSchema(t)));
      }
    });
  }

  async updateMapping(template: Template, reset = false): Promise<void> {
    if (reset) {
      await resetIndex();
      const allTemplates = await this.getAll();
      return updateMapping(allTemplates.map(t => MongoTemplateMapper.toSchema(t)));
    }
    return updateMapping([MongoTemplateMapper.toSchema(template)]);
  }

  async getAll(): Promise<Template[]> {
    const rows = await this.dao.get();
    return rows.map(PostgresTemplateMapper.toDomain);
  }

  private mapQueryFromStrings(query: any[]): any[] {
    return query.map(traversal => ({
      direction: traversal.direction,
      types: traversal.types?.map((t: string) => new ObjectId(t)),
      match: traversal.match?.map((match: any) => ({
        templates: match.templates?.map((t: string) => new ObjectId(t)),
        sharedId: match.sharedId,
        traverse: match.traverse ? this.mapQueryFromStrings(match.traverse) : undefined,
      })),
    }));
  }

  async getGeneratedIdPropertiesByIds(ids?: string[]): Promise<GenerateIdProperty[]> {
    const idsSet = new Set(ids || []);
    const rows = await this.dao.get();
    return rows.flatMap(row =>
      (row.properties || [])
        .filter(p => p.type === 'generatedid' && idsSet.has(p._id!.toString()))
        .map(
          p =>
            new GenerateIdProperty({
              id: p._id!.toString(),
              name: p.name,
              label: p.label,
              template: row._id,
            })
        )
    );
  }

  async getV1RelationshipPropertiesByIds(ids?: string[]): Promise<V1RelationshipProperty[]> {
    const idsSet = new Set(ids || []);
    const rows = await this.dao.get();
    return rows.flatMap(row =>
      (row.properties || [])
        .filter(p => p.type === 'relationship' && idsSet.has(p._id!.toString()))
        .map(
          p =>
            new V1RelationshipProperty(
              p._id!.toString(),
              p.name,
              p.label,
              p.relationType!,
              row._id,
              p.content,
              p.inherit?.property
            )
        )
    );
  }

  async getAllTextProperties(): Promise<Property[]> {
    const rows = await this.dao.get();
    return rows.flatMap(row => {
      const template = PostgresTemplateMapper.toDomain(row);
      return [...template.commonProperties, ...template.properties].filter(
        p => p.type === 'text' || p.type === 'markdown'
      );
    });
  }

  async getPropertyByName(name: string): Promise<Property> {
    const property = await this.dao.getPropertyByName(name);

    if (!property) {
      throw new Error(`Property not found: ${name}`);
    }

    // We need a template id to hydrate the property; find the owning template by scanning rows.
    const rows = await this.dao.get();
    const owningTemplate = rows.find(row =>
      [...(row.properties || []), ...(row.commonProperties || [])].some(p => p.name === name)
    );

    if (!owningTemplate) {
      throw new Error(`Property not found: ${name}`);
    }

    return PostgresTemplateMapper.toDomain(owningTemplate).getPropertyByName(name).getDataOrThrow();
  }

  async getPropertiesBeingInherited(properties: Property[]): Promise<Property[]> {
    const propertyIds = new Set(properties.map(p => p.id));
    const rows = await this.dao.get();
    const inheritedPropertyIds = new Set<string>();

    rows.forEach(row => {
      (row.properties || []).forEach(p => {
        if (p.inherit?.property && propertyIds.has(p.inherit.property)) {
          inheritedPropertyIds.add(p.inherit.property);
        }
      });
    });

    return properties.filter(p => inheritedPropertyIds.has(p.id));
  }

  async getAllProperties(): Promise<Property[]> {
    const rows = await this.dao.get();
    return rows.flatMap(row => PostgresTemplateMapper.toDomain(row).properties);
  }

  async getTemplatesIdsHavingProperty(propertyName: string): Promise<string[]> {
    const rows = await this.dao.get();
    return rows
      .filter(row => (row.properties || []).some(p => p.name === propertyName))
      .map(row => row._id);
  }

  async getAllTemplatesIds(): Promise<string[]> {
    return this.dao.getAllIds();
  }

  async getByIds(ids: Template['id'][]): Promise<Template[]> {
    const rows = await this.dao.get(ids);
    return rows.map(PostgresTemplateMapper.toDomain);
  }

  async getByNames(names: Template['name'][]): Promise<Template[]> {
    const rows = await this.dao.getByNames(names);
    return rows.map(PostgresTemplateMapper.toDomain);
  }

  async getById(id: string): Promise<ResultType<Template, TemplateDoesNotExistError>> {
    const rows = await this.dao.get([id]);

    if (!rows.length) {
      return Result.fail(new TemplateDoesNotExistError(id));
    }

    return Result.ok(PostgresTemplateMapper.toDomain(rows[0]));
  }

  async incrementProcessingTracking(id: Template['id']) {
    const result = await this.table.raw<{
      rows: { processing: { active?: boolean; totalJobs?: number; completedJobs?: number } }[];
    }>(
      `UPDATE ?? SET processing = jsonb_set(
        COALESCE(processing, '{"active":false,"totalJobs":0,"completedJobs":0}'::jsonb),
        '{completedJobs}',
        ((COALESCE(processing->>'completedJobs', '0')::int + 1)::text)::jsonb
      )
      WHERE "_id" = ? AND "tenant_id" = ?
      RETURNING processing`,
      [this.table.tableName, id, this.table.tenantId]
    );

    const processing = result.rows[0]?.processing || {
      active: false,
      totalJobs: 0,
      completedJobs: 0,
    };

    return {
      total: processing.totalJobs || 1,
      completed: processing.completedJobs || 0,
    };
  }

  async addJobsToProcessingCount(templateId: string, totalJobs: number) {
    await this.table.raw(
      `UPDATE ?? SET processing = jsonb_set(
        COALESCE(processing, '{"active":false,"totalJobs":0,"completedJobs":0}'::jsonb),
        '{totalJobs}',
        ((COALESCE(processing->>'totalJobs', '0')::int + ?)::text)::jsonb
      ) || '{"active":true}'::jsonb
      WHERE "_id" = ? AND "tenant_id" = ?`,
      [this.table.tableName, totalJobs, templateId, this.table.tenantId]
    );
  }

  async completeProcessing(templateId: string) {
    await this.table.query().where({ _id: templateId }).update({ processing: null });
  }

  async update(template: Template): Promise<void> {
    const dbo = PostgresTemplateMapper.toDBO(template);
    await this.table
      .query()
      .where({ _id: dbo._id })
      .update({
        name: dbo.name,
        properties: JSON.stringify(dbo.properties),
        commonProperties: JSON.stringify(dbo.commonProperties),
        color: dbo.color ?? null,
        default: dbo.default,
        entityViewPage: dbo.entityViewPage ?? null,
        processing: dbo.processing ? JSON.stringify(dbo.processing) : null,
      });
    this.templatesMutated.add(template.id);
  }

  async create(template: Template): Promise<void> {
    const dbo = PostgresTemplateMapper.toDBO(template);
    await this.table.insert({
      _id: dbo._id,
      name: dbo.name,
      properties: JSON.stringify(dbo.properties),
      commonProperties: JSON.stringify(dbo.commonProperties),
      color: dbo.color ?? null,
      default: dbo.default,
      entityViewPage: dbo.entityViewPage ?? null,
      processing: dbo.processing ? JSON.stringify(dbo.processing) : null,
    });
    this.templatesMutated.add(template.id);
  }

  async isPropertyUnique(property: Property): Promise<boolean> {
    const rows = await this.dao.get();
    return !rows.some(
      row =>
        row._id !== property.template &&
        (row.properties || []).some(
          p =>
            p._id?.toString() !== property.id &&
            p.name === property.name &&
            p.type === property.type
        )
    );
  }

  async isTemplateUnique(template: Template): Promise<boolean> {
    const rows = await this.dao.get();
    return !rows.some(row => row._id !== template.id && row.name === template.name);
  }

  async getTemplatesByPropertyName(property: Property): Promise<Template[]> {
    const rows = await this.dao.get();
    return rows
      .filter(
        row =>
          row._id !== property.template &&
          (row.properties || []).some(p => p.name === property.name)
      )
      .map(PostgresTemplateMapper.toDomain);
  }

  async getDefaultTemplate(): Promise<ResultType<Template, DefaultTemplateNotFoundError>> {
    const row = await this.dao.getDefaultTemplate();

    if (!row) {
      return Result.fail(new DefaultTemplateNotFoundError());
    }

    return Result.ok(PostgresTemplateMapper.toDomain(row));
  }

  async countByThesauri(thesaurusId: string): Promise<number> {
    return this.dao.countByThesauri(thesaurusId);
  }

  async findTemplatesReferencing(templateId: string): Promise<Template[]> {
    const rows = await this.dao.get();
    return rows
      .filter(row => (row.properties || []).some(p => p.content === templateId))
      .map(PostgresTemplateMapper.toDomain);
  }

  async delete(templateId: string): Promise<void> {
    await this.table.query().where({ _id: templateId }).delete();
  }

  async bulkUpdate(templates: Template[]): Promise<void> {
    for (const template of templates) {
      // eslint-disable-next-line no-await-in-loop
      await this.update(template);
    }
  }
}
