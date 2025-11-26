import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import { V1CompatTenantDispatchable } from 'api/core/libs/queue/application/contracts/V1CompatTenantDispatchable';

type Params = {
  sharedIds: string[];
};

type JobDependencies = {};

class BatchDeleteEntityJob extends V1CompatTenantDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params, _jobInfo: JobInfo) {}
}

export { BatchDeleteEntityJob };
