/** @format */

import mongoose from 'mongoose';

import { model as updatelogsModel } from 'api/updatelogs';

import { OdmModel, WithId, models } from './models';

const generateID = mongoose.Types.ObjectId;
export { generateID };

function asyncPost(fn: () => Promise<void>, next: (err?: mongoose.NativeError) => void) {
  fn().then(
    () => {
      next();
    },
    err => {
      next(err);
    }
  );
}

class UpdateLogHelper {
  collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getAffectedIds(conditions: any) {
    return mongoose.models[this.collectionName].distinct('_id', conditions);
  }

  upsertLogOne(doc: mongoose.Document, next: (err?: mongoose.NativeError) => void) {
    const logData = { namespace: this.collectionName, mongoId: doc._id };
    asyncPost(async () => {
      await updatelogsModel.findOneAndUpdate(
        logData,
        { ...logData, timestamp: Date.now(), deleted: false },
        { upsert: true }
      );
    }, next);
  }

  async upsertLogMany(affectedIds: any[], deleted = false) {
    await updatelogsModel.updateMany(
      { mongoId: { $in: affectedIds }, namespace: this.collectionName },
      { $set: { timestamp: Date.now(), deleted } },
      { upsert: true, lean: true }
    );
  }
}

class OdmModelImpl<T> implements OdmModel<T> {
  db: mongoose.Model<WithId<T> & mongoose.Document>;

  logHelper: UpdateLogHelper;

  constructor(logHelper: UpdateLogHelper, db: mongoose.Model<WithId<T> & mongoose.Document>) {
    this.db = db;
    this.logHelper = logHelper;
  }

  async save(data: Readonly<Partial<T>> & { _id?: any }) {
    if (Array.isArray(data)) {
      throw new TypeError('Model.save array input no longer supported - use .saveMultiple!');
    }
    const documentExists = await this.db.findById(data._id, '_id');

    if (documentExists) {
      const saved = await this.db.findOneAndUpdate({ _id: data._id }, data, { new: true });
      if (saved === null) {
        throw Error('mongoose findOneAndUpdate should never return null!');
      }
      return saved.toObject() as WithId<T>;
    }
    const saved = await this.db.create(data);
    return saved.toObject() as WithId<T>;
  }

  async saveMultiple(data: Readonly<Partial<T>>[]) {
    return Promise.all(data.map(async d => this.save(d)));
  }

  get(query: any = {}, select = '', pagination = {}) {
    return this.db.find(query, select, Object.assign({ lean: true }, pagination));
  }

  async count(condition: any) {
    return this.db.count(condition).exec();
  }

  async getById(id: any | string | number) {
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

export function instanceModel<T = any>(collectionName: string, schema: mongoose.Schema) {
  const logHelper = new UpdateLogHelper(collectionName);
  schema.post('save', logHelper.upsertLogOne.bind(logHelper));
  schema.post('findOneAndUpdate', logHelper.upsertLogOne.bind(logHelper));
  schema.post('updateMany', function updateMany(this: any, _doc: any, next: any) {
    asyncPost(async () => {
      const affectedIds = await logHelper.getAffectedIds(this._conditions);
      await logHelper.upsertLogMany(affectedIds);
    }, next);
  });
  const model = new OdmModelImpl<T>(
    logHelper,
    mongoose.model<WithId<T> & mongoose.Document>(collectionName, schema)
  );
  models[collectionName] = model;
  return model;
}
