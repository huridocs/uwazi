import { Db, Filter, FindOptions, ObjectId } from 'mongodb';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoSegmentationDBO } from './MongoSegmentationDBO.js';

/**
 * The `segmentations` collection. Segmentations are never synced to other instances, so writes
 * skip the sync log.
 */
class MongoSegmentationDAO extends MongoDataSource<MongoSegmentationDBO> {
  protected collectionName = 'segmentations';

  constructor(db: Db, transactionManager: TransactionManager) {
    super(db, transactionManager, { useSyncedCollection: false });
  }

  async findOne(filter: Filter<MongoSegmentationDBO>) {
    return this.getCollection().findOne(filter);
  }

  async find(filter: Filter<MongoSegmentationDBO>, options: FindOptions = {}) {
    return this.getCollection().find(filter, options).toArray();
  }

  /** Inserts the document unless its file already has one; returns whether it did. */
  async insertForFile(dbo: MongoSegmentationDBO): Promise<boolean> {
    const result = await this.getCollection().updateOne(
      { fileID: dbo.fileID },
      { $setOnInsert: dbo },
      { upsert: true }
    );
    return result.upsertedCount === 1;
  }

  /** Replaces a stored document's fields; a document no longer there is not recreated. */
  async replaceExisting(dbo: MongoSegmentationDBO): Promise<void> {
    const { _id, ...fields } = dbo;
    await this.getCollection().replaceOne({ _id }, fields);
  }

  async deleteMany(filter: Filter<MongoSegmentationDBO>): Promise<MongoSegmentationDBO[]> {
    const found = await this.find(filter);
    if (found.length) {
      await this.getCollection().deleteMany({ _id: { $in: found.map(dbo => dbo._id) } });
    }
    return found;
  }

  static objectIds(ids: string[]): ObjectId[] {
    return ids.filter(id => ObjectId.isValid(id) && id.length === 24).map(id => new ObjectId(id));
  }
}

export { MongoSegmentationDAO };
