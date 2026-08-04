import {
  AggregateOptions,
  AggregationCursor,
  AnyBulkWriteOperation,
  BulkWriteOptions,
  BulkWriteResult,
  Collection,
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
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { CollectionWrapper } from './CollectionWrapper.js';
import { MongoPermissionTranslator } from './MongoPermissionTranslator.js';

interface ForParams<TSchema extends Document = Document> {
  collection: Collection<TSchema>;
  accessContext: AccessContext;
  translator: MongoPermissionTranslator;
}

class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * A MongoDB collection wrapper that enforces entity-level permissions on every operation.
 *
 * Extends CollectionWrapper and implements the native MongoDB Collection interface.
 * Read filters are AND-combined with the permission condition; write filters are
 * AND-combined with the write permission condition. This structurally prevents OR-bypass
 * attacks because the user's $or clauses are nested inside the top-level $and.
 *
 * Anonymous users are blocked from any insert path (insertOne, insertMany, bulkWrite).
 */
class MongoPermissionEnforcedCollection<TSchema extends Document = Document>
  extends CollectionWrapper<TSchema>
  implements Collection<TSchema>
{
  private readonly accessContext: AccessContext;

  private readonly translator: MongoPermissionTranslator;

  constructor(
    collection: Collection<TSchema>,
    accessContext: AccessContext,
    translator: MongoPermissionTranslator,
  ) {
    super(collection);
    this.accessContext = accessContext;
    this.translator = translator;
  }

  static for<TSchema extends Document = Document>(
    params: ForParams<TSchema>,
  ): MongoPermissionEnforcedCollection<TSchema> {
    return new MongoPermissionEnforcedCollection<TSchema>(
      params.collection,
      params.accessContext,
      params.translator,
    );
  }

  // ── Read operations ───────────────────────────────────────────────────────

  find<T extends TSchema>(
    filter?: Filter<TSchema>,
    options?: FindOptions<Document> | undefined,
  ): FindCursor<WithId<TSchema>> | FindCursor<T> {
    const permFilter = this.buildReadFilter(filter);
    return this.collection.find(permFilter, options) as FindCursor<WithId<TSchema>> | FindCursor<T>;
  }

  async findOne<T = TSchema>(
    filter?: Filter<TSchema>,
    options?: FindOptions<Document> | undefined,
  ): Promise<WithId<TSchema> | T | null> {
    const permFilter = this.buildReadFilter(filter);
    return this.collection.findOne(permFilter, options);
  }

  async countDocuments(
    filter?: Filter<Document>,
    options?: CountDocumentsOptions,
  ): Promise<number> {
    const permFilter = this.buildReadFilter(filter as Filter<TSchema>);
    return this.collection.countDocuments(permFilter, options);
  }

  async distinct<Key extends '_id' | keyof EnhancedOmit<TSchema, '_id'>>(
    key: Key,
    filter: Filter<TSchema> = {},
    options: DistinctOptions = {},
  ): Promise<any[] | Flatten<WithId<TSchema>[Key]>[]> {
    const permFilter = this.buildReadFilter(filter);
    return this.collection.distinct(key, permFilter, options);
  }

  aggregate<T extends Document = Document>(
    pipeline?: Document[] | undefined,
    options?: AggregateOptions | undefined,
  ): AggregationCursor<T> {
    const permMatch = this.buildReadFilter({});
    const permPipeline = Object.keys(permMatch).length > 0
      ? [{ $match: permMatch }, ...(pipeline || [])]
      : (pipeline || []);
    return this.collection.aggregate(permPipeline, options);
  }

  // ── Insert operations ───────────────────────────────────────────────────────

  async insertOne(
    doc: OptionalUnlessRequiredId<TSchema>,
    options?: InsertOneOptions | undefined,
  ): Promise<InsertOneResult<TSchema>> {
    this.applyInsertPolicy();
    return this.collection.insertOne(doc, options);
  }

  async insertMany(
    docs: OptionalUnlessRequiredId<TSchema>[],
    options?: BulkWriteOptions | undefined,
  ): Promise<InsertManyResult<TSchema>> {
    this.applyInsertPolicy();
    return this.collection.insertMany(docs, options);
  }

  async bulkWrite(
    operations: ReadonlyArray<AnyBulkWriteOperation<TSchema>>,
    options?: BulkWriteOptions,
  ): Promise<BulkWriteResult> {
    this.applyInsertPolicy();
    const permOperations = operations.map(op => this.applyBulkWritePermission(op));
    return this.collection.bulkWrite(permOperations, options);
  }

  // ── Write operations ────────────────────────────────────────────────────────

  async updateOne(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema> | Document[],
    options?: UpdateOptions,
  ): Promise<UpdateResult<TSchema>> {
    if (options?.upsert) this.applyInsertPolicy();
    if (this.isIdBasedUpsert(filter, options)) {
      return this.atomicIdUpsertUpdate(filter, update, options!);
    }
    const permFilter = this.buildWriteFilter(filter);
    return this.collection.updateOne(permFilter, update, options);
  }

  async updateMany(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options?: UpdateOptions | undefined,
  ): Promise<UpdateResult<TSchema>> {
    if (options?.upsert) this.applyInsertPolicy();
    if (this.isIdBasedUpsert(filter, options)) {
      return this.atomicIdUpsertUpdate(filter, update, options!);
    }
    const permFilter = this.buildWriteFilter(filter);
    return this.collection.updateMany(permFilter, update, options);
  }

  async replaceOne(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options?: ReplaceOptions | undefined,
  ): Promise<Document | UpdateResult<TSchema>> {
    if (options?.upsert) this.applyInsertPolicy();
    if (this.isIdBasedUpsert(filter, options)) {
      return this.atomicIdUpsertReplace(filter, replacement, options!);
    }
    const permFilter = this.buildWriteFilter(filter);
    return this.collection.replaceOne(permFilter, replacement, options);
  }

  async deleteOne(
    filter?: Filter<TSchema> | undefined,
    options?: DeleteOptions | undefined,
  ): Promise<DeleteResult> {
    const permFilter = this.buildWriteFilter(filter || {});
    return this.collection.deleteOne(permFilter, options);
  }

  async deleteMany(
    filter?: Filter<TSchema> | undefined,
    options?: DeleteOptions | undefined,
  ): Promise<DeleteResult> {
    const permFilter = this.buildWriteFilter(filter || {});
    return this.collection.deleteMany(permFilter, options);
  }

  findOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options: FindOneAndUpdateOptions & { includeResultMetadata: true },
  ): Promise<ModifyResult<TSchema>>;

  findOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options: FindOneAndUpdateOptions & { includeResultMetadata: false },
  ): Promise<WithId<TSchema> | null>;

  findOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options: FindOneAndUpdateOptions,
  ): Promise<WithId<TSchema> | null>;

  findOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
  ): Promise<WithId<TSchema> | null>;

  async findOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options: FindOneAndUpdateOptions = {},
  ): Promise<WithId<TSchema> | ModifyResult<TSchema> | null> {
    if (options.upsert) this.applyInsertPolicy();
    if (this.isIdBasedUpsert(filter, options)) {
      return this.atomicIdUpsertFindOneAndUpdate(filter, update, options);
    }
    const permFilter = this.buildWriteFilter(filter);
    return this.collection.findOneAndUpdate(permFilter, update, options);
  }

  findOneAndDelete(
    filter: Filter<TSchema>,
    options: FindOneAndDeleteOptions & { includeResultMetadata: true },
  ): Promise<ModifyResult<TSchema>>;

  findOneAndDelete(
    filter: Filter<TSchema>,
    options: FindOneAndDeleteOptions & { includeResultMetadata: false },
  ): Promise<WithId<TSchema> | null>;

  findOneAndDelete(
    filter: Filter<TSchema>,
    options: FindOneAndDeleteOptions,
  ): Promise<WithId<TSchema> | null>;

  findOneAndDelete(filter: Filter<TSchema>): Promise<WithId<TSchema> | null>;

  async findOneAndDelete(
    filter: Filter<TSchema>,
    options: FindOneAndDeleteOptions = {},
  ): Promise<ModifyResult<TSchema> | WithId<TSchema> | null> {
    const permFilter = this.buildWriteFilter(filter);
    return this.collection.findOneAndDelete(permFilter, options);
  }

  findOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options: FindOneAndReplaceOptions & { includeResultMetadata: true },
  ): Promise<ModifyResult<TSchema>>;

  findOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options: FindOneAndReplaceOptions & { includeResultMetadata: false },
  ): Promise<WithId<TSchema> | null>;

  findOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options: FindOneAndReplaceOptions,
  ): Promise<WithId<TSchema> | null>;

  findOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
  ): Promise<WithId<TSchema> | null>;

  async findOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options: FindOneAndReplaceOptions = {},
  ): Promise<ModifyResult<TSchema> | WithId<TSchema> | null> {
    if (options.upsert) this.applyInsertPolicy();
    if (this.isIdBasedUpsert(filter, options)) {
      return this.atomicIdUpsertFindOneAndReplace(filter, replacement, options);
    }
    const permFilter = this.buildWriteFilter(filter);
    return this.collection.findOneAndReplace(permFilter, replacement, options);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private buildReadFilter(filter?: Filter<TSchema>): Filter<TSchema> {
    return this.translator.applyReadCondition(filter || {}, this.accessContext) as Filter<TSchema>;
  }

  private buildWriteFilter(filter: Filter<TSchema>): Filter<TSchema> {
    return this.translator.applyWriteCondition(filter, this.accessContext) as Filter<TSchema>;
  }

  private applyInsertPolicy(): void {
    if (this.accessContext.isPrivileged()) return;
    if (this.accessContext.isAnonymous()) {
      throw new PermissionDeniedError('Anonymous users cannot insert');
    }
  }

  private isIdBasedUpsert(
    filter: Filter<TSchema>,
    options?: { upsert?: boolean },
  ): filter is { _id: any } & Filter<TSchema> {
    return !!options?.upsert && !!(filter as any)._id;
  }

  private async atomicIdUpsertUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema> | Document[],
    options: UpdateOptions,
  ): Promise<UpdateResult<TSchema>> {
    const id = (filter as any)._id;

    try {
      return await this.collection.updateOne(
        { _id: id, ...this.buildWriteFilter({}) } as Filter<TSchema>,
        update,
        { ...options, upsert: true },
      );
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        return {
          acknowledged: true,
          matchedCount: 0,
          modifiedCount: 0,
          upsertedCount: 0,
          upsertedId: null,
        };
      }
      throw error;
    }
  }

  private async atomicIdUpsertReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options: ReplaceOptions,
  ): Promise<Document | UpdateResult<TSchema>> {
    const id = (filter as any)._id;

    try {
      return await this.collection.replaceOne(
        { _id: id, ...this.buildWriteFilter({}) } as Filter<TSchema>,
        replacement,
        { ...options, upsert: true },
      );
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        return {
          acknowledged: true,
          matchedCount: 0,
          modifiedCount: 0,
          upsertedCount: 0,
          upsertedId: null,
        };
      }
      throw error;
    }
  }

  private async atomicIdUpsertFindOneAndUpdate(
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema>,
    options: FindOneAndUpdateOptions,
  ): Promise<WithId<TSchema> | ModifyResult<TSchema> | null> {
    const id = (filter as any)._id;

    try {
      return await this.collection.findOneAndUpdate(
        { _id: id, ...this.buildWriteFilter({}) } as Filter<TSchema>,
        update,
        { ...options, upsert: true },
      );
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        return options.includeResultMetadata
          ? ({ ok: 1, value: null } as ModifyResult<TSchema>)
          : null;
      }
      throw error;
    }
  }

  private async atomicIdUpsertFindOneAndReplace(
    filter: Filter<TSchema>,
    replacement: WithoutId<TSchema>,
    options: FindOneAndReplaceOptions,
  ): Promise<ModifyResult<TSchema> | WithId<TSchema> | null> {
    const id = (filter as any)._id;

    try {
      return await this.collection.findOneAndReplace(
        { _id: id, ...this.buildWriteFilter({}) } as Filter<TSchema>,
        replacement,
        { ...options, upsert: true },
      );
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        return options.includeResultMetadata
          ? ({ ok: 1, value: null } as ModifyResult<TSchema>)
          : null;
      }
      throw error;
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (error as any)?.code === 11000;
  }

  private applyBulkWritePermission(
    op: AnyBulkWriteOperation<TSchema>,
  ): AnyBulkWriteOperation<TSchema> {
    if ('updateOne' in op) {
      return {
        updateOne: {
          ...op.updateOne,
          filter: this.buildWriteFilter(op.updateOne.filter),
        },
      } as AnyBulkWriteOperation<TSchema>;
    }

    if ('updateMany' in op) {
      return {
        updateMany: {
          ...op.updateMany,
          filter: this.buildWriteFilter(op.updateMany.filter),
        },
      } as AnyBulkWriteOperation<TSchema>;
    }

    if ('deleteOne' in op) {
      return {
        deleteOne: {
          ...op.deleteOne,
          filter: this.buildWriteFilter(op.deleteOne.filter || {}),
        },
      } as AnyBulkWriteOperation<TSchema>;
    }

    if ('deleteMany' in op) {
      return {
        deleteMany: {
          ...op.deleteMany,
          filter: this.buildWriteFilter(op.deleteMany.filter || {}),
        },
      } as AnyBulkWriteOperation<TSchema>;
    }

    if ('replaceOne' in op) {
      return {
        replaceOne: {
          ...op.replaceOne,
          filter: this.buildWriteFilter(op.replaceOne.filter),
        },
      } as AnyBulkWriteOperation<TSchema>;
    }

    // insertOne does not have a filter to enforce
    return op;
  }
}

export { MongoPermissionEnforcedCollection, PermissionDeniedError };
export type { ForParams as MongoPermissionEnforcedCollectionForParams };
