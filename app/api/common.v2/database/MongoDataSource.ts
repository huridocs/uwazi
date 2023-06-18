import { Collection, Db, Document } from 'mongodb';
import { BulkWriteStream } from './BulkWriteStream';
import { MongoTransactionManager } from './MongoTransactionManager';

/**
 * Map of collection members to position of its options argument
 */
type MethodsOptionsArgPosition = {
  [method in keyof Partial<Collection>]: number;
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
    countDocuments: 1,
    aggregate: 1,
    insertOne: 1,
    insertMany: 1,
    find: 1,
    findOne: 1,
    deleteMany: 1,
    bulkWrite: 1,
  };

  private appendSessionToOptions(args: any[], position: number) {
    const minArgumentsLength = position + 1;
    const missingArguments = minArgumentsLength - args.length;

    const paddedArgs =
      missingArguments > 0 ? args.concat(Array(missingArguments).fill(undefined)) : args;

    paddedArgs[position] = {
      ...paddedArgs[position],
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
        if (
          typeof property === 'string' &&
          Object.keys(MongoDataSource.scopedMethods).includes(property as keyof Collection)
        ) {
          const original = Reflect.get(target, property, receiver);

          if (typeof original === 'function') {
            return function proxiedFunction(...args: any[]) {
              return original.apply(
                receiver,
                self.appendSessionToOptions(
                  args,
                  MongoDataSource.scopedMethods[property as keyof Collection]!
                )
              );
            };
          }

          throw new Error(`Member to scope is not a function: ${property}`);
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
