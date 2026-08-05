import { ObjectId } from 'mongodb';
import { SegmentationType } from '#shared/types/segmentationType.js';
import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { SegmentationDataSource } from '../../application/contracts/SegmentationDataSource.js';
import { Segmentation } from '../../domain/Segmentation.js';
import { SegmentationMapper } from './SegmentationMapper.js';

export type SegmentationDBO = SegmentationType & {
  _id: ObjectId;
  fileID: ObjectId;
};

export class MongoSegmentationDataSource
  extends MongoDataSource<SegmentationDBO>
  implements SegmentationDataSource
{
  protected collectionName = 'segmentations';

  getSegmentations(documentIds: string[]): ResultSet<Segmentation> {
    const cursor = this.getCollection().find({
      fileID: { $in: documentIds.map(id => new ObjectId(id)) },
      status: 'ready',
      segmentation: { $exists: true },
    });

    return new MongoResultSet(cursor, SegmentationMapper.toDomain);
  }
}

export type MongoSegmentationDataSourceOptions = MongoDSOptions;
