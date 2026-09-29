import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DeleteFileSegmentations } from '../../application/DeleteFileSegmentations.js';
import { SegmentationDataSourceFactory } from './SegmentationDataSourceFactory.js';
import { SegmentationXmlStoreFactory } from './SegmentationXmlStoreFactory.js';

class DeleteFileSegmentationsFactory {
  static default(): DeleteFileSegmentations {
    return new DeleteFileSegmentations({
      segmentationDS: SegmentationDataSourceFactory.default(),
      xmlStore: SegmentationXmlStoreFactory.default(),
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { DeleteFileSegmentationsFactory };
