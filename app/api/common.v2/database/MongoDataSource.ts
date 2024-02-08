import { Db, Document } from 'mongodb';
import { BulkWriteStream } from './BulkWriteStream';
import { MongoTransactionManager } from './MongoTransactionManager';
import { SessionScopedCollection } from './SessionScopedCollection';
import { SyncedCollection } from './SyncedCollection';

export abstract class MongoDataSource<CollectionSchema extends Document = any> {
  private db: Db;

  protected abstract collectionName: string;

  private transactionManager: MongoTransactionManager;

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    this.db = db;
    this.transactionManager = transactionManager;
  }

  protected getCollection(collectionName = this.collectionName) {
    return new SyncedCollection<CollectionSchema>(
      new SessionScopedCollection<CollectionSchema>(
        this.db.collection(collectionName),
        this.transactionManager
      ),
      this.transactionManager,
      this.db
    );
  }

  protected async collectionExists(): Promise<boolean> {
    const collections = await this.db.listCollections({ name: this.collectionName }).toArray();
    return collections.length > 0;
  }

  protected async dropCollection() {
    if (await this.collectionExists()) {
      await this.db.dropCollection(this.collectionName, { session: this.getSession() });
    }
  }

  protected async createCollection() {
    await this.db.createCollection(this.collectionName, { session: this.getSession() });
  }

  protected getSession() {
    return this.transactionManager.getSession();
  }

  protected createBulkStream() {
    return new BulkWriteStream(this.getCollection());
  }
}
