import { DeleteSegmentationsOnFileDeleted } from '../listeners/DeleteSegmentationsOnFileDeleted.js';
import { DeleteFileSegmentationsFactory } from './DeleteFileSegmentationsFactory.js';

class DeleteSegmentationsOnFileDeletedFactory {
  static default(): DeleteSegmentationsOnFileDeleted {
    return new DeleteSegmentationsOnFileDeleted({
      deleteFileSegmentations: DeleteFileSegmentationsFactory.default(),
    });
  }
}

export { DeleteSegmentationsOnFileDeletedFactory };
