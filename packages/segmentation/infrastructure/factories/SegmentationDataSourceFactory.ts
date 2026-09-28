import { SegmentationDataSource } from '../../application/contracts/SegmentationDataSource.js';
import { MongoSegmentationDataSource } from '../mongodb/MongoSegmentationDataSource.js';
import { PostgresSegmentationDataSource } from '../postgresql/PostgresSegmentationDataSource.js';
import { SegmentationDAOFactory } from './SegmentationDAOFactory.js';

class SegmentationDataSourceFactory {
  static default(): SegmentationDataSource {
    const selected = SegmentationDAOFactory.default();

    return selected.backend === 'postgres'
      ? new PostgresSegmentationDataSource(selected.dao)
      : new MongoSegmentationDataSource(selected.dao);
  }
}

export { SegmentationDataSourceFactory };
