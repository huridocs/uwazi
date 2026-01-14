import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { BulkCleanupEntityUseCaseFactory } from '../factories/BulkCleanupEntityUseCaseFactory';

type Params = UserAwareDispatchableParams & {
  sharedIds: string[];
};

type JobDependencies = {
  BulkCleanupEntityUseCaseFactory: typeof BulkCleanupEntityUseCaseFactory;
};

class BulkCleanupEntityJob extends UserAwareDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, _jobInfo: JobInfo) {
    const useCase = this.deps.BulkCleanupEntityUseCaseFactory.default();

    await useCase.execute({ sharedIds: this.params.sharedIds });
  }
}

export { BulkCleanupEntityJob };
