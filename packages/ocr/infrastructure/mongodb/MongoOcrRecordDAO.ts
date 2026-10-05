import { Db, Filter, FindOptions, ObjectId } from 'mongodb';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoOcrRecordDBO } from './MongoOcrRecordDBO.js';

/**
 * The `ocr_records` collection. Records are never synced to other instances, so writes skip the
 * sync log.
 */
class MongoOcrRecordDAO extends MongoDataSource<MongoOcrRecordDBO> {
  protected collectionName = 'ocr_records';

  constructor(db: Db, transactionManager: TransactionManager) {
    super(db, transactionManager, { useSyncedCollection: false });
  }

  async findOne(filter: Filter<MongoOcrRecordDBO>) {
    return this.getCollection().findOne(filter);
  }

  async find(filter: Filter<MongoOcrRecordDBO>, options: FindOptions = {}) {
    return this.getCollection().find(filter, options).toArray();
  }

  /** Inserts the document unless its source file already has one; returns whether it did. */
  async insertForSource(dbo: MongoOcrRecordDBO): Promise<boolean> {
    await this.ensureUniqueSourceIndex();

    if (dbo.sourceFile === null) {
      await this.getCollection().insertOne(dbo);
      return true;
    }

    const result = await this.getCollection().updateOne(
      { sourceFile: dbo.sourceFile },
      { $setOnInsert: dbo },
      { upsert: true }
    );
    return result.upsertedCount === 1;
  }

  /** Replaces a stored document's fields; a document no longer there is not recreated. */
  async replaceExisting(dbo: MongoOcrRecordDBO): Promise<void> {
    const { _id, ...fields } = dbo;
    await this.getCollection().replaceOne({ _id }, fields);
  }

  async deleteMany(filter: Filter<MongoOcrRecordDBO>): Promise<void> {
    await this.getCollection().deleteMany(filter);
  }

  static objectIds(ids: string[]): ObjectId[] {
    return ids.filter(id => ObjectId.isValid(id) && id.length === 24).map(id => new ObjectId(id));
  }

  /**
   * One record per source file, however many requests race. Created outside the transaction
   * session: Mongo refuses to build an index of an existing collection inside one. Idempotent.
   */
  private async ensureUniqueSourceIndex() {
    await this.db
      .collection(this.collectionName)
      .createIndex(
        { sourceFile: 1 },
        { unique: true, partialFilterExpression: { sourceFile: { $type: 'objectId' } } }
      );
  }
}

export { MongoOcrRecordDAO };
