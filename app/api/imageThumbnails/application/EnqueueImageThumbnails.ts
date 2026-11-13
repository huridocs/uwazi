import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { config } from '#api/config.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { ImageThumbnailJobs } from './contracts/ImageThumbnailJobs.js';
import {
  imageNeedsThumbnail,
  imageThumbnailLocation,
  imageThumbnailSkipLocation,
} from '../domain/imageThumbnail.js';

type Deps = {
  fileStorage: FileStorage;
  jobs: ImageThumbnailJobs;
};

class EnqueueImageThumbnails {
  constructor(private deps: Deps) {}

  async execute(filenames: string[]): Promise<void> {
    if (!config.imageThumbnails) {
      return;
    }

    const pending = [...new Set(filenames.filter(imageNeedsThumbnail))];

    await ArrayUtils.sequentialFor(pending, async filename => {
      if (await this.deps.fileStorage.fileExists(imageThumbnailLocation(filename))) {
        return;
      }
      if (await this.deps.fileStorage.fileExists(imageThumbnailSkipLocation(filename))) {
        return;
      }
      if ((await this.deps.jobs.countActive(filename)) > 0) {
        return;
      }
      await this.deps.jobs.create(filename);
    });
  }
}

export { EnqueueImageThumbnails };
