import { FileDeletedEvent } from '#api/core/domain/files/events/FileDeletedEvent.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DeleteFileSegmentations } from '../../application/DeleteFileSegmentations.js';

type Deps = {
  deleteFileSegmentations: DeleteFileSegmentations;
};

/** Removes the segmentation of a deleted file. */
@PrivilegedJob()
class DeleteSegmentationsOnFileDeleted extends Listener<FileDeletedEvent, Deps> {
  static eventName = FileDeletedEvent.name;

  async handle(_heartbeat: HeartbeatCallback, { fileId }: FileDeletedEvent['payload']) {
    await this.deps.deleteFileSegmentations.execute({ fileIds: [fileId] });
  }
}

export { DeleteSegmentationsOnFileDeleted };
