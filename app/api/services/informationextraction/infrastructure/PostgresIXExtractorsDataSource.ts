import { ObjectId } from 'mongodb';
import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTable } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { IXExtractorType } from '#shared/types/extractorType.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { Extractor, IXExtractorsDataSource } from '../domain/IXExtractorsDataSource.js';
import { PostgresIXExtractorsMapper } from './PostgresIXExtractorsMapper.js';
import type { IXExtractorsRow } from './PostgresIXExtractorsRow.js';

type Deps = Omit<PostgresDataSourceDeps, 'sync'>;

const toHex = (id: ObjectIdSchema) => id.toString();

const toExtractors = async (query: PostgresTable<IXExtractorsRow>): Promise<Extractor[]> => {
  const rows = await query.all();
  return rows.map(row => PostgresIXExtractorsMapper.toDomain(row));
};

/**
 * Postgres implementation of {@link IXExtractorsDataSource}.
 *
 * `source` and `templates` are JSONB, as Mongo stores them. Information extraction data is not
 * synced between instances, so no write records an `updatelogs` row.
 */
export class PostgresIXExtractorsDataSource
  extends PostgresDataSource<IXExtractorsRow>
  implements IXExtractorsDataSource
{
  constructor(deps: Deps) {
    super('ix_extractors', deps);
  }

  async getById(id: ObjectIdSchema) {
    const row = await this.table.where({ _id: toHex(id) }).first();
    return row ? PostgresIXExtractorsMapper.toDomain(row) : undefined;
  }

  async getByIds(ids: ObjectIdSchema[]) {
    return toExtractors(this.table.whereIn('_id', ids.map(toHex)));
  }

  async getAll() {
    return toExtractors(this.table);
  }

  async getByTemplate(templateId: ObjectIdSchema) {
    return toExtractors(this.onTemplate(templateId));
  }

  async getPropertySourceExtractorsForTemplate(templateId: ObjectIdSchema) {
    return toExtractors(this.onTemplate(templateId).whereRaw(`jsonb_exists("source", 'property')`));
  }

  async getPdfSourceExtractorsForTemplate(templateId: ObjectIdSchema) {
    return toExtractors(this.onTemplate(templateId).whereRaw(`jsonb_exists("source", 'pdf')`));
  }

  async getByTemplateExcludingProperties(
    templateId: ObjectIdSchema,
    propertyNamesToKeep: string[]
  ) {
    return toExtractors(this.onTemplate(templateId).whereNotIn('property', propertyNamesToKeep));
  }

  async create(extractor: Omit<IXExtractorType, '_id'>) {
    const row = PostgresIXExtractorsMapper.toRow({ ...extractor, _id: new ObjectId() });
    await this.table.insert(row);
    return PostgresIXExtractorsMapper.toDomain(row);
  }

  async update(extractor: IXExtractorType) {
    const row = PostgresIXExtractorsMapper.toRow(extractor);
    const { _id, ...changes } = row;
    await this.table.where({ _id }).update(changes);
    return PostgresIXExtractorsMapper.toDomain(row);
  }

  async deleteByIds(ids: ObjectIdSchema[]) {
    await this.table.whereIn('_id', ids.map(toHex)).delete();
  }

  /** One atomic statement, as Mongo's `$pull`: `jsonb - text` drops every matching element. */
  async removeTemplateFromExtractors(ids: ObjectIdSchema[], templateId: ObjectIdSchema) {
    await this.table.raw(
      'UPDATE ?? SET "templates" = "templates" - ?::text WHERE "_id" = ANY(?::text[]) AND "tenant_id" = ?',
      [this.table.tableName, toHex(templateId), ids.map(toHex), this.table.tenantId]
    );
  }

  async deleteEmptyByIds(ids: ObjectIdSchema[]) {
    await this.table
      .whereIn('_id', ids.map(toHex))
      .whereRaw('jsonb_array_length("templates") = 0')
      .delete();
  }

  private onTemplate(templateId: ObjectIdSchema) {
    return this.table.whereJsonSupersetOfAny('templates', [toHex(templateId)]);
  }
}
