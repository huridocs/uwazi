import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { BulkDeleteEntityUseCaseFactory } from '../factories/BulkDeleteEntityUseCaseFactory';

type Params = UserAwareDispatchableParams & {
  sharedIds: string[];
};

type JobDependencies = {
  BulkDeleteEntityUseCaseFactory: typeof BulkDeleteEntityUseCaseFactory;
};

class BulkDeleteEntityJob extends UserAwareDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, _jobInfo: JobInfo) {
    const useCase = this.deps.BulkDeleteEntityUseCaseFactory.default();

    await useCase.execute({ sharedIds: this.params.sharedIds });
  }
}

export { BulkDeleteEntityJob };
