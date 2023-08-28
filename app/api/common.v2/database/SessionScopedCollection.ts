/* eslint-disable max-lines */
import {
  AggregateOptions,
  AggregationCursor,
  AnyBulkWriteOperation,
  BulkWriteOptions,
  BulkWriteResult,
  ClientSession,
  Collection,
  CommandOperationOptions,
  CountDocumentsOptions,
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
  OptionalUnlessRequiredId,
  ReplaceOptions,
  UpdateFilter,
  UpdateOptions,
  UpdateResult,
  WithId,
  WithoutId,
} from 'mongodb';

import { CollectionWrapper } from './CollectionWrapper';
import { MongoTransactionManager } from './MongoTransactionManager';

export class SessionScopedCollection<TSchema extends Document = Document>
  extends CollectionWrapper<TSchema>
  implements Collection<TSchema>
{
  private transactionManager: MongoTransactionManager;

  constructor(collection: Collection<TSchema>, transactionManager: MongoTransactionManager) {
    super(collection);
    this.transactionManager = transactionManager;
  }

  private appendSession<S extends CommandOperationOptions>(
    options?: S
  ): { session: ClientSession | undefined } {
    return {
      ...options,
      session: this.transactionManager.getSession(),
    };
  }

  async insertOne(
    doc: OptionalUnlessRequiredId<TSchema>,
    options?: InsertOneOptions | undefined
  ): Promise<InsertOneResult<TSchema>> {
    return this.collection.insertOne(doc, this.appendSession(options));
  }

  async insertMany(
    docs: OptionalUnlessRequiredId<TSchema>[],
    options?: BulkWriteOptions | undefined
  ): Promise<InsertManyResult<TSchema>> {
    return this.collection.insertMany(docs, this.appendSession(options));
  }

  async bulkWrite(
    operations: AnyBulkWriteOperation<TSchema>[],
    options?: BulkWriteOptions | undefined
  ): Promise<BulkWriteResult> {
    return this.collection.bulkWrite(operations, this.appendSession(options));
  }

  async updateOne(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema> | Partial<TSchema>,
    options?: UpdateOptions | undefined
  ): Promise<UpdateResult<TSchema>> {
    return this.collection.updateOne(filter, update, this.appendSession(options));
  }

  async replaceOne(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options?: ReplaceOptions | undefined
  ): Promise<Document | UpdateResult<TSchema>> {
    return this.collection.replaceOne(filter, replacement, this.appendSession(options));
  }

  async updateMany(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options?: UpdateOptions | undefined
  ): Promise<UpdateResult<TSchema>> {
    return this.collection.updateMany(filter, update, this.appendSession(options));
  }

  async deleteOne(
    filter?: Filter<TSchema> | undefined,
    options?: DeleteOptions | undefined
  ): Promise<DeleteResult> {
    return this.collection.deleteOne(filter, this.appendSession(options));
  }

  async deleteMany(
    filter?: Filter<TSchema> | undefined,
    options?: DeleteOptions | undefined
  ): Promise<DeleteResult> {
    return this.collection.deleteMany(filter, this.appendSession(options));
  }

  async findOne<T = TSchema>(
    filter?: Filter<TSchema>,
    options?: FindOptions<Document> | undefined
  ): Promise<WithId<TSchema> | T | null> {
    return this.collection.findOne(filter || {}, this.appendSession(options));
  }

  find<T extends TSchema>(
    filter?: Filter<TSchema>,
    options?: FindOptions<Document> | undefined
  ): FindCursor<WithId<TSchema>> | FindCursor<T> {
    return this.collection.find(filter || {}, this.appendSession(options));
  }

  async countDocuments(
    filter?: Document | undefined,
    options?: CountDocumentsOptions | undefined
  ): Promise<number> {
    return this.collection.countDocuments(filter, this.appendSession(options));
  }

  async distinct<Key extends '_id' | keyof EnhancedOmit<TSchema, '_id'>>(
    key: Key,
    filter: Filter<TSchema> = {},
    options: DistinctOptions = {}
  ): Promise<any[] | Flatten<WithId<TSchema>[Key]>[]> {
    return this.collection.distinct(key, filter, this.appendSession(options));
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
  ): Promise<ModifyResult<TSchema>>;

  findOneAndDelete(filter: Filter<TSchema>): Promise<ModifyResult<TSchema>>;

  async findOneAndDelete(
    filter: Filter<TSchema>,
    options?: FindOneAndDeleteOptions & { includeResultMetadata?: boolean }
  ): Promise<ModifyResult<TSchema> | WithId<TSchema> | null> {
    return this.collection.findOneAndDelete(filter, this.appendSession(options));
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
  ): Promise<ModifyResult<TSchema>>;

  findOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>
  ): Promise<ModifyResult<TSchema>>;

  async findOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options?: FindOneAndDeleteOptions & { includeResultMetadata?: boolean }
  ): Promise<ModifyResult<TSchema> | WithId<TSchema> | null> {
    return this.collection.findOneAndReplace(filter, replacement, this.appendSession(options));
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
  ): Promise<ModifyResult<TSchema>>;

  findOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>
  ): Promise<ModifyResult<TSchema>>;

  async findOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options?: FindOneAndDeleteOptions & { includeResultMetadata?: boolean }
  ): Promise<WithId<TSchema> | ModifyResult<TSchema> | null> {
    return this.collection.findOneAndUpdate(filter, update, this.appendSession(options));
  }

  aggregate<T extends Document = Document>(
    pipeline?: Document[] | undefined,
    options?: AggregateOptions | undefined
  ): AggregationCursor<T> {
    return this.collection.aggregate(pipeline, this.appendSession(options));
  }
}
