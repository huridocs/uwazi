import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { BulkCleanupEntityUseCaseFactory } from '../factories/BulkCleanupEntityUseCaseFactory.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

type Params = UwaziJobParams & {
  sharedIds: string[];
};

type JobDependencies = {
  BulkCleanupEntityUseCaseFactory: typeof BulkCleanupEntityUseCaseFactory;
};

@PrivilegedJob()
class BulkCleanupEntityJob extends UwaziJobHandler<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params, _jobInfo: JobInfo) {
    const useCase = this.deps.BulkCleanupEntityUseCaseFactory.default();

    await useCase.execute({ sharedIds: params.sharedIds });
  }
}

export { BulkCleanupEntityJob };
