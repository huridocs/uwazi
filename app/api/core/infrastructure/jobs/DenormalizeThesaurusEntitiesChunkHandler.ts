import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { DenormalizeThesaurusEntitiesUseCaseFactory } from '../factories/DenormalizeThesaurusEntitiesUseCaseFactory';

type Params = {
  sharedIds: string[];
} & UserAwareDispatchableParams;

type JobDependencies = {
  DenormalizeThesaurusEntitiesUseCaseFactory: typeof DenormalizeThesaurusEntitiesUseCaseFactory;
};

class DenormalizeThesaurusEntitiesChunkHandler extends UserAwareDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, _jobInfo: JobInfo) {
    const useCase = this.deps.DenormalizeThesaurusEntitiesUseCaseFactory.default();

    await useCase.execute({ sharedIds: this.params.sharedIds });
  }
}

export { DenormalizeThesaurusEntitiesChunkHandler };
