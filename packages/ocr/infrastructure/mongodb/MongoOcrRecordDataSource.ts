import { OcrRecordDataSource } from '../../application/contracts/OcrRecordDataSource.js';
import { OcrRecord } from '../../domain/OcrRecord.js';
import { MongoOcrRecordDAO } from './MongoOcrRecordDAO.js';
import { MongoOcrRecordDBO } from './MongoOcrRecordDBO.js';
import { MongoOcrRecordMapper } from './MongoOcrRecordMapper.js';

class MongoOcrRecordDataSource implements OcrRecordDataSource {
  constructor(private readonly deps: { dao: MongoOcrRecordDAO }) {}

  async create(record: OcrRecord): Promise<boolean> {
    return this.deps.dao.insertForSource(MongoOcrRecordMapper.toDBO(record));
  }

  async getById(id: string): Promise<OcrRecord | undefined> {
    return this.findOneByIds('_id', id);
  }

  async getBySourceFileId(fileId: string): Promise<OcrRecord | undefined> {
    return this.findOneByIds('sourceFile', fileId);
  }

  async getByFilename(filename: string): Promise<OcrRecord | undefined> {
    return MongoOcrRecordDataSource.toDomain(
      await this.deps.dao.findOne({ filename, sourceFile: { $ne: null } })
    );
  }

  async save(record: OcrRecord): Promise<void> {
    await this.deps.dao.replaceExisting(MongoOcrRecordMapper.toDBO(record));
  }

  async getForFiles(fileIds: string[]): Promise<OcrRecord[]> {
    const ids = MongoOcrRecordDAO.objectIds(fileIds);
    if (!ids.length) {
      return [];
    }
    const found = await this.deps.dao.find({
      $or: [{ sourceFile: { $in: ids } }, { resultFile: { $in: ids } }],
    });
    return found.map(MongoOcrRecordMapper.toDomain);
  }

  async delete(recordIds: string[]): Promise<void> {
    const ids = MongoOcrRecordDAO.objectIds(recordIds);
    if (ids.length) {
      await this.deps.dao.deleteMany({ _id: { $in: ids } });
    }
  }

  private async findOneByIds(field: '_id' | 'sourceFile', id: string) {
    const [objectId] = MongoOcrRecordDAO.objectIds([id]);
    if (!objectId) {
      return undefined;
    }
    return MongoOcrRecordDataSource.toDomain(await this.deps.dao.findOne({ [field]: objectId }));
  }

  private static toDomain(dbo: MongoOcrRecordDBO | null) {
    return dbo ? MongoOcrRecordMapper.toDomain(dbo) : undefined;
  }
}

export { MongoOcrRecordDataSource };
