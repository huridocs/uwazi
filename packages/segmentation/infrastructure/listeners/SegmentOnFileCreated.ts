import { FileCreatedEvent } from '#api/core/domain/files/events/FileCreatedEvent.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { RegisterFileSegmentation } from '../../application/RegisterFileSegmentation.js';

type Deps = {
  registerFileSegmentation: RegisterFileSegmentation;
};

/** Registers the segmentation of every file created. */
@PrivilegedJob()
class SegmentOnFileCreated extends Listener<FileCreatedEvent, Deps> {
  static eventName = FileCreatedEvent.name;

  async handle(_heartbeat: HeartbeatCallback, { file }: FileCreatedEvent['payload']) {
    await this.deps.registerFileSegmentation.execute({
      fileId: file._id,
      filename: file.filename,
      type: file.type,
      mimetype: file.mimetype,
    });
  }
}

EventEmitterFactory.registry.register(SegmentOnFileCreated);

export { SegmentOnFileCreated };
