import { SyncDBDataSource } from 'api/common.v2/database/SyncDBDataSource';
import { ObjectId } from 'mongodb';
import mongoose, { FilterQuery, QueryOptions, Schema, UpdateQuery } from 'mongoose';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { MultiTenantMongooseModel } from './MultiTenantMongooseModel';
import { UpdateLogger, createUpdateLogHelper } from './logHelper';
import { ModelBulkWriteStream } from './modelBulkWriteStream';

/** Ideas!
 *  T is the actual model-specific document Schema!
 *  DataType should be the specific Schema with Document, in order to have _id and other Document specific characteristcs
 *  WithId should be returned by get model?
 *  Do we need to type Uwazi specific Filter, Update and Query?
 */

export type DataType<T> = T & { _id?: ObjectIdSchema };

export type WithId<T> = T & { _id: ObjectId };

export type EnforcedWithId<T> = T & { _id: ObjectId };

export type UwaziFilterQuery<T> = FilterQuery<T>;
export type UwaziUpdateQuery<T> = UpdateQuery<DataType<T>>;
export type UwaziQueryOptions = QueryOptions;

export class OdmModel<T> implements SyncDBDataSource<T, T> {
  db: MultiTenantMongooseModel<T>;

  logHelper: UpdateLogger<T>;

  private documentExists(data: Partial<DataType<T>>) {
    return this.db.findById(data._id, '_id');
  }

  constructor(logHelper: UpdateLogger<T>, collectionName: string, schema: Schema) {
    this.db = new MultiTenantMongooseModel<T>(collectionName, schema);
    this.logHelper = logHelper;
  }

  async save(data: Partial<DataType<T>>, query?: any) {
    if (await this.documentExists(data)) {
      const saved = await this.db.findOneAndUpdate(
        query || { _id: data._id },
        data as UwaziUpdateQuery<DataType<T>>,
        {
          new: true,
        }
      );
      if (saved === null) {
        throw Error('The document was not updated!');
      }
      await this.logHelper.upsertLogOne(saved);
      return saved.toObject<WithId<T>>();
    }
    const saved = await this.db.create(data);
    await this.logHelper.upsertLogOne(saved);
    return saved.toObject<WithId<T>>();
  }

  async saveMultiple(
    dataArray: Partial<DataType<T>>[],
    query?: any,
    updateExisting: boolean = true
  ) {
    const { existingIds, existingData, updated } = await this.saveExisting(
      dataArray,
      query,
      updateExisting
    );
    const created = await this.saveNew(existingIds, dataArray);

    if (updated.length !== existingData.length) {
      throw Error('A document was not updated!');
    }

    const saved = updated.concat(created);
    await Promise.all(saved.map(async s => this.logHelper.upsertLogOne(s)));
    return saved.map(s => s.toObject<WithId<T>>());
  }

  private async saveNew(existingIds: Set<string>, dataArray: Partial<DataType<T>>[]) {
    const newData = dataArray.filter(d => !d._id || !existingIds.has(d._id.toString()));
    return (await this.db.createMany(newData)) || [];
  }

  private async saveExisting(
    dataArray: Partial<DataType<T>>[],
    query?: any,
    updateExisting: boolean = true
  ) {
    const ids: DataType<T>['_id'][] = [];
    dataArray.forEach(d => {
      if (d._id) {
        ids.push(d._id);
      }
    });
    const existingIds = new Set<string>(
      (
        await this.db.find({ _id: { $in: ids } } as UwaziFilterQuery<DataType<T>>, '_id', {
          lean: true,
        })
      ).map(d => d._id.toString())
    );

    const existingData = dataArray.filter(d => d._id && existingIds.has(d._id.toString()));
    if (updateExisting) {
      await this.db.bulkWrite(
        existingData.map(data => ({
          updateOne: {
            filter: { ...query, _id: data._id },
            update: data,
          },
        }))
      );

      const updated = await this.db.find({
        ...query,
        _id: { $in: Array.from(existingIds) },
      } as UwaziFilterQuery<DataType<T>>);

      return { existingIds, existingData, updated };
    }

    return { existingIds, existingData, updated: [] };
  }

  async updateMany(
    conditions: UwaziFilterQuery<DataType<T>>,
    doc: UwaziUpdateQuery<T>,
    options?: UwaziQueryOptions
  ) {
    await this.logHelper.upsertLogMany(conditions);
    return this.db._updateMany(conditions, doc, options);
  }

  async count(query: UwaziFilterQuery<DataType<T>> = {}) {
    return this.db.countDocuments(query);
  }

  async get(
    query: UwaziFilterQuery<DataType<T>> = {},
    select: any = '',
    options: UwaziQueryOptions = {}
  ) {
    const results = await this.db.find(query, select, { lean: true, ...options });
    return results as EnforcedWithId<T>[];
  }

  async getById(id: any, select?: any) {
    const results = await this.db.findById(id, select);
    return results as EnforcedWithId<T> | null;
  }

  async delete(condition: any) {
    let cond = condition;
    if (mongoose.Types.ObjectId.isValid(condition)) {
      cond = { _id: condition };
    }
    await this.logHelper.upsertLogMany(cond, true);
    return this.db.deleteMany(cond);
  }

  async facet(aggregations: any[], pipelines: any, project: any) {
    return this.db.facet(aggregations, pipelines, project);
  }

  openBulkWriteStream(stackLimit?: number, ordered?: boolean) {
    return new ModelBulkWriteStream(this, stackLimit, ordered);
  }
}

// models are accessed in api/sync, which cannot be type-safe since the document
// type is a request parameter. Thus, we store all OdmModels as type Document.
// export const models: { [index: string]: OdmModel<any> } = {};
export const models: { [index: string]: () => SyncDBDataSource<any, any> } = {};

export function instanceModel<T = any>(collectionName: string, schema: Schema) {
  const logHelper = createUpdateLogHelper<T>(collectionName);
  const model = new OdmModel<T>(logHelper, collectionName, schema);
  models[collectionName] = () => model;
  return model;
}
