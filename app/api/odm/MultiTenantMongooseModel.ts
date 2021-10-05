import mongoose, { Schema } from 'mongoose';
import { DataType, UwaziFilterQuery, UwaziUpdateQuery, UwaziQueryOptions } from './model';
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

    if (!this.dbs[currentTenant.name]) {
      this.dbs[currentTenant.name] = DB.connectionForDB(currentTenant.dbName).model<DataType<T>>(
        this.collectionName,
        this.schema
      );
    }

    return this.dbs[currentTenant.name];
  }

  findById(id: any, select?: any) {
    return this.dbForCurrentTenant().findById(id, select, { lean: true });
  }

  find(query: UwaziFilterQuery<T>, select = '', options = {}) {
    return this.dbForCurrentTenant().find(query, select, options);
  }

  async findOneAndUpdate(
    query: UwaziFilterQuery<T>,
    update: UwaziUpdateQuery<T>,
    options: UwaziQueryOptions
  ) {
    return this.dbForCurrentTenant().findOneAndUpdate(query, update, options);
  }

  async create(data: Partial<DataType<T>>) {
    return this.dbForCurrentTenant().create(data);
  }

  async _updateMany(
    conditions: UwaziFilterQuery<T>,
    doc: UwaziUpdateQuery<T>,
    options: UwaziQueryOptions
  ) {
    return this.dbForCurrentTenant().updateMany(conditions, doc, options);
  }

  async findOne(conditions: UwaziFilterQuery<T>, projection: any) {
    return this.dbForCurrentTenant().findOne(conditions, projection, { lean: true });
  }

  async replaceOne(conditions: UwaziFilterQuery<T>, replacement: any) {
    return this.dbForCurrentTenant().replaceOne(conditions, replacement);
  }

  async countDocuments(query: UwaziFilterQuery<T> = {}) {
    return this.dbForCurrentTenant().countDocuments(query);
  }

  async distinct(field: string, query: UwaziFilterQuery<T> = {}) {
    return this.dbForCurrentTenant().distinct(field, query);
  }

  async deleteMany(query: UwaziFilterQuery<T>) {
    return this.dbForCurrentTenant().deleteMany(query);
  }

  async aggregate(aggregations?: any[]) {
    return this.dbForCurrentTenant().aggregate(aggregations);
  }

  async updateOne(conditions: UwaziFilterQuery<T>, doc: UwaziUpdateQuery<T>) {
    return this.dbForCurrentTenant().updateOne(conditions, doc);
  }
}

export { MultiTenantMongooseModel };
