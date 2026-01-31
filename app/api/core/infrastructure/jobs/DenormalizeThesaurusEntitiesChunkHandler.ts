import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { DenormalizeThesaurusEntitiesUseCaseFactory } from '../factories/DenormalizeThesaurusEntitiesUseCaseFactory.js';

type Params = {
  thesaurusId: string;
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

    await useCase.execute({
      sharedIds: this.params.sharedIds,
      thesaurusId: this.params.thesaurusId,
    });
  }
}

export { DenormalizeThesaurusEntitiesChunkHandler };
