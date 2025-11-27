import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import { V1CompatTenantDispatchable } from 'api/core/libs/queue/application/contracts/V1CompatTenantDispatchable';
import { BatchDeleteEntityUseCaseFactory } from '../factories/BatchDeleteEntityUseCaseFactory';

type Params = {
  sharedIds: string[];
};

type JobDependencies = {
  BatchDeleteEntityUseCaseFactory: typeof BatchDeleteEntityUseCaseFactory;
};

class BatchDeleteEntityJob extends V1CompatTenantDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params, _jobInfo: JobInfo) {
    const useCase = this.deps.BatchDeleteEntityUseCaseFactory.default();

    await useCase.execute({ sharedIds: params.sharedIds });
  }
}

export { BatchDeleteEntityJob };
