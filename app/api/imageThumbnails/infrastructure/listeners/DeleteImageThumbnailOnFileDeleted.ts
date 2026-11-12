import { ImageThumbnailJobs } from '../../application/contracts/ImageThumbnailJobs.js';
import {
  imageNeedsThumbnail,
  imageThumbnailLocation,
  imageThumbnailSkipLocation,
} from '../../domain/imageThumbnail.js';
import { FileDeletedEvent } from '#api/core/domain/files/events/FileDeletedEvent.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';

type Deps = {
  jobs: ImageThumbnailJobs;
  pathManager: PathManager;
};

@PrivilegedJob()
class DeleteImageThumbnailOnFileDeleted extends Listener<FileDeletedEvent, Deps> {
  static eventName = FileDeletedEvent.name;

  async handle(_heartbeat: HeartbeatCallback, { filename }: FileDeletedEvent['payload']) {
    if (!imageNeedsThumbnail(filename)) {
      return;
    }

    await this.deps.jobs.deleteStored([
      this.deps.pathManager.createPath(imageThumbnailLocation(filename)),
      this.deps.pathManager.createPath(imageThumbnailSkipLocation(filename)),
    ]);
  }
}

export { DeleteImageThumbnailOnFileDeleted };
