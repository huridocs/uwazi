//@ts-ignore
import PromisePool from '@supercharge/promise-pool';
import { models, UwaziFilterQuery } from 'api/odm/models';
import mongoose from 'mongoose';
import { model as updatelogsModel } from 'api/updatelogs';
import { OdmModel } from 'api/odm/model';

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

export class UpdateLogHelper<T> implements UpdateLogger<T> {
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

export class NoLogger<T> implements UpdateLogger<T> {
  async getAffectedIds() {
    return Promise.resolve();
  }

  async upsertLogOne() {
    return Promise.resolve();
  }

  async upsertLogMany() {
    return Promise.resolve();
  }
}

export function createUpdateLogHelper<T>(collectionName: string): UpdateLogger<T> {
  if (collectionName !== 'activitylog') return new UpdateLogHelper<T>(collectionName);
  return new NoLogger<T>();
}

export interface UpdateLogger<T> {
  getAffectedIds(conditions: any): Promise<any>;

  upsertLogOne(doc: mongoose.Document): Promise<void>;

  upsertLogMany(query: UwaziFilterQuery<T>, deleted?: boolean, batchSize?: number): Promise<void>;
}
