import mongoose, { Schema, UpdateQuery, ModelUpdateOptions } from 'mongoose';
import { createError } from 'api/utils';

import { WithId, UwaziFilterQuery } from './models';
import { tenants, Tenant } from './tenantContext';
import { DB } from './DB';

class MultiTenantMongooseModel<T> {
  dbs: { [k: string]: mongoose.Model<WithId<T> & mongoose.Document> };

  constructor(collectionName: string, schema: Schema) {
    this.dbs = {};

    Object.keys(tenants.tenants).forEach(tenantName => {
      if (!this.dbs[tenantName]) {
        this.dbs[tenantName] = DB.connectionForDB(tenants.tenants[tenantName].dbName).model<
          WithId<T> & mongoose.Document
        >(collectionName, schema);
      }
    });

    tenants.on('newTenant', (tenant: Tenant) => {
      if (!this.dbs[tenant.name]) {
        this.dbs[tenant.name] = DB.connectionForDB(tenant.dbName).model<
          WithId<T> & mongoose.Document
        >(collectionName, schema);
      }
    });
  }

  dbForCurrentTenant() {
    const currentTenantName = tenants.current().name;
    if (!this.dbs[currentTenantName]) {
      throw createError(`tenant "${currentTenantName}" db connection is not available`, 503);
    }

    return this.dbs[currentTenantName];
  }

  findById(id: any | string | number, select?: any) {
    return this.dbForCurrentTenant().findById(id, select, { lean: true });
  }

  find(query: UwaziFilterQuery<T>, select = '', options = {}) {
    return this.dbForCurrentTenant().find(query, select, options);
  }

  async findOneAndUpdate(
    query: UwaziFilterQuery<T>,
    update: Readonly<Partial<T>> & { _id?: any },
    options: any = {}
  ) {
    return this.dbForCurrentTenant().findOneAndUpdate(query, update, options);
  }

  async create(data: Readonly<Partial<T>> & { _id?: any }) {
    return this.dbForCurrentTenant().create(data);
  }

  async _updateMany(
    conditions: UwaziFilterQuery<T>,
    doc: UpdateQuery<T>,
    options: ModelUpdateOptions = {}
  ) {
    return this.dbForCurrentTenant().updateMany(conditions, doc, options);
  }

  async findOne(conditions: UwaziFilterQuery<T>, projection: any) {
    return this.dbForCurrentTenant().findOne(conditions, projection);
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

  async updateOne(conditions: UwaziFilterQuery<T>, doc: UpdateQuery<T>) {
    return this.dbForCurrentTenant().updateOne(conditions, doc);
  }
}

export { MultiTenantMongooseModel };
