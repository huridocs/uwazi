import { SegmentationDirectory } from '../../application/contracts/SegmentationDirectory.js';
import {
  SegmentationReadModel,
  SegmentationStatusReadModel,
} from '../../application/contracts/SegmentationReadModels.js';
import { SegmentationStatus } from '../../domain/SegmentationStatus.js';
import { SegmentationReadModelMapper } from '../SegmentationReadModelMapper.js';
import { MongoSegmentationDAO } from './MongoSegmentationDAO.js';
import { MongoSegmentationDBO } from './MongoSegmentationDBO.js';
import { MongoSegmentationMapper } from './MongoSegmentationMapper.js';

class MongoSegmentationDirectory implements SegmentationDirectory {
  constructor(private readonly dao: MongoSegmentationDAO) {}

  async readyByFileIds(fileIds: string[]): Promise<SegmentationReadModel[]> {
    const ids = MongoSegmentationDAO.objectIds(fileIds);
    if (!ids.length) {
      return [];
    }
    return MongoSegmentationDirectory.readModels(
      await this.dao.find({ fileID: { $in: ids }, status: SegmentationStatus.READY })
    );
  }

  async readyByFilenames(filenames: string[]): Promise<SegmentationReadModel[]> {
    if (!filenames.length) {
      return [];
    }
    return MongoSegmentationDirectory.readModels(
      await this.dao.find({ filename: { $in: filenames }, status: SegmentationStatus.READY })
    );
  }

  async fileIdForXml(xmlFilename: string): Promise<string | undefined> {
    const found = await this.dao.findOne({ xmlname: xmlFilename });
    return found?.fileID.toHexString();
  }

  async readyFileIds(): Promise<string[]> {
    const found = await this.dao.find(
      { status: SegmentationStatus.READY },
      { projection: { fileID: 1 } }
    );
    return found.map(dbo => dbo.fileID.toHexString());
  }

  async statusesByFileIds(fileIds: string[]): Promise<SegmentationStatusReadModel[]> {
    const ids = MongoSegmentationDAO.objectIds(fileIds);
    if (!ids.length) {
      return [];
    }
    const found = await this.dao.find(
      { fileID: { $in: ids } },
      { projection: { fileID: 1, status: 1 } }
    );
    return found.map(dbo => ({
      fileId: dbo.fileID.toHexString(),
      status: dbo.status as SegmentationStatus,
    }));
  }

  private static readModels(found: MongoSegmentationDBO[]) {
    return found.map(dbo =>
      SegmentationReadModelMapper.toReadModel(MongoSegmentationMapper.toDomain(dbo))
    );
  }
}

export { MongoSegmentationDirectory };
