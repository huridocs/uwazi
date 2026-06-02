import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';

import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { V1CompatTenantDispatchable } from '#api/core/libs/queue/application/contracts/V1CompatTenantDispatchable.js';

type Params = { filePath: string };

type JobDependencies = { fileStorage: FileStorage };

export class DeleteFileFromStorageJobHandler extends V1CompatTenantDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  async handle(_heartbeat: HeartbeatCallback, params: Params) {
    await this.deps.fileStorage.removeContent(params.filePath);
  }
}
