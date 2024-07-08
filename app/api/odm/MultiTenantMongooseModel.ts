import { BulkWriteOptions } from 'mongodb';
import mongoose, { Schema } from 'mongoose';
import {
  DataType,
  UwaziFilterQuery,
  UwaziUpdateQuery,
  UwaziQueryOptions,
  EnforcedWithId,
  UwaziUpdateOptions,
} from './model';
import { tenants } from '../tenants/tenantContext';
import { DB } from './DB';

class MultiTenantMongooseModel<T> {
  dbs: { [k: string]: mongoose.Model<DataType<T>> };

  collectionName: string;

  schema: Schema;

  constructor(collectionName: string, schema: Schema) {
    this.dbs = {};
    this.collectionName = collectionName;
    this.schema = schema;
  }

  dbForCurrentTenant() {
    const currentTenant = tenants.current();
    return DB.connectionForDB(currentTenant.dbName).model<DataType<T>>(
      this.collectionName,
      this.schema
    );
  }

  findById(id: any, select?: any) {
    return this.dbForCurrentTenant().findById(id, select, { lean: true });
  }

  find(query: UwaziFilterQuery<DataType<T>>, select = '', options = {}) {
    return this.dbForCurrentTenant().find(query, select, options);
  }

  async findOneAndUpdate(
    query: UwaziFilterQuery<DataType<T>>,
    update: UwaziUpdateQuery<DataType<T>>,
    options: UwaziQueryOptions
  ) {
    return this.dbForCurrentTenant().findOneAndUpdate(query, update, options);
  }

  async create(data: Partial<DataType<T>>) {
    return this.dbForCurrentTenant().create(data);
  }

  async createMany(dataArray: Partial<DataType<T>>[]) {
    return this.dbForCurrentTenant().create(dataArray);
  }

  async _updateMany(
    conditions: UwaziFilterQuery<DataType<T>>,
    doc: UwaziUpdateQuery<DataType<T>>,
    options?: UwaziUpdateOptions<DataType<T>>
  ) {
    return this.dbForCurrentTenant().updateMany(conditions, doc, options);
  }

  async findOne(conditions: UwaziFilterQuery<DataType<T>>, projection: any) {
    const result = await this.dbForCurrentTenant().findOne(conditions, projection, { lean: true });
    return result as EnforcedWithId<T> | null;
  }

  async replaceOne(conditions: UwaziFilterQuery<DataType<T>>, replacement: any) {
    return this.dbForCurrentTenant().replaceOne(conditions, replacement);
  }

  async countDocuments(query: UwaziFilterQuery<DataType<T>> = {}) {
    return this.dbForCurrentTenant().countDocuments(query);
  }

  async distinct(field: string, query: UwaziFilterQuery<DataType<T>> = {}) {
    return this.dbForCurrentTenant().distinct(field, query);
  }

  async deleteMany(query: UwaziFilterQuery<DataType<T>>) {
    return this.dbForCurrentTenant().deleteMany(query);
  }

  async aggregate(aggregations?: any[]) {
    return this.dbForCurrentTenant().aggregate(aggregations);
  }

  aggregateCursor<U>(aggregations?: any[]) {
    return this.dbForCurrentTenant().aggregate<U>(aggregations) as mongoose.Aggregate<U[]>;
  }

  async facet(aggregations: any[], pipelines: any, project: any) {
    return this.dbForCurrentTenant().aggregate(aggregations).facet(pipelines).project(project);
  }

  async updateOne(conditions: UwaziFilterQuery<DataType<T>>, doc: UwaziUpdateQuery<T>) {
    return this.dbForCurrentTenant().updateOne(conditions, doc);
  }

  async bulkWrite(writes: Array<any>, options?: BulkWriteOptions) {
    return this.dbForCurrentTenant().bulkWrite(writes, options);
  }

  async ensureIndexes() {
    return this.dbForCurrentTenant().ensureIndexes();
  }
}

export { MultiTenantMongooseModel };
