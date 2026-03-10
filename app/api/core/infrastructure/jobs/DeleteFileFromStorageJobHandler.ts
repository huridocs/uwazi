import { HeartbeatCallback } from 'api/core/libs/queue/application/contracts/Dispatchable';

import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { V1CompatTenantDispatchable } from 'api/core/libs/queue/application/contracts/V1CompatTenantDispatchable';

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
