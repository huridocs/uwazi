import { Collection, Db, Document } from 'mongodb';
import { BulkWriteStream } from './BulkWriteStream';
import { MongoTransactionManager } from './MongoTransactionManager';

export abstract class MongoDataSource<CollectionSchema extends Document = any> {
  protected db: Db;

  protected abstract collectionName: string;

  private transactionManager: MongoTransactionManager;

  private collectionProxy?: Collection<CollectionSchema>;

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    this.db = db;
    this.transactionManager = transactionManager;
  }

  private appendSessionToLastArgument(args: unknown[], argumentsLength: number) {
    const missingArguments = argumentsLength - args.length;

    const paddedArgs =
      missingArguments > 0 ? args.concat(Array(missingArguments).fill(undefined)) : args;

    paddedArgs[argumentsLength - 1] = {
      ...(paddedArgs[argumentsLength - 1] ?? {}),
      session: this.transactionManager.getSession(),
    };

    return paddedArgs;
  }

  private scopeCollectionToTransaction(collection: Collection<CollectionSchema>) {
    if (this.collectionProxy) {
      return this.collectionProxy;
    }

    const self = this;
    this.collectionProxy = new Proxy<Collection<CollectionSchema>>(collection, {
      get(target, property, receiver) {
        const original = Reflect.get(target, property, receiver);

        if (typeof original === 'function') {
          return function proxiedFunction(...args: unknown[]) {
            return original.apply(
              receiver,
              self.appendSessionToLastArgument(args, original.length)
            );
          };
        }

        return original;
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
