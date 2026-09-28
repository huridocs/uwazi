import { SegmentationDirectory } from '../../application/contracts/SegmentationDirectory.js';
import { MongoSegmentationDirectory } from '../mongodb/MongoSegmentationDirectory.js';
import { PostgresSegmentationDirectory } from '../postgresql/PostgresSegmentationDirectory.js';
import { SegmentationDAOFactory } from './SegmentationDAOFactory.js';

class SegmentationDirectoryFactory {
  /** Returns the contract: no caller may know which backend answered. */
  static default(): SegmentationDirectory {
    const selected = SegmentationDAOFactory.default();

    return selected.backend === 'postgres'
      ? new PostgresSegmentationDirectory(selected.dao)
      : new MongoSegmentationDirectory(selected.dao);
  }
}

export { SegmentationDirectoryFactory };
