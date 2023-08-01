import {
  BulkWriteResult,
  Collection,
  Db,
  Document,
  Filter,
  InsertManyResult,
  InsertOneResult,
  ObjectId,
  WithId,
} from 'mongodb';
import { BulkWriteStream } from './BulkWriteStream';
import { MongoTransactionManager } from './MongoTransactionManager';
import { MongoResultSet } from './MongoResultSet';

type MaxAmountOfParameters<F extends (...args: any) => any> = Required<Parameters<F>>['length'];

/**
 * Map of collection members to position of its options argument.
 * Position is based on 1.
 */
type MethodsOptionsArgPosition = {
  [method in keyof Collection]: Collection[method] extends (...args: any) => any
    ? MaxAmountOfParameters<Collection[method]>
    : null;
};

export interface UpdateLog {
  timestamp: number;
  namespace: string;
  mongoId: ObjectId;
  deleted: boolean;
}

export abstract class MongoDataSource<CollectionSchema extends Document = any> {
  protected db: Db;

  protected abstract collectionName: string;

  private transactionManager: MongoTransactionManager;

  private collectionProxy?: Collection<CollectionSchema>;

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    this.db = db;
    this.transactionManager = transactionManager;
  }

  static scopedMethods: MethodsOptionsArgPosition = {
    insertOne: 2,
    insertMany: 2,
    bulkWrite: 2,
    updateOne: 3,
    replaceOne: 3,
    updateMany: 3,
    deleteOne: 2,
    deleteMany: 2,
    rename: 2,
    drop: 1,
    findOne: 2,
    find: 2,
    options: 1,
    isCapped: 1,
    createIndex: 2,
    createIndexes: 2,
    dropIndex: 2,
    dropIndexes: 1,
    listIndexes: 1,
    indexExists: 2,
    indexInformation: 1,
    estimatedDocumentCount: 1,
    countDocuments: 2,
    distinct: 3,
    indexes: 1,
    stats: 1,
    findOneAndDelete: 2,
    findOneAndReplace: 3,
    findOneAndUpdate: 3,
    aggregate: 2,
    watch: 2,
    initializeUnorderedBulkOp: 1,
    initializeOrderedBulkOp: 1,
    count: 2,
    dbName: null,
    collectionName: null,
    namespace: null,
    readConcern: null,
    readPreference: null,
    bsonOptions: null,
    writeConcern: null,
    hint: null,
  } as const;

  private appendSessionToOptions(args: any[], method: keyof MethodsOptionsArgPosition) {
    const optionsPosition = MongoDataSource.scopedMethods[method]! - 1;
    const minArgumentsLength = optionsPosition;
    const missingArgumentsLength = minArgumentsLength - args.length;

    const paddedArgs =
      missingArgumentsLength > 0
        ? args.concat(Array(missingArgumentsLength).fill(undefined))
        : args;

    paddedArgs[optionsPosition] = {
      ...paddedArgs[optionsPosition],
      session: this.transactionManager.getSession(),
    };

    return paddedArgs;
  }

  private updateLogsWrapper(originalMethod): { [method in keyof Collection]: Collection[method] } {
    const self = this;
    return {
      insertMany() {
        return originalMethod().then(async (result: InsertManyResult<CollectionSchema>) =>
          self.insertSyncLogs(Object.values(result.insertedIds)).then(() => result)
        );
      },
      insertOne() {
        return originalMethod().then(async (result: InsertOneResult<CollectionSchema>) =>
          self.insertSyncLogs([result.insertedId]).then(() => result)
        );
      },
      updateOne(filter) {
        return originalMethod().then(async (result: any) =>
          self.upsertSyncLogs([filter]).then(() => result)
        );
      },
      updateMany(filter) {
        return originalMethod().then(async (result: any) =>
          self.upsertSyncLogs([filter]).then(() => result)
        );
      },
      replaceOne(filter) {
        return originalMethod().then(async (result: any) =>
          self.upsertSyncLogs([filter]).then(() => result)
        );
      },
      findOneAndUpdate(filter) {
        return originalMethod().then(async (result: any) =>
          self.upsertSyncLogs([filter]).then(() => result)
        );
      },
      findOneAndReplace(filter) {
        return originalMethod().then(async (result: any) =>
          self.upsertSyncLogs([filter]).then(() => result)
        );
      },

      async findOneAndDelete(filter) {
        return self.upsertSyncLogs([filter], true).then(() => originalMethod());
      },

      async deleteOne(filter) {
        return self.upsertSyncLogs([filter], true).then(() => originalMethod());
      },

      async deleteMany(filter) {
        return self.upsertSyncLogs([filter], true).then(() => originalMethod());
      },

      async bulkWrite(operations) {
        const updateConditions = operations
          .map((op: any) => op.updateOne?.filter || op.updateMany?.filter)
          .filter((op: any) => op);

        const deleteConditions = operations
          .map((op: any) => op.deleteOne?.filter || op.deleteMany?.filter)
          .filter((op: any) => op);

        return self
          .upsertSyncLogs(deleteConditions, true)
          .then(() => originalMethod())
          .then(async (result: BulkWriteResult) => {
            await Promise.all([
              self.upsertSyncLogs(updateConditions),
              self.insertSyncLogs(
                Object.values(result.upsertedIds).concat(Object.values(result.insertedIds))
              ),
            ]);
            return result;
          });
      },
    };
  }

  private scopeCollectionToSession<T extends Document>(
    collection: Collection<T>,
    updatelogs = true
  ) {
    const self = this;
    return new Proxy<Collection<T>>(collection, {
      get(target, property, receiver) {
        const propertyName = <keyof Collection<T>>property;
        if (
          typeof property === 'string' &&
          Object.keys(MongoDataSource.scopedMethods).includes(property as keyof Collection) &&
          MongoDataSource.scopedMethods[property as keyof Collection] !== null
        ) {
          const original = Reflect.get(target, property, receiver);

          return function proxiedFunction(...args: any[]) {
            const originalMethod = () =>
              original.apply(receiver, self.appendSessionToOptions(args, propertyName));

            if (updatelogs) {
              if (
                property === 'insertMany' ||
                property === 'insertOne' ||
                property === 'updateOne' ||
                property === 'updateMany' ||
                property === 'replaceOne' ||
                property === 'findOneAndUpdate' ||
                property === 'findOneAndReplace' ||
                property === 'findOneAndDelete' ||
                property === 'deleteOne' ||
                property === 'deleteMany' ||
                property === 'bulkWrite'
              ) {
                return self.updateLogsWrapper(originalMethod)[property](args[0], args[1], args[2]);
              }
            }
            return originalMethod();
          };
        }

        return Reflect.get(target, property, receiver);
      },
    });
  }

  private async insertSyncLogs(mongoIds: ObjectId[]) {
    if (mongoIds.length !== 0) {
      await this.db.collection('updatelogs').insertMany(
        mongoIds.map(insertedId => ({
          timestamp: Date.now(),
          namespace: this.collectionName,
          mongoId: insertedId,
          deleted: false,
        })),
        { session: this.getSession() }
      );
    }
  }

  private async upsertSyncLogs(
    conditions: Filter<WithId<CollectionSchema>>[],
    deleted: boolean = false
  ) {
    if (conditions.length === 0) {
      return;
    }

    const modifiedDocuments = this.getCollection().find(
      { $or: conditions },
      { projection: { _id: 1 } }
    );

    const stream = new BulkWriteStream(
      this.scopeCollectionToSession<UpdateLog>(this.db.collection('updatelogs'), false)
    );

    await new MongoResultSet(modifiedDocuments, d => d).forEach(async ({ _id }) => {
      await stream.updateOne(
        { mongoId: _id },
        { $set: { timestamp: Date.now(), mongoId: _id, namespace: this.collectionName, deleted } },
        true
      );
    });
    await stream.flush();
  }

  protected getCollection() {
    if (!this.collectionProxy) {
      this.collectionProxy = this.scopeCollectionToSession<CollectionSchema>(
        this.db.collection(this.collectionName)
      );
    }
    return this.collectionProxy;
  }

  protected getSession() {
    return this.transactionManager.getSession();
  }

  protected createBulkStream() {
    return new BulkWriteStream(this.getCollection());
  }
}
