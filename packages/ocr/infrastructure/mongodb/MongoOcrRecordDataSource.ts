import { Db, Filter, ObjectId } from 'mongodb';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { OcrRecordDataSource } from '../../application/contracts/OcrRecordDataSource.js';
import { OcrRecord } from '../../domain/OcrRecord.js';
import { MongoOcrRecordDBO } from './MongoOcrRecordDBO.js';
import { MongoOcrRecordMapper } from './MongoOcrRecordMapper.js';

/**
 * The `ocr_records` collection. Records are never synced to other instances, so writes skip the
 * sync log.
 */
class MongoOcrRecordDataSource
  extends MongoDataSource<MongoOcrRecordDBO>
  implements OcrRecordDataSource
{
  protected collectionName = 'ocr_records';

  constructor(db: Db, transactionManager: TransactionManager) {
    super(db, transactionManager, { useSyncedCollection: false });
  }

  /** Relies on the unique source file index to keep one record per file however many race. */
  async create(record: OcrRecord): Promise<boolean> {
    const dbo = MongoOcrRecordMapper.toDBO(record);
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

  async getById(id: string): Promise<OcrRecord | undefined> {
    return this.findOneByIds('_id', id);
  }

  async getBySourceFileId(fileId: string): Promise<OcrRecord | undefined> {
    return this.findOneByIds('sourceFile', fileId);
  }

  async getByFilename(filename: string): Promise<OcrRecord | undefined> {
    return this.findOne({ filename, sourceFile: { $ne: null } });
  }

  /** Replaces a stored document's fields; a document no longer there is not recreated. */
  async save(record: OcrRecord): Promise<void> {
    const { _id, ...fields } = MongoOcrRecordMapper.toDBO(record);
    await this.getCollection().replaceOne({ _id }, fields);
  }

  async getForFiles(fileIds: string[]): Promise<OcrRecord[]> {
    const ids = MongoOcrRecordDataSource.objectIds(fileIds);
    if (!ids.length) {
      return [];
    }
    const found = await this.getCollection()
      .find({ $or: [{ sourceFile: { $in: ids } }, { resultFile: { $in: ids } }] })
      .toArray();
    return found.map(MongoOcrRecordMapper.toDomain);
  }

  async delete(recordIds: string[]): Promise<void> {
    const ids = MongoOcrRecordDataSource.objectIds(recordIds);
    if (ids.length) {
      await this.getCollection().deleteMany({ _id: { $in: ids } });
    }
  }

  private async findOneByIds(field: '_id' | 'sourceFile', id: string) {
    const [objectId] = MongoOcrRecordDataSource.objectIds([id]);
    if (!objectId) {
      return undefined;
    }
    return this.findOne({ [field]: objectId });
  }

  private async findOne(filter: Filter<MongoOcrRecordDBO>) {
    const dbo = await this.getCollection().findOne(filter);
    return dbo ? MongoOcrRecordMapper.toDomain(dbo) : undefined;
  }

  private static objectIds(ids: string[]): ObjectId[] {
    return ids.filter(id => ObjectId.isValid(id) && id.length === 24).map(id => new ObjectId(id));
  }
}

export { MongoOcrRecordDataSource };
