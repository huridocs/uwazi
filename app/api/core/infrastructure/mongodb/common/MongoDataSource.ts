import { Db, Document } from 'mongodb';
import { DocumentTracker } from '#api/core/infrastructure/mongodb/documentTracker/DocumentTracker.js';
import { BulkWriteStream } from './BulkWriteStream.js';
import { MongoTransactionManager } from './MongoTransactionManager.js';
import { SessionScopedCollection } from './SessionScopedCollection.js';
import { SyncedCollection } from './SyncedCollection.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

export interface MongoDSOptions {
  useSyncedCollection?: boolean;
}

export abstract class MongoDataSource<TSchema extends Document = Document> {
  protected documentTracker: DocumentTracker;

  private db: Db;

  protected abstract collectionName: string;

  transactionManager: MongoTransactionManager;

  private useSyncedCollection: boolean;

  constructor(
    db: Db,
    transactionManager: MongoTransactionManager | TransactionManager,
    options: MongoDSOptions = {}
  ) {
    this.db = db;
    this.transactionManager = transactionManager as MongoTransactionManager;
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
