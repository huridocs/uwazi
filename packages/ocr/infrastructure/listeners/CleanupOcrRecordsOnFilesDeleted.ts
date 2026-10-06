import { FileDeletedEvent } from '#api/core/domain/files/events/FileDeletedEvent.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { CleanupOcrRecordsOfFiles } from '../../application/CleanupOcrRecordsOfFiles.js';

type Deps = {
  cleanupOcrRecordsOfFiles: CleanupOcrRecordsOfFiles;
};

/** Keeps the OCR record of a deleted file in line with it. */
@PrivilegedJob()
class CleanupOcrRecordsOnFilesDeleted extends Listener<FileDeletedEvent, Deps> {
  static eventName = FileDeletedEvent.name;

  async handle(_heartbeat: HeartbeatCallback, { fileId }: FileDeletedEvent['payload']) {
    await this.deps.cleanupOcrRecordsOfFiles.execute({ fileIds: [fileId] });
  }
}

export { CleanupOcrRecordsOnFilesDeleted };
