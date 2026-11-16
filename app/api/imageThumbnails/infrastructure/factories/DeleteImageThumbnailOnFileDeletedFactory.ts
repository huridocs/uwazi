import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ImageThumbnailJobsAdapter } from '../jobs/ImageThumbnailJobsAdapter.js';
import { DeleteImageThumbnailOnFileDeleted } from '../listeners/DeleteImageThumbnailOnFileDeleted.js';

class DeleteImageThumbnailOnFileDeletedFactory {
  static default() {
    return new DeleteImageThumbnailOnFileDeleted({
      jobs: new ImageThumbnailJobsAdapter(ExecutionContext.jobsDispatcher),
      pathManager: new PathManager({ tenant: ExecutionContext.tenant }),
    });
  }
}

export { DeleteImageThumbnailOnFileDeletedFactory };
