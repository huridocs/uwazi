import { Db, Document, ObjectId } from 'mongodb';
import { BulkWriteStream } from './BulkWriteStream';
import { MongoTransactionManager } from './MongoTransactionManager';
import { SessionScopedCollection } from './SessionScopedCollection';
import { SyncedScopedCollection } from './SyncedScopedCollection';

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

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    this.db = db;
    this.transactionManager = transactionManager;
  }

  protected getCollection() {
    return new SyncedScopedCollection<CollectionSchema>(
      new SessionScopedCollection<CollectionSchema>(
        this.db.collection(this.collectionName),
        this.transactionManager
      ),
      this.transactionManager,
      this.db
    );
  }

  protected getSession() {
    return this.transactionManager.getSession();
  }

  protected createBulkStream() {
    return new BulkWriteStream(this.getCollection());
  }
}
