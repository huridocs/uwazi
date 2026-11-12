import { EnqueueImageThumbnails } from '../../application/EnqueueImageThumbnails.js';
import { FileCreatedEvent } from '#api/core/domain/files/events/FileCreatedEvent.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';

type Deps = {
  enqueueImageThumbnails: EnqueueImageThumbnails;
};

@PrivilegedJob()
class EnqueueImageThumbnailOnFileCreated extends Listener<FileCreatedEvent, Deps> {
  static eventName = FileCreatedEvent.name;

  async handle(_heartbeat: HeartbeatCallback, { file }: FileCreatedEvent['payload']) {
    if (file.type === 'thumbnail' || ('url' in file && file.url)) {
      return;
    }
    await this.deps.enqueueImageThumbnails.execute([file.filename]);
  }
}

export { EnqueueImageThumbnailOnFileCreated };
