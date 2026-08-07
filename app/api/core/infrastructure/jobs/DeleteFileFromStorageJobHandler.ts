import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';

import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

type Params = UwaziJobParams & { filePath: string };

type JobDependencies = { fileStorage: FileStorage };

@PrivilegedJob()
export class DeleteFileFromStorageJobHandler extends UwaziJobHandler<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  async handle(_heartbeat: HeartbeatCallback, params: Params) {
    await this.deps.fileStorage.removeContent(params.filePath);
  }
}
