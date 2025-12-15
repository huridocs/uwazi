import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';

type Params = {
  thesaurusId: string;
} & UserAwareDispatchableParams;

type JobDependencies = {
  jobsDispatcher: JobsDispatcher;
};

class DenormalizeThesaurusEntitiesHandler extends UserAwareDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, _jobInfo: JobInfo) {}
}

export { DenormalizeThesaurusEntitiesHandler };
