import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DenormalizeThesaurusEntitiesUseCaseFactory } from '../factories/DenormalizeThesaurusEntitiesUseCaseFactory.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

type Params = {
  thesaurusId: string;
  sharedIds: string[];
} & UwaziJobParams;

type JobDependencies = {
  DenormalizeThesaurusEntitiesUseCaseFactory: typeof DenormalizeThesaurusEntitiesUseCaseFactory;
};

@PrivilegedJob()
class DenormalizeThesaurusEntitiesChunkHandler extends UwaziJobHandler<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params, _jobInfo: JobInfo) {
    const useCase = this.deps.DenormalizeThesaurusEntitiesUseCaseFactory.default();

    await useCase.execute({
      sharedIds: params.sharedIds,
      thesaurusId: params.thesaurusId,
    });
  }
}

export { DenormalizeThesaurusEntitiesChunkHandler };
