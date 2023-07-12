import { Collection, Db, Document } from 'mongodb';
import { BulkWriteStream } from './BulkWriteStream';
import { MongoTransactionManager } from './MongoTransactionManager';

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

  private scopeCollectionToSession(collection: Collection<CollectionSchema>) {
    if (this.collectionProxy) {
      return this.collectionProxy;
    }

    const self = this;

    this.collectionProxy = new Proxy<Collection<CollectionSchema>>(collection, {
      get(target, property, receiver) {
        const propertyName = <keyof Collection<CollectionSchema>>property;
        if (
          typeof property === 'string' &&
          Object.keys(MongoDataSource.scopedMethods).includes(property as keyof Collection) &&
          MongoDataSource.scopedMethods[property as keyof Collection] !== null
        ) {
          const original = Reflect.get(target, property, receiver);

          return function proxiedFunction(...args: any[]) {
            if (property === 'insertMany') {
              const originalFunction = self.getCollection()[property];
              type ResultType = ReturnType<typeof originalFunction>;
              const result: ResultType = original.apply(
                receiver,
                self.appendSessionToOptions(args, propertyName)
              );

              return result.then(async insertManyResult => {
                return self.db
                  .collection('updatelogs')
                  .insertMany(
                    Object.values(insertManyResult.insertedIds).map(insertedId => ({
                      timestamp: Date.now(),
                      namespace: self.collectionName,
                      mongoId: insertedId,
                      deleted: false,
                    })),
                    { session: self.getSession() }
                  )
                  .then(() => insertManyResult);
              });
            }

            if (property === 'insertOne') {
              const originalFunction = self.getCollection()[property];
              type ResultType = ReturnType<typeof originalFunction>;
              const result: ResultType = original.apply(
                receiver,
                self.appendSessionToOptions(args, propertyName)
              );
              return result.then(async insertOneResult =>
                self.db
                  .collection('updatelogs')
                  .insertOne(
                    {
                      timestamp: Date.now(),
                      namespace: self.collectionName,
                      mongoId: insertOneResult.insertedId,
                      deleted: false,
                    },
                    { session: self.getSession() }
                  )
                  .then(() => insertOneResult)
              );
            }
            if (property === 'replaceOne') {
              const originalFunction = self.getCollection()[property];
              type ResultType = ReturnType<typeof originalFunction>;
              const result: ResultType = original.apply(
                receiver,
                self.appendSessionToOptions(args, propertyName)
              );
              const condition = args[0];
              return result.then(async updateOneResult => {
                if (updateOneResult.modifiedCount) {
                  return self
                    .getCollection()
                    .find(condition)
                    .toArray()
                    .then(updatedDocuments => {
                      if (updatedDocuments) {
                        return self.db.collection('updatelogs').updateMany(
                          {
                            mongoId: { $in: updatedDocuments.map(u => u._id) },
                          },
                          {
                            $set: {
                              timestamp: Date.now(),
                            },
                          },
                          { session: self.getSession() }
                        );
                      }
                    })
                    .then(() => updateOneResult);
                }
              });
            }
            if (property === 'updateOne') {
              const originalFunction = self.getCollection()[property];
              type ResultType = ReturnType<typeof originalFunction>;
              const result: ResultType = original.apply(
                receiver,
                self.appendSessionToOptions(args, propertyName)
              );
              const condition = args[0];
              return result.then(async updateOneResult => {
                if (updateOneResult.modifiedCount) {
                  return self
                    .getCollection()
                    .find(condition)
                    .toArray()
                    .then(updatedDocuments => {
                      if (updatedDocuments) {
                        return self.db.collection('updatelogs').updateMany(
                          {
                            mongoId: { $in: updatedDocuments.map(u => u._id) },
                          },
                          {
                            $set: {
                              timestamp: Date.now(),
                            },
                          },
                          { session: self.getSession() }
                        );
                      }
                    })
                    .then(() => updateOneResult);
                }
              });
            }
            if (property === 'findOneAndReplace') {
              const originalFunction = self.getCollection()[property];
              type ResultType = ReturnType<typeof originalFunction>;
              const result: ResultType = original.apply(
                receiver,
                self.appendSessionToOptions(args, propertyName)
              );
              const condition = args[0];
              return result.then(async updateOneResult => {
                if (updateOneResult.ok) {
                  return self
                    .getCollection()
                    .find(condition)
                    .toArray()
                    .then(updatedDocuments => {
                      if (updatedDocuments) {
                        return self.db.collection('updatelogs').updateMany(
                          {
                            mongoId: { $in: updatedDocuments.map(u => u._id) },
                          },
                          {
                            $set: {
                              timestamp: Date.now(),
                            },
                          },
                          { session: self.getSession() }
                        );
                      }
                    })
                    .then(() => updateOneResult);
                }
              });
            }
            if (property === 'findOneAndUpdate') {
              const originalFunction = self.getCollection()[property];
              type ResultType = ReturnType<typeof originalFunction>;
              const result: ResultType = original.apply(
                receiver,
                self.appendSessionToOptions(args, propertyName)
              );
              const condition = args[0];
              return result.then(async updateOneResult => {
                if (updateOneResult.ok) {
                  return self
                    .getCollection()
                    .find(condition)
                    .toArray()
                    .then(updatedDocuments => {
                      if (updatedDocuments) {
                        return self.db.collection('updatelogs').updateMany(
                          {
                            mongoId: { $in: updatedDocuments.map(u => u._id) },
                          },
                          {
                            $set: {
                              timestamp: Date.now(),
                            },
                          },
                          { session: self.getSession() }
                        );
                      }
                    })
                    .then(() => updateOneResult);
                }
              });
            }
            if (property === 'updateMany') {
              const originalFunction = self.getCollection()[property];
              type ResultType = ReturnType<typeof originalFunction>;
              const result: ResultType = original.apply(
                receiver,
                self.appendSessionToOptions(args, propertyName)
              );
              const condition = args[0];
              return result.then(async updateOneResult => {
                if (updateOneResult.modifiedCount) {
                  return self
                    .getCollection()
                    .find(condition)
                    .toArray()
                    .then(updatedDocuments => {
                      if (updatedDocuments) {
                        return self.db.collection('updatelogs').updateMany(
                          {
                            mongoId: { $in: updatedDocuments.map(u => u._id) },
                          },
                          {
                            $set: {
                              timestamp: Date.now(),
                            },
                          },
                          { session: self.getSession() }
                        );
                      }
                    })
                    .then(() => updateOneResult);
                }
              });
            }
            if (property === 'deleteOne') {
              const condition = args[0];
              return self
                .getCollection()
                .find(condition)
                .toArray()
                .then(documentsToBeDeleted => {
                  if (documentsToBeDeleted) {
                    return self.db
                      .collection('updatelogs')
                      .updateMany(
                        { mongoId: { $in: documentsToBeDeleted.map(u => u._id) } },
                        { $set: { timestamp: Date.now(), deleted: true } },
                        { session: self.getSession() }
                      );
                  }
                })
                .then(() =>
                  original.apply(receiver, self.appendSessionToOptions(args, propertyName))
                );
            }
            if (property === 'findOneAndDelete') {
              const condition = args[0];
              return self
                .getCollection()
                .find(condition)
                .toArray()
                .then(documentsToBeDeleted => {
                  if (documentsToBeDeleted) {
                    return self.db
                      .collection('updatelogs')
                      .updateMany(
                        { mongoId: { $in: documentsToBeDeleted.map(u => u._id) } },
                        { $set: { timestamp: Date.now(), deleted: true } },
                        { session: self.getSession() }
                      );
                  }
                })
                .then(() =>
                  original.apply(receiver, self.appendSessionToOptions(args, propertyName))
                );
            }
            if (property === 'deleteMany') {
              const condition = args[0];
              return self
                .getCollection()
                .find(condition)
                .toArray()
                .then(documentsToBeDeleted => {
                  if (documentsToBeDeleted) {
                    return self.db
                      .collection('updatelogs')
                      .updateMany(
                        { mongoId: { $in: documentsToBeDeleted.map(u => u._id) } },
                        { $set: { timestamp: Date.now(), deleted: true } },
                        { session: self.getSession() }
                      );
                  }
                })
                .then(() =>
                  original.apply(receiver, self.appendSessionToOptions(args, propertyName))
                );
            }
            if (property === 'bulkWrite') {
              const originalFunction = self.getCollection()[property];
              type ResultType = ReturnType<typeof originalFunction>;
              const result: ResultType = original.apply(
                receiver,
                self.appendSessionToOptions(args, propertyName)
              );

              // return self
              //   .getCollection()
              //   .find({
              //     $or: [
              //       args[0]
              //         .filter(arg => {
              //           return arg.deleteOne || arg.deleteMany;
              //         })
              //         .map(arg => {
              //           return arg.deleteOne?.filter || arg.deleteMany.filter;
              //         }),
              //     ],
              //   })
              //   .toArray()
              //   .then(documentsToBeDeleted => {
              //     if (documentsToBeDeleted) {
              //       return self.db
              //         .collection('updatelogs')
              //         .updateMany(
              //           { mongoId: { $in: documentsToBeDeleted.map(u => u._id) } },
              //           { $set: { timestamp: Date.now(), deleted: true } },
              //           { session: self.getSession() }
              //         );
              //     }
              //     return original.apply(receiver, self.appendSessionToOptions(args, propertyName));
              //   });

              return result.then(async bulkWriteResult => {
                return Promise.resolve()
                  .then(() => {
                    if (Object.values(bulkWriteResult.insertedIds).length) {
                      return self.db.collection('updatelogs').insertMany(
                        Object.values(bulkWriteResult.insertedIds).map(insertedId => ({
                          timestamp: Date.now(),
                          namespace: self.collectionName,
                          mongoId: insertedId,
                          deleted: false,
                        })),
                        { session: self.getSession() }
                      );
                    }
                  })
                  .then(() => {
                    if (bulkWriteResult) {
                    }
                  })
                  .then(() => bulkWriteResult);
              });
            }
            return original.apply(receiver, self.appendSessionToOptions(args, propertyName));
          };
        }

        return Reflect.get(target, property, receiver);
      },
    });

    return this.collectionProxy;
  }

  protected getCollection() {
    return this.scopeCollectionToSession(this.db.collection(this.collectionName));
  }

  protected getSession() {
    return this.transactionManager.getSession();
  }

  protected createBulkStream() {
    return new BulkWriteStream(this.getCollection());
  }
}
