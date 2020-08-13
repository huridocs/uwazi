import mongoose, { Schema, UpdateQuery, ModelUpdateOptions } from 'mongoose';

import { model as updatelogsModel } from 'api/updatelogs';

import { OdmModel, WithId, models, UwaziFilterQuery } from './models';
import { MultiTenantMongooseModel } from './MultiTenantMongooseModel';

const generateID = mongoose.Types.ObjectId;
export { generateID };

class UpdateLogHelper {
  collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getAffectedIds(conditions: any) {
    return models[this.collectionName].db.distinct('_id', conditions);
  }

  async upsertLogOne(doc: mongoose.Document) {
    const logData = { namespace: this.collectionName, mongoId: doc._id };
    await updatelogsModel.findOneAndUpdate(
      logData,
      { ...logData, timestamp: Date.now(), deleted: false },
      { upsert: true }
    );
  }

  async upsertLogMany(affectedIds: any[], deleted = false) {
    await updatelogsModel._updateMany(
      { mongoId: { $in: affectedIds }, namespace: this.collectionName },
      { $set: { timestamp: Date.now(), deleted } },
      { lean: true }
    );
  }
}

class OdmModelImpl<T> implements OdmModel<T> {
  db: MultiTenantMongooseModel<T>;

  logHelper: UpdateLogHelper;

  constructor(logHelper: UpdateLogHelper, collectionName: string, schema: Schema) {
    this.db = new MultiTenantMongooseModel(collectionName, schema);
    this.logHelper = logHelper;
  }

  async save(data: Readonly<Partial<T>> & { _id?: any }) {
    if (Array.isArray(data)) {
      throw new TypeError('Model.save array input no longer supported - use .saveMultiple!');
    }

    const documentExists = await this.db.findById(data._id, '_id');

    if (documentExists) {
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
    const result = await this.db._updateMany(conditions, doc, options);
    const affectedIds = await this.logHelper.getAffectedIds(conditions);
    await this.logHelper.upsertLogMany(affectedIds);
    return result;
  }

  async count(condition: any = {}) {
    return this.db.countDocuments(condition);
  }

  get(query: any = {}, select = '', pagination = {}) {
    return this.db.find(query, select, Object.assign({ lean: true }, pagination));
  }

  async getById(id: any | string | number, select?: any) {
    return this.db.findById(id, select);
  }

  async delete(condition: any) {
    let cond = condition;
    if (mongoose.Types.ObjectId.isValid(condition)) {
      cond = { _id: condition };
    }

    const affectedIds = await this.db.distinct('_id', cond);
    const result = await this.db.deleteMany(cond);

    if (affectedIds.length) {
      await this.logHelper.upsertLogMany(affectedIds, true);
    }

    return result;
  }
}

export function instanceModel<T = any>(collectionName: string, schema: mongoose.Schema) {
  const logHelper = new UpdateLogHelper(collectionName);
  const model = new OdmModelImpl<T>(logHelper, collectionName, schema);
  models[collectionName] = model;
  return model;
}
