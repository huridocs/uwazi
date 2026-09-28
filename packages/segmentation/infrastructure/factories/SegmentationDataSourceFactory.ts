import { SegmentationDataSource } from '../../application/contracts/SegmentationDataSource.js';
import { MongoSegmentationDataSource } from '../mongodb/MongoSegmentationDataSource.js';
import { PostgresSegmentationDataSource } from '../postgresql/PostgresSegmentationDataSource.js';
import { SegmentationDAOFactory } from './SegmentationDAOFactory.js';

class SegmentationDataSourceFactory {
  static default(): SegmentationDataSource {
    const selected = SegmentationDAOFactory.default();

    return selected.backend === 'postgres'
      ? new PostgresSegmentationDataSource({ dao: selected.dao })
      : new MongoSegmentationDataSource({ dao: selected.dao });
  }
}

export { SegmentationDataSourceFactory };
