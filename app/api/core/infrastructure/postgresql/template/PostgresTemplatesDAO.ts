import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { Db } from 'mongodb';
import { PostgresConnectionConfig } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { PropertySchema } from '#shared/types/commonTypes.js';
import { TemplateRow } from './PostgresTemplateMapper.js';

type PropertyDescriptor = { name: string; type: PropertyType; inheritedType?: PropertyType };

type Deps = {
  connection: PostgresConnectionConfig;
  tenantId: string;
  mongoDb: Db;
};

class PostgresTemplatesDAO extends PostgresDataSource {
  protected tableName = 'templates';

  constructor(deps: Deps) {
    super({
      connection: deps.connection,
      tenantId: deps.tenantId,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'templates' },
    });
  }

  async get(ids?: string[]): Promise<TemplateRow[]> {
    const query = this.table.query<TemplateRow>();
    if (ids !== undefined && ids.length > 0) {
      query.whereIn('_id', ids);
    }
    return query.all();
  }

  async getByNames(names: string[]): Promise<TemplateRow[]> {
    return this.table.query<TemplateRow>().whereIn('name', names).all();
  }

  private hasPropertyMatching(predicate: (p: PropertySchema) => boolean, rows: TemplateRow[]) {
    return rows.filter(
      row => (row.properties || []).some(predicate) || (row.commonProperties || []).some(predicate)
    );
  }

  async getByContent(contentId: string): Promise<TemplateRow[]> {
    const rows = await this.get();
    return this.hasPropertyMatching(p => p.content === contentId, rows);
  }

  async getByContents(contentIds: string[]): Promise<TemplateRow[]> {
    const ids = new Set(contentIds);
    const rows = await this.get();
    return this.hasPropertyMatching(p => p.content !== undefined && ids.has(p.content), rows);
  }

  async getByInheritedProperties(propertyIds: string[]): Promise<TemplateRow[]> {
    const ids = new Set(propertyIds);
    const rows = await this.get();
    return this.hasPropertyMatching(
      p => p.inherit?.property !== undefined && ids.has(p.inherit.property),
      rows
    );
  }

  async getByEntityViewPage(pageId: string): Promise<TemplateRow[]> {
    return this.table.query<TemplateRow>().where({ entityViewPage: pageId }).all();
  }

  async getByContentsOrUnrestrictedRelationship(contentIds: string[]): Promise<TemplateRow[]> {
    const ids = new Set(contentIds);
    const rows = await this.get();
    return this.hasPropertyMatching(
      p =>
        (p.content !== undefined && ids.has(p.content)) ||
        (p.type === 'relationship' && p.content == null),
      rows
    );
  }

  async countByThesauri(thesauriId: string): Promise<number> {
    const rows = await this.get();
    return this.hasPropertyMatching(p => p.content === thesauriId, rows).length;
  }

  async findUsingRelationTypeInProp(
    relationTypeId: string
  ): Promise<Pick<TemplateRow, '_id' | 'name'>[]> {
    const rows = await this.get();
    return this.hasPropertyMatching(p => p.relationType === relationTypeId, rows).map(
      ({ _id, name }) => ({ _id, name })
    );
  }

  async getDefaultTemplate(): Promise<TemplateRow | null> {
    const row = await this.table.query<TemplateRow>().where({ default: true }).first();
    return row || null;
  }

  async getAllIds(): Promise<string[]> {
    const rows = await this.table.query<TemplateRow>().select(['_id']).all();
    return rows.map(r => r._id);
  }

  async getPropertyByName(name: string): Promise<PropertySchema | undefined> {
    const rows = await this.get();
    return rows
      .flatMap(row => [...(row.properties || []), ...(row.commonProperties || [])])
      .find(p => p.name === name);
  }

  async getAllFilterableProperties(): Promise<PropertyDescriptor[]> {
    const rows = await this.get();
    const byName = new Map<string, PropertyDescriptor>();

    const add = (name: string, type: PropertyType, inheritedType?: PropertyType) => {
      if (!byName.has(name)) {
        byName.set(name, { name, type, inheritedType });
      }
    };

    add('title', 'text');

    rows.forEach(row => {
      (row.properties || []).forEach(p => {
        if (p.filter) {
          add(p.name, p.type, p.inherit?.type);
        }
      });
    });

    return [...byName.values()];
  }
}

export { PostgresTemplatesDAO };
export type { PropertyDescriptor };
