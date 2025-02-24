import { BulkWriteOptions } from 'mongodb';
import mongoose, { ProjectionType, Schema } from 'mongoose';
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
import { dbSessionContext } from './sessionsContext';

export class MongooseModelWrapper<T> {
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
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().findById(id, select, {
      lean: true,
      ...(session && { session }),
    });
  }

  find(
    query: UwaziFilterQuery<DataType<T>>,
    select: ProjectionType<DataType<T>> = {},
    options = {}
  ) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().find(query, select, {
      ...options,
      ...(session && { session }),
    });
  }

  async findOneAndUpdate(
    query: UwaziFilterQuery<DataType<T>>,
    update: UwaziUpdateQuery<DataType<T>>,
    options: UwaziQueryOptions = {}
  ) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().findOneAndUpdate(query, update, {
      ...options,
      ...(session && { session }),
    });
  }

  async create(data: Partial<DataType<T>>[], options: any = {}) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().create(data, {
      ...options,
      ...(session && { session, ordered: true }),
    });
  }

  async createMany(dataArray: Partial<DataType<T>>[], options: any = {}) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().create(dataArray, {
      ...options,
      ...(session && { session, ordered: true }),
    });
  }

  async _updateMany(
    conditions: UwaziFilterQuery<DataType<T>>,
    doc: UwaziUpdateQuery<DataType<T>>,
    options: UwaziUpdateOptions<DataType<T>> = {}
  ) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().updateMany(conditions, doc, {
      ...options,
      ...(session && { session }),
    });
  }

  async findOne(conditions: UwaziFilterQuery<DataType<T>>, projection: any) {
    const session = dbSessionContext.getSession();
    const result = await this.dbForCurrentTenant().findOne(conditions, projection, {
      lean: true,
      ...(session && { session }),
    });
    return result as EnforcedWithId<T> | null;
  }

  async replaceOne(conditions: UwaziFilterQuery<DataType<T>>, replacement: any) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().replaceOne(conditions, replacement, {
      ...(session && { session }),
    });
  }

  async countDocuments(query: UwaziFilterQuery<DataType<T>> = {}, options: any = {}) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().countDocuments(query, {
      ...options,
      ...(session && { session }),
    });
  }

  async distinct(field: string, query: UwaziFilterQuery<DataType<T>> = {}) {
    const session = dbSessionContext.getSession();
    if (session) {
      return this.dbForCurrentTenant().distinct(field, query).session(session);
    }
    return this.dbForCurrentTenant().distinct(field, query);
  }

  async deleteMany(query: UwaziFilterQuery<DataType<T>>, options: any = {}) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().deleteMany(query, {
      ...options,
      ...(session && { session }),
    });
  }

  async aggregate(aggregations?: any[]) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().aggregate(aggregations, session && { session });
  }

  aggregateCursor<U>(aggregations?: any[]) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().aggregate<U>(
      aggregations,
      session && { session }
    ) as mongoose.Aggregate<U[]>;
  }

  async facet(aggregations: any[], pipelines: any, project: any) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant()
      .aggregate(aggregations, session && { session })
      .facet(pipelines)
      .project(project);
  }

  async updateOne(conditions: UwaziFilterQuery<DataType<T>>, doc: UwaziUpdateQuery<T>) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().updateOne(conditions, doc, {
      ...(session && { session }),
    });
  }

  async bulkWrite(writes: Array<any>, options?: BulkWriteOptions) {
    const session = dbSessionContext.getSession();
    return this.dbForCurrentTenant().bulkWrite(writes, {
      ...options,
      ...(session && { session }),
    });
  }

  async ensureIndexes() {
    return this.dbForCurrentTenant().ensureIndexes();
  }

  async startSession() {
    return this.dbForCurrentTenant().db.startSession();
  }
}
