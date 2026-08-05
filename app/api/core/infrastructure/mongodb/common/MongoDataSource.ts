import { Db, Document } from 'mongodb';
import { DocumentTracker } from '#api/core/infrastructure/mongodb/documentTracker/DocumentTracker.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { BulkWriteStream } from './BulkWriteStream.js';
import { MongoPermissionEnforcedCollection } from './MongoPermissionEnforcedCollection.js';
import { MongoTransactionManager } from './MongoTransactionManager.js';
import { SessionScopedCollection } from './SessionScopedCollection.js';
import { SyncedCollection } from './SyncedCollection.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

export interface MongoDSOptions {
  useSyncedCollection?: boolean;
  accessContext?: AccessContext;
}

export abstract class MongoDataSource<TSchema extends Document = Document> {
  protected documentTracker: DocumentTracker;

  protected db: Db;

  protected abstract collectionName: string;

  transactionManager: MongoTransactionManager;

  private useSyncedCollection: boolean;

  protected accessContext?: AccessContext;

  constructor(
    db: Db,
    transactionManager: MongoTransactionManager | TransactionManager,
    options: MongoDSOptions = {}
  ) {
    this.db = db;
    this.transactionManager = transactionManager as MongoTransactionManager;
    this.useSyncedCollection =
      options.useSyncedCollection !== undefined ? options.useSyncedCollection : true;
    this.accessContext = options.accessContext;
    this.documentTracker = new DocumentTracker();
  }

  protected getCollection<Collection extends Document = TSchema>(
    collectionName = this.collectionName
  ) {
    const raw = this.db.collection<Collection>(collectionName);
    const sessionScoped = new SessionScopedCollection<Collection>(raw, this.transactionManager);

    if (
      collectionName === this.collectionName &&
      this.accessContext
    ) {
      const permEnforced = MongoPermissionEnforcedCollection.for<Collection>({
        collection: sessionScoped,
        accessContext: this.accessContext,
      });

      return this.useSyncedCollection
        ? new SyncedCollection<Collection>(permEnforced, this.transactionManager, this.db)
        : permEnforced;
    }

    return this.useSyncedCollection
      ? new SyncedCollection<Collection>(sessionScoped, this.transactionManager, this.db)
      : sessionScoped;
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
