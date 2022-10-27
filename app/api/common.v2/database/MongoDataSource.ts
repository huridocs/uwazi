import { Db, Document } from 'mongodb';
import { MongoTransactionManager } from './MongoTransactionManager';

export abstract class MongoDataSource<CollectionSchema extends Document = any> {
  protected db: Db;

  protected abstract collectionName: string;

  private transactionManager: MongoTransactionManager;

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    this.db = db;
    this.transactionManager = transactionManager;
  }

  getCollection() {
    return this.db.collection<CollectionSchema>(this.collectionName);
  }

  protected getSession() {
    return this.transactionManager.getSession();
  }
}
