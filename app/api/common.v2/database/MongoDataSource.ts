import { Collection, Db, Document } from 'mongodb';
import { BulkWriteStream } from './BulkWriteStream';
import { MongoTransactionManager } from './MongoTransactionManager';

type SessionScopedCollection<Schema extends Document> = Omit<
  Collection<Schema>,
  Exclude<keyof Collection<Schema>, typeof MongoDataSource['sessionScopedMethods'][number]>
>;

export abstract class MongoDataSource<CollectionSchema extends Document = any> {
  protected db: Db;

  protected abstract collectionName: string;

  private transactionManager: MongoTransactionManager;

  private collectionProxy?: Collection<CollectionSchema>;

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    this.db = db;
    this.transactionManager = transactionManager;
  }

  static sessionScopedMethods = [
    'countDocuments',
    'aggregate',
    'insertOne',
    'insertMany',
    'find',
    'findOne',
    'deleteMany',
    'bulkWrite',
  ] as const;

  private appendSessionToOptions(args: any[]) {
    const optionsArgumentPosition = 1;
    const minArgumentsLength = optionsArgumentPosition + 1;
    const missingArguments = minArgumentsLength - args.length;

    const paddedArgs =
      missingArguments > 0 ? args.concat(Array(missingArguments).fill(undefined)) : args;

    paddedArgs[optionsArgumentPosition] = {
      ...paddedArgs[optionsArgumentPosition],
      session: this.transactionManager.getSession(),
    };

    return paddedArgs;
  }

  private scopeCollectionToTransaction(
    collection: Collection<CollectionSchema>
  ): SessionScopedCollection<CollectionSchema> {
    if (this.collectionProxy) {
      return this.collectionProxy;
    }

    const self = this;

    this.collectionProxy = new Proxy<Collection<CollectionSchema>>(collection, {
      get(target, property, receiver) {
        if (
          typeof property === 'string' &&
          MongoDataSource.sessionScopedMethods.includes(
            property as keyof SessionScopedCollection<CollectionSchema>
          )
        ) {
          const original = Reflect.get(target, property, receiver);

          if (typeof original === 'function') {
            return function proxiedFunction(...args: any[]) {
              return original.apply(receiver, self.appendSessionToOptions(args));
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
    return this.scopeCollectionToTransaction(this.db.collection(this.collectionName));
  }

  protected getSession() {
    return this.transactionManager.getSession();
  }

  protected createBulkStream() {
    return new BulkWriteStream(this.getCollection());
  }
}
