import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EnqueueImageThumbnails } from '../../application/EnqueueImageThumbnails.js';
import { ImageThumbnailJobsAdapter } from '../jobs/ImageThumbnailJobsAdapter.js';
import { EnqueueImageThumbnailOnFileCreated } from '../listeners/EnqueueImageThumbnailOnFileCreated.js';

class EnqueueImageThumbnailOnFileCreatedFactory {
  static default() {
    const fileStorage = FileStorageFactory.default();
    return new EnqueueImageThumbnailOnFileCreated({
      enqueueImageThumbnails: new EnqueueImageThumbnails({
        fileStorage,
        jobs: new ImageThumbnailJobsAdapter(ExecutionContext.jobsDispatcher),
      }),
    });
  }
}

export { EnqueueImageThumbnailOnFileCreatedFactory };
