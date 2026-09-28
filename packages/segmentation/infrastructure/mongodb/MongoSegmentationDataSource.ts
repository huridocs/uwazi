import { SegmentationDataSource } from '../../application/contracts/SegmentationDataSource.js';
import { Segmentation } from '../../domain/Segmentation.js';
import { SegmentationStatus } from '../../domain/SegmentationStatus.js';
import { MongoSegmentationDAO } from './MongoSegmentationDAO.js';
import { MongoSegmentationDBO } from './MongoSegmentationDBO.js';
import { MongoSegmentationMapper } from './MongoSegmentationMapper.js';

class MongoSegmentationDataSource implements SegmentationDataSource {
  constructor(private readonly dao: MongoSegmentationDAO) {}

  async create(segmentation: Segmentation): Promise<boolean> {
    return this.dao.insertForFile(MongoSegmentationMapper.toDBO(segmentation));
  }

  async getById(id: string): Promise<Segmentation | undefined> {
    return this.findOneByIds('_id', id);
  }

  async getByFileId(fileId: string): Promise<Segmentation | undefined> {
    return this.findOneByIds('fileID', fileId);
  }

  async getByFilename(filename: string): Promise<Segmentation | undefined> {
    return MongoSegmentationDataSource.toDomain(await this.dao.findOne({ filename }));
  }

  async save(segmentation: Segmentation): Promise<void> {
    await this.dao.replaceExisting(MongoSegmentationMapper.toDBO(segmentation));
  }

  async nextIdleBatch(limit: number, afterId?: string): Promise<Segmentation[]> {
    const [after] = afterId ? MongoSegmentationDAO.objectIds([afterId]) : [];
    const found = await this.dao.find(
      { status: SegmentationStatus.IDLE, ...(after && { _id: { $gt: after } }) },
      { sort: { _id: 1 }, limit }
    );
    return found.map(MongoSegmentationMapper.toDomain);
  }

  async staleProcessing(requestedBefore: number, limit: number): Promise<Segmentation[]> {
    const found = await this.dao.find(
      { status: SegmentationStatus.PROCESSING, requestedAt: { $lt: requestedBefore } },
      { limit }
    );
    return found.map(MongoSegmentationMapper.toDomain);
  }

  async deleteByFileIds(fileIds: string[]): Promise<Segmentation[]> {
    const ids = MongoSegmentationDAO.objectIds(fileIds);
    if (!ids.length) {
      return [];
    }
    const deleted = await this.dao.deleteMany({ fileID: { $in: ids } });
    return deleted.map(MongoSegmentationMapper.toDomain);
  }

  private async findOneByIds(field: '_id' | 'fileID', id: string) {
    const [objectId] = MongoSegmentationDAO.objectIds([id]);
    if (!objectId) {
      return undefined;
    }
    return MongoSegmentationDataSource.toDomain(await this.dao.findOne({ [field]: objectId }));
  }

  private static toDomain(dbo: MongoSegmentationDBO | null) {
    return dbo ? MongoSegmentationMapper.toDomain(dbo) : undefined;
  }
}

export { MongoSegmentationDataSource };
