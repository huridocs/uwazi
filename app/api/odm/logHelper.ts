/* eslint-disable max-classes-per-file */
//@ts-ignore
import PromisePool from '@supercharge/promise-pool';
import { SyncDBDataSource } from 'api/common.v2/contracts/SyncDBDataSource';
import { model as updatelogsModel } from 'api/updatelogs';
import mongoose from 'mongoose';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { DataType, UwaziFilterQuery, models } from './model';

const getBatchSteps = async <T>(
  model: SyncDBDataSource<T>,
  query: UwaziFilterQuery<DataType<T>>,
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

  async upsertLogOne(doc: mongoose.Document) {
    const logData = { namespace: this.collectionName, mongoId: doc._id };
    await updatelogsModel.findOneAndUpdate(
      logData,
      { ...logData, timestamp: Date.now(), deleted: false },
      { upsert: true }
    );
  }

  async upsertLogMany(
    query: UwaziFilterQuery<DataType<T>>,
    deleted = false,
    batchSize = UpdateLogHelper.batchSizeUpsertMany
  ) {
    await new PromisePool()
      .for(await getBatchSteps(models[this.collectionName](), query, batchSize))
      .withConcurrency(5)
      .process(async (stepIndex: T) => {
        const batch = await models[this.collectionName]().get(
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
  // eslint-disable-next-line class-methods-use-this
  async upsertLogOne() {
    return Promise.resolve();
  }

  // eslint-disable-next-line class-methods-use-this
  async upsertLogMany() {
    return Promise.resolve();
  }
}

export class EntitiesUpdateLogHelper<T> extends UpdateLogHelper<T> {
  private filesHelper: UpdateLogger<FileType>;

  constructor(collectionName: string, filesHelper: UpdateLogger<FileType>) {
    super(collectionName);
    this.filesHelper = filesHelper;
  }

  async upsertLogOne(entity: mongoose.Document): Promise<void> {
    await super.upsertLogOne(entity);
    const typedEntity = entity as unknown as EntitySchema;
    await this.filesHelper.upsertLogMany({ entity: typedEntity.sharedId });
  }
}

export function createUpdateLogHelper<T>(collectionName: string): UpdateLogger<T> {
  if (collectionName === 'activitylog') return new NoLogger<T>();
  if (collectionName === 'entities') {
    return new EntitiesUpdateLogHelper<T>(collectionName, createUpdateLogHelper<FileType>('files'));
  }
  return new UpdateLogHelper<T>(collectionName);
}

export interface UpdateLogger<T> {
  upsertLogOne(doc: mongoose.Document): Promise<void>;

  upsertLogMany(query: UwaziFilterQuery<T>, deleted?: boolean, batchSize?: number): Promise<void>;
}
