import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EnqueueImageThumbnails } from '../../application/EnqueueImageThumbnails.js';
import { ServeImageThumbnail } from '../../application/ServeImageThumbnail.js';
import { ImageThumbnailJobsAdapter } from '../jobs/ImageThumbnailJobsAdapter.js';

class ServeImageThumbnailFactory {
  static default(overrides: Partial<ConstructorParameters<typeof ServeImageThumbnail>[0]> = {}) {
    const fileStorage = overrides.fileStorage ?? FileStorageFactory.default();
    return new ServeImageThumbnail({
      transactionManager: ExecutionContext.transactionManager,
      filesDS: overrides.filesDS ?? FilesDataSourceFactory.default(),
      fileStorage,
      enqueueImageThumbnails:
        overrides.enqueueImageThumbnails ??
        new EnqueueImageThumbnails({
          fileStorage,
          jobs: new ImageThumbnailJobsAdapter(ExecutionContext.jobsDispatcher),
        }),
    });
  }
}

export { ServeImageThumbnailFactory };
