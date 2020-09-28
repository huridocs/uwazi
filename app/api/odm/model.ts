//@ts-ignore
import PromisePool from '@supercharge/promise-pool';
import mongoose, { Schema, UpdateQuery, ModelUpdateOptions } from 'mongoose';
import { model as updatelogsModel } from 'api/updatelogs';

import { WithId, models, UwaziFilterQuery } from './models';
import { MultiTenantMongooseModel } from './MultiTenantMongooseModel';

const generateID = mongoose.Types.ObjectId;
export { generateID };

const getBatchSteps = async <T>(
  model: OdmModel<T>,
  query: UwaziFilterQuery<T>,
  batchSize: number
): Promise<T[]> => {
  const allIds = await model.get(query, '_id', { sort: { _id: 1 } });

  const steps = [];
  for (let i = 0; i < allIds.length; i += batchSize) {
    steps.push(allIds[i]);
  }

  return steps;
};

export class UpdateLogHelper<T> {
  collectionName: string;

  static batchSizeUpsertMany = 50000;

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

  async upsertLogMany(
    query: UwaziFilterQuery<T>,
    deleted = false,
    batchSize = UpdateLogHelper.batchSizeUpsertMany
  ) {
    await new PromisePool()
      .for(await getBatchSteps(models[this.collectionName], query, batchSize))
      .withConcurrency(5)
      .process(async (stepIndex: T) => {
        const batch = await models[this.collectionName].get(
          { ...query, $and: [{ _id: { $gte: stepIndex } }] },
          { _id: 1 },
          { limit: batchSize }
        );

        await updatelogsModel._updateMany(
          { mongoId: { $in: batch }, namespace: this.collectionName },
          { $set: { timestamp: Date.now(), deleted } },
          { lean: true }
        );
      });
  }
}

type DataType<T> = Readonly<Partial<T>> & { _id?: any };

export class OdmModel<T> {
  db: MultiTenantMongooseModel<T>;

  logHelper: UpdateLogHelper<T>;

  private documentExists(data: DataType<T>) {
    return this.db.findById(data._id, '_id');
  }

  constructor(logHelper: UpdateLogHelper<T>, collectionName: string, schema: Schema) {
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

  get(query: UwaziFilterQuery<T> = {}, select: any = '', pagination = {}) {
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
    await this.logHelper.upsertLogMany(cond, true);
    return this.db.deleteMany(cond);
  }
}

export function instanceModel<T = any>(collectionName: string, schema: mongoose.Schema) {
  const logHelper = new UpdateLogHelper<T>(collectionName);
  const model = new OdmModel<T>(logHelper, collectionName, schema);
  models[collectionName] = model;
  return model;
}
