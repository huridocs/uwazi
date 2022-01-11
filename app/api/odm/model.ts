import { SessionOptions, WithId as _WithId } from 'mongodb';
import mongoose, {
  Schema,
  UpdateQuery,
  ModelUpdateOptions,
  FilterQuery,
  QueryOptions,
  ClientSession,
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
export type UwaziUpdateQuery<T> = UpdateQuery<Partial<T>>;
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

  async save(data: Partial<DataType<T>>, query?: any, session?: ClientSession) {
    if (await this.documentExists(data)) {
      const saved = await this.db.findOneAndUpdate(
        query || { _id: data._id },
        data as UwaziUpdateQuery<DataType<T>>,
        {
          new: true,
          session,
        }
      );
      if (saved === null) {
        throw Error('The document was not updated!');
      }
      await this.logHelper.upsertLogOne(saved);
      return saved.toObject<WithId<T>>();
    }
    const [saved] = await this.db.create(data, session);
    await this.logHelper.upsertLogOne(saved);
    return saved.toObject<WithId<T>>();
  }

  async saveMultiple(data: Partial<DataType<T>>[], session?: ClientSession) {
    return Promise.all(data.map(async d => this.save(d, null, session)));
  }

  async updateMany(
    conditions: UwaziFilterQuery<DataType<T>>,
    doc: UpdateQuery<T>,
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
