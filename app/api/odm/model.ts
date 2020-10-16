import mongoose, { Schema, UpdateQuery, ModelUpdateOptions } from 'mongoose';
import { WithId, models, UwaziFilterQuery } from './models';
import { MultiTenantMongooseModel } from './MultiTenantMongooseModel';
import { createUpdateLogHelper, UpdateLogger } from './logHelper';

const generateID = mongoose.Types.ObjectId;
export { generateID };

type DataType<T> = Readonly<Partial<T>> & { _id?: any };

export class OdmModel<T> {
  db: MultiTenantMongooseModel<T>;

  logHelper: UpdateLogger<T>;

  private documentExists(data: DataType<T>) {
    return this.db.findById(data._id, '_id');
  }

  constructor(logHelper: UpdateLogger<T>, collectionName: string, schema: Schema) {
    this.db = new MultiTenantMongooseModel(collectionName, schema);
    this.logHelper = logHelper;
  }

  async save(data: DataType<T>) {
    if (await this.documentExists(data)) {
      const saved = await this.db.findOneAndUpdate({ _id: data._id }, data, {
        new: true,
      });
      if (saved === null) {
        throw Error('mongoose findOneAndUpdate should never return null!');
      }
      await this.logHelper.upsertLogOne(saved);
      return saved.toObject() as WithId<T>;
    }
    const saved = await this.db.create(data);
    await this.logHelper.upsertLogOne(saved);
    return saved.toObject() as WithId<T>;
  }

  async saveMultiple(data: Readonly<Partial<T>>[]) {
    return Promise.all(data.map(async d => this.save(d)));
  }

  async updateMany(
    conditions: UwaziFilterQuery<T>,
    doc: UpdateQuery<T>,
    options: ModelUpdateOptions = {}
  ) {
    await this.logHelper.upsertLogMany(conditions);
    return this.db._updateMany(conditions, doc, options);
  }

  async count(query: UwaziFilterQuery<T> = {}) {
    return this.db.countDocuments(query);
  }

  get(query: UwaziFilterQuery<T> = {}, select: any = '', options = {}) {
    return this.db.find(query, select, { lean: true, ...options });
  }

  async getById(id: any | string | number, select?: any) {
    return this.db.findById(id, select);
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

export function instanceModel<T = any>(collectionName: string, schema: mongoose.Schema) {
  const logHelper = createUpdateLogHelper<T>(collectionName);
  const model = new OdmModel<T>(logHelper, collectionName, schema);
  models[collectionName] = model;
  return model;
}
