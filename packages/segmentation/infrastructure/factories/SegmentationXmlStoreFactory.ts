import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SegmentationXmlStore } from '../../application/contracts/SegmentationXmlStore.js';
import { FileStorageSegmentationXmlStore } from '../files/FileStorageSegmentationXmlStore.js';

class SegmentationXmlStoreFactory {
  static default(): SegmentationXmlStore {
    return new FileStorageSegmentationXmlStore(
      FileStorageFactory.default(),
      new PathManager({ tenant: ExecutionContext.currentTenant })
    );
  }
}

export { SegmentationXmlStoreFactory };
