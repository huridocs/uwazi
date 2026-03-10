import { Db, Document } from 'mongodb';
import { DocumentTracker } from 'api/core/infrastructure/mongodb/documentTracker/DocumentTracker';
import { BulkWriteStream } from './BulkWriteStream';
import { MongoTransactionManager } from './MongoTransactionManager';
import { SessionScopedCollection } from './SessionScopedCollection';
import { SyncedCollection } from './SyncedCollection';

export interface MongoDSOptions {
  useSyncedCollection?: boolean;
}

export abstract class MongoDataSource<TSchema extends Document = Document> {
  protected documentTracker: DocumentTracker;

  private db: Db;

  protected abstract collectionName: string;

  transactionManager: MongoTransactionManager;

  private useSyncedCollection: boolean;

  constructor(db: Db, transactionManager: MongoTransactionManager, options: MongoDSOptions = {}) {
    this.db = db;
    this.transactionManager = transactionManager;
    this.useSyncedCollection =
      options.useSyncedCollection !== undefined ? options.useSyncedCollection : true;
    this.documentTracker = new DocumentTracker();
  }

  protected getCollection<Collection extends Document = TSchema>(
    collectionName = this.collectionName
  ) {
    return this.useSyncedCollection
      ? new SyncedCollection<Collection>(
          new SessionScopedCollection<Collection>(
            this.db.collection<Collection>(collectionName),
            this.transactionManager
          ),
          this.transactionManager,
          this.db
        )
      : new SessionScopedCollection<Collection>(
          this.db.collection<Collection>(collectionName),
          this.transactionManager
        );
  }

  protected async collectionExists(): Promise<boolean> {
    const collections = await this.db.listCollections({ name: this.collectionName }).toArray();
    return collections.length > 0;
  }

  protected async dropCollection() {
    await this.db.dropCollection(this.collectionName, { session: this.getSession() });
  }

  protected async createCollection() {
    await this.db.createCollection(this.collectionName, { session: this.getSession() });
  }

  protected getSession() {
    return this.transactionManager.getSession();
  }

  protected createBulkStream() {
    return new BulkWriteStream<TSchema>(this.getCollection());
  }
}
