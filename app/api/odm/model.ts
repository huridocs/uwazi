import { ObjectId, WithId as _WithId } from 'mongodb';
import mongoose, {
  Schema,
  UpdateQuery,
  ModelUpdateOptions,
  FilterQuery,
  QueryOptions,
} from 'mongoose';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { MultiTenantMongooseModel } from './MultiTenantMongooseModel';
import { createUpdateLogHelper, UpdateLogger } from './logHelper';

/** Ideas!
 *  T is the actual model-specific document Schema!
 *  DataType should be the specific Schema with Document, in order to have _id and other Document specific characteristcs
 *  WithId should be returned by get model?
 *  Do we need to type Uwazi specific Filter, Update and Query?
 */

export type DataType<T> = T & { _id?: ObjectIdSchema };

export type WithId<T> = _WithId<T>;

export type EnforcedWithId<T> = WithId<mongoose.EnforceDocument<DataType<T>, {}>>;

export type UwaziFilterQuery<T> = FilterQuery<T>;
export type UwaziUpdateQuery<T> = UpdateQuery<DataType<T>>;
export type UwaziQueryOptions = QueryOptions;

const generateID = mongoose.Types.ObjectId;
export { generateID };

export class OdmModel<T> {
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

  // async saveMultiple(data: Partial<DataType<T>>[]) {
  //   return Promise.all(data.map(async d => this.save(d)));
  // }

  // eslint-disable-next-line max-statements
  async saveMultiple(dataArray: Partial<DataType<T>>[]) {
    // separate existing and non-existing
    const ids: DataType<T>['_id'][] = [];
    dataArray.forEach(d => {
      if (d._id) {
        ids.push(d._id);
      }
    });
    const existingIds = new Set(
      (await this.db.find({ _id: { $in: ids } }, { _id: 1 }, { lean: true })).map(d =>
        d._id.toString()
      )
    );
    // update existing - check valid save - error if one missing
    const existingData = dataArray.filter(d => d._id && existingIds.has(d._id.toString()));
    // existingData[0]._id = new ObjectId();
    const updateResult = await this.db.bulkWrite(
      existingData.map(data => ({
        updateOne: {
          filter: { _id: data._id },
          update: data,
        },
      }))
    );
    const updated = await this.db.find({ _id: { $in: Array.from(existingIds) } });
    // create non-existing
    const newData = dataArray.filter(d => !d._id || !existingIds.has(d._id.toString()));
    const created = (await this.db.createMany(newData)) || [];

    if (updateResult.result.nModified !== existingData.length) {
      throw Error('A document was not updated!');
    }

    //collate both
    const saved = updated.concat(created);

    // log - upsertLogMany expects a query?
    await Promise.all(saved.map(async s => this.logHelper.upsertLogOne(s)));

    return saved.map(s => s.toObject<WithId<T>>());
  }

  async updateMany(
    conditions: UwaziFilterQuery<DataType<T>>,
    doc: UwaziUpdateQuery<T>,
    options: ModelUpdateOptions = {}
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
}

// models are accessed in api/sync, which cannot be type-safe since the document
// type is a request parameter. Thus, we store all OdmModels as type Document.
export const models: { [index: string]: OdmModel<any> } = {};

export function instanceModel<T = any>(collectionName: string, schema: Schema) {
  const logHelper = createUpdateLogHelper<T>(collectionName);
  const model = new OdmModel<T>(logHelper, collectionName, schema);
  models[collectionName] = model;
  return model;
}
