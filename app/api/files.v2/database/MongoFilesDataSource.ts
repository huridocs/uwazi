import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { SegmentationType } from 'shared/types/segmentationType';
import { ObjectId } from 'mongodb';
import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { FilesDataSource } from '../contracts/FilesDataSource';
import { FileMappers } from './FilesMappers';
import { FileDBOType } from './schemas/filesTypes';
import { UwaziFile } from '../model/UwaziFile';
import { Segmentation } from '../model/Segmentation';
import { Document } from '../model/Document';
import { SegmentationMapper } from './SegmentationMapper';

export type SegmentationDBO = SegmentationType & {
  _id: ObjectId;
  fileID: ObjectId;
};

export class MongoFilesDataSource extends MongoDataSource<FileDBOType> implements FilesDataSource {
  protected collectionName = 'files';

  getSegmentations(filesId: string[]): ResultSet<Segmentation> {
    const cursor = this.getCollection<SegmentationDBO>('segmentations').find({
      fileID: { $in: filesId.map(id => new ObjectId(id)) },
      status: 'ready',
      segmentation: { $exists: true },
    });

    return new MongoResultSet(cursor, SegmentationMapper.toDomain);
  }

  getDocumentsForEntity(entitySharedId: string): ResultSet<Document> {
    return new MongoResultSet<FileDBOType, Document>(
      this.getCollection().find(
        { entity: entitySharedId, type: 'document' },
        { projection: { fullText: 0 } }
      ),
      FileMappers.toDocumentModel
    );
  }

  getAll() {
    return new MongoResultSet<FileDBOType, UwaziFile>(
      this.getCollection().find({}, { projection: { fullText: 0 } }),
      FileMappers.toModel
    );
  }

  async filesExistForEntities(files: { entity: string; _id: string }[]) {
    const query = {
      $or: files.map(file => ({ _id: new ObjectId(file._id), entity: file.entity })),
    };
    const foundFiles = await this.getCollection().countDocuments(query);
    return foundFiles === files.length;
  }
}
