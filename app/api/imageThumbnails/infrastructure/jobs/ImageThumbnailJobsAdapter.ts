import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { DeleteFileFromStorageJobHandler } from '#api/core/infrastructure/jobs/DeleteFileFromStorageJobHandler.js';
import { ImageThumbnailJobs } from '../../application/contracts/ImageThumbnailJobs.js';
import { CreateImageThumbnailJobHandler } from './CreateImageThumbnailJobHandler.js';

class ImageThumbnailJobsAdapter implements ImageThumbnailJobs {
  constructor(private jobsDispatcher: JobsDispatcher) {}

  async create(filename: string): Promise<void> {
    await this.jobsDispatcher.dispatch(CreateImageThumbnailJobHandler, { filename });
  }

  async countActive(filename: string): Promise<number> {
    return this.jobsDispatcher.countActiveByParams(CreateImageThumbnailJobHandler, { filename });
  }

  async deleteStored(paths: string[]): Promise<void> {
    await this.jobsDispatcher.dispatchMany(dispatch => {
      paths.forEach(filePath => dispatch(DeleteFileFromStorageJobHandler, { filePath }));
    });
  }
}

export { ImageThumbnailJobsAdapter };
