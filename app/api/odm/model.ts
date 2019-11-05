/** @format */

import mongoose from 'mongoose';

import { model as updatelogsModel } from 'api/updatelogs';

import { OdmModel, models } from './models';

const generateID = mongoose.Types.ObjectId;
export { generateID };

class UpdateLogHelper {
  collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getAffectedIds(conditions: any) {
    return mongoose.models[this.collectionName].distinct('_id', conditions);
  }

  async upsertLogOne(doc: mongoose.Document, next: (err?: mongoose.NativeError) => void) {
    const logData = { namespace: this.collectionName, mongoId: doc._id };
    await updatelogsModel.findOneAndUpdate(
      logData,
      { ...logData, timestamp: Date.now(), deleted: false },
      { upsert: true }
    );
    next();
  }

  async upsertLogMany(affectedIds: any[], deleted = false) {
    await updatelogsModel.updateMany(
      { mongoId: { $in: affectedIds }, namespace: this.collectionName },
      { $set: { timestamp: Date.now(), deleted } },
      { upsert: true, lean: true }
    );
  }
}

class OdmModelImpl<T extends mongoose.Document> implements OdmModel<T> {
  db: mongoose.Model<T>;

  logHelper: UpdateLogHelper;

  constructor(logHelper: UpdateLogHelper, db: mongoose.Model<T>) {
    this.db = db;
    this.logHelper = logHelper;
  }

  async save(data: T) {
    if (Array.isArray(data)) {
      throw new TypeError('Model.save array input no longer supported - use .saveMultiple!');
    }
    const documentExists = await this.db.findById(data._id, '_id');

    if (documentExists) {
      const saved = await this.db.findOneAndUpdate({ _id: data._id }, data, { new: true });
      if (saved === null) {
        throw Error('mongoose findOneAndUpdate should never return null!');
      }
      return saved.toObject();
    }
    const saved = await this.db.create(data);
    return saved.toObject();
  }

  saveMultiple(data: T[]) {
    return Promise.all(data.map(d => this.save(d)));
  }

  get(query: any, select = '', pagination = {}) {
    return this.db.find(query, select, Object.assign({ lean: true }, pagination));
  }

  count(condition: any) {
    return this.db.count(condition).exec();
  }

  getById(id: any | string | number) {
    return this.db.findById(id, {}, { lean: true }).exec();
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

export function instanceModel<T extends mongoose.Document>(
  collectionName: string,
  schema: mongoose.Schema
) {
  const logHelper = new UpdateLogHelper(collectionName);
  schema.post('save', logHelper.upsertLogOne.bind(logHelper));
  schema.post('findOneAndUpdate', logHelper.upsertLogOne.bind(logHelper));
  schema.post('updateMany', async function updateMany(this: any, _doc, next) {
    const affectedIds = await logHelper.getAffectedIds(this._conditions);
    await logHelper.upsertLogMany(affectedIds);
    next();
  });
  const model = new OdmModelImpl(logHelper, mongoose.model<T>(collectionName, schema));
  // Store a 'generic' model for use in /api/async (where the collection name is passed as request paramter).
  models[collectionName] = new OdmModelImpl<mongoose.Document>(logHelper, model.db);
  return model;
}
