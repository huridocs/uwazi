/* eslint-disable max-lines */
import {
  AggregateOptions,
  AggregationCursor,
  AnyBulkWriteOperation,
  BulkWriteOptions,
  BulkWriteResult,
  Collection,
  CountDocumentsOptions,
  Db,
  DeleteOptions,
  DeleteResult,
  DistinctOptions,
  Document,
  EnhancedOmit,
  Filter,
  FindCursor,
  FindOneAndDeleteOptions,
  FindOneAndReplaceOptions,
  FindOneAndUpdateOptions,
  FindOptions,
  Flatten,
  InsertManyResult,
  InsertOneOptions,
  InsertOneResult,
  ModifyResult,
  ObjectId,
  OptionalUnlessRequiredId,
  ReplaceOptions,
  UpdateFilter,
  UpdateOptions,
  UpdateResult,
  WithId,
  WithoutId,
} from 'mongodb';
import { MongoTransactionManager } from './MongoTransactionManager';
import { SessionScopedCollection } from './SessionScopedCollection';
import { BulkWriteStream } from './BulkWriteStream';
import { MongoResultSet } from './MongoResultSet';
import { CollectionWrapper } from './CollectionWrapper';

export class SyncedCollection<TSchema extends Document = Document>
  extends CollectionWrapper<TSchema>
  implements Collection<TSchema>
{
  private transactionManager: MongoTransactionManager;

  private db: Db;

  private sessionScopedCollection: SessionScopedCollection;

  constructor(
    collection: Collection<TSchema>,
    transactionManager: MongoTransactionManager,
    db: Db
  ) {
    super(collection);
    this.transactionManager = transactionManager;
    this.db = db;
    this.sessionScopedCollection = new SessionScopedCollection(
      this.db.collection('updatelogs'),
      this.transactionManager
    );
  }

  private async insertSyncLogs(mongoIds: ObjectId[]) {
    if (mongoIds.length !== 0) {
      await this.sessionScopedCollection.insertMany(
        mongoIds.map(insertedId => ({
          timestamp: Date.now(),
          namespace: this.collection.collectionName,
          mongoId: insertedId,
          deleted: false,
        }))
      );
    }
  }

  private async upsertSyncLogs(conditions: any[], deleted: boolean = false) {
    if (conditions.length === 0) {
      return;
    }

    const modifiedDocuments = this.collection.find({ $or: conditions }, { projection: { _id: 1 } });

    const stream = new BulkWriteStream(this.sessionScopedCollection);

    await new MongoResultSet(modifiedDocuments, d => d).forEach(async ({ _id }) => {
      await stream.updateOne(
        { mongoId: _id },
        {
          $set: {
            timestamp: Date.now(),
            mongoId: _id,
            namespace: this.collection.collectionName,
            deleted,
          },
        },
        true
      );
    });
    await stream.flush();
  }

  async insertOne(
    doc: OptionalUnlessRequiredId<TSchema>,
    options?: InsertOneOptions | undefined
  ): Promise<InsertOneResult<TSchema>> {
    const result = await this.collection.insertOne(doc, options);
    await this.insertSyncLogs([result.insertedId]);
    return result;
  }

  async insertMany(
    docs: OptionalUnlessRequiredId<TSchema>[],
    options?: BulkWriteOptions | undefined
  ): Promise<InsertManyResult<TSchema>> {
    const result = await this.collection.insertMany(docs, options);
    await this.insertSyncLogs(Object.values(result.insertedIds));
    return result;
  }

  async bulkWrite(
    operations: AnyBulkWriteOperation<TSchema>[],
    options?: BulkWriteOptions | undefined
  ): Promise<BulkWriteResult> {
    const updateConditions = operations
      .map((op: any) => op.updateOne?.filter || op.updateMany?.filter)
      .filter((op: any) => op);

    const deleteConditions = operations
      .map((op: any) => op.deleteOne?.filter || op.deleteMany?.filter)
      .filter((op: any) => op);

    await this.upsertSyncLogs(deleteConditions, true);
    const result = await this.collection.bulkWrite(operations, options);
    await Promise.all([
      this.upsertSyncLogs(updateConditions),
      this.insertSyncLogs(
        Object.values(result.upsertedIds).concat(Object.values(result.insertedIds))
      ),
    ]);
    return result;
  }

  async updateOne(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema> | Partial<TSchema>,
    options?: UpdateOptions | undefined
  ): Promise<UpdateResult<TSchema>> {
    const result = await this.collection.updateOne(filter, update, options);
    await this.upsertSyncLogs([filter]);
    return result;
  }

  async replaceOne(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options?: ReplaceOptions | undefined
  ): Promise<Document | UpdateResult<TSchema>> {
    const result = await this.collection.replaceOne(filter, replacement, options);
    await this.upsertSyncLogs([filter]);
    return result;
  }

  async updateMany(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options?: UpdateOptions | undefined
  ): Promise<UpdateResult<TSchema>> {
    const result = await this.collection.updateMany(filter, update, options);
    await this.upsertSyncLogs([filter]);
    return result;
  }

  async deleteOne(
    filter?: Filter<TSchema> | undefined,
    options?: DeleteOptions | undefined
  ): Promise<DeleteResult> {
    await this.upsertSyncLogs([filter || {}], true);
    return this.collection.deleteOne(filter, options);
  }

  async deleteMany(
    filter?: Filter<TSchema> | undefined,
    options?: DeleteOptions | undefined
  ): Promise<DeleteResult> {
    await this.upsertSyncLogs([filter || {}], true);
    return this.collection.deleteMany(filter, options);
  }

  async findOne<T = TSchema>(
    filter?: Filter<TSchema>,
    options?: FindOptions<Document> | undefined
  ): Promise<WithId<TSchema> | T | null> {
    return this.collection.findOne(filter || {}, options);
  }

  find<T extends TSchema>(
    filter?: Filter<TSchema>,
    options?: FindOptions<Document> | undefined
  ): FindCursor<WithId<TSchema>> | FindCursor<T> {
    return this.collection.find(filter || {}, options);
  }

  async countDocuments(
    filter?: Document | undefined,
    options?: CountDocumentsOptions | undefined
  ): Promise<number> {
    return this.collection.countDocuments(filter, options);
  }

  async distinct<Key extends '_id' | keyof EnhancedOmit<TSchema, '_id'>>(
    key: Key,
    filter: Filter<TSchema> = {},
    options: DistinctOptions = {}
  ): Promise<any[] | Flatten<WithId<TSchema>[Key]>[]> {
    return this.collection.distinct(key, filter, options);
  }

  findOneAndDelete(
    filter: Filter<TSchema>,
    options: FindOneAndDeleteOptions & { includeResultMetadata: true }
  ): Promise<ModifyResult<TSchema>>;

  findOneAndDelete(
    filter: Filter<TSchema>,
    options: FindOneAndDeleteOptions & { includeResultMetadata: false }
  ): Promise<WithId<TSchema> | null>;

  findOneAndDelete(
    filter: Filter<TSchema>,
    options: FindOneAndDeleteOptions
  ): Promise<WithId<TSchema> | null>;

  findOneAndDelete(filter: Filter<TSchema>): Promise<WithId<TSchema> | null>;

  async findOneAndDelete(
    filter: Filter<TSchema>,
    options: FindOneAndDeleteOptions = {}
  ): Promise<ModifyResult<TSchema> | WithId<TSchema> | null> {
    await this.upsertSyncLogs([filter], true);
    const result = await this.collection.findOneAndDelete(filter, options);
    return result;
  }

  findOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options: FindOneAndReplaceOptions & { includeResultMetadata: true }
  ): Promise<ModifyResult<TSchema>>;

  findOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options: FindOneAndReplaceOptions & { includeResultMetadata: false }
  ): Promise<WithId<TSchema> | null>;

  findOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options: FindOneAndReplaceOptions
  ): Promise<WithId<TSchema> | null>;

  findOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>
  ): Promise<WithId<TSchema> | null>;

  async findOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options: FindOneAndDeleteOptions = {}
  ): Promise<ModifyResult<TSchema> | WithId<TSchema> | null> {
    const result = await this.collection.findOneAndReplace(filter, replacement, options);
    await this.upsertSyncLogs([filter]);
    return result;
  }

  findOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options: FindOneAndUpdateOptions & { includeResultMetadata: true }
  ): Promise<ModifyResult<TSchema>>;

  findOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options: FindOneAndUpdateOptions & { includeResultMetadata: false }
  ): Promise<WithId<TSchema> | null>;

  findOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options: FindOneAndUpdateOptions
  ): Promise<WithId<TSchema> | null>;

  findOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>
  ): Promise<WithId<TSchema> | null>;

  async findOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options: FindOneAndDeleteOptions = {}
  ): Promise<WithId<TSchema> | ModifyResult<TSchema> | null> {
    const result = await this.collection.findOneAndUpdate(filter, update, options);
    await this.upsertSyncLogs([filter]);
    return result;
  }

  aggregate<T extends Document = Document>(
    pipeline?: Document[] | undefined,
    options?: AggregateOptions | undefined
  ): AggregationCursor<T> {
    return this.collection.aggregate(pipeline, options);
  }
}
