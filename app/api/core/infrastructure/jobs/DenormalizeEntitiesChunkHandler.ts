import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DenormalizeThesaurusEntitiesUseCaseFactory } from '../factories/DenormalizeThesaurusEntitiesUseCaseFactory.js';
import { DenormalizeRelationshipsUseCaseFactory } from '../factories/DenormalizeRelationshipsUseCaseFactory.js';
import { UwaziJobHandler } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import {
  DenormalizeThesaurusEntitiesChunkParams,
  DenormalizeRelationshipsParams,
} from './DenormalizeEntitiesJobParams.js';

type Params = DenormalizeThesaurusEntitiesChunkParams | DenormalizeRelationshipsParams;

type JobDependencies = {
  DenormalizeThesaurusEntitiesUseCaseFactory: typeof DenormalizeThesaurusEntitiesUseCaseFactory;
  DenormalizeRelationshipsUseCaseFactory: typeof DenormalizeRelationshipsUseCaseFactory;
};

@PrivilegedJob()
class DenormalizeEntitiesChunkHandler extends UwaziJobHandler<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params, _jobInfo: JobInfo) {
    if (params.kind === 'thesaurus') {
      const useCase = this.deps.DenormalizeThesaurusEntitiesUseCaseFactory.default();
      await useCase.execute({ sharedIds: params.sharedIds, thesaurusId: params.thesaurusId });
      return;
    }

    const useCase = this.deps.DenormalizeRelationshipsUseCaseFactory.default();
    await useCase.execute({ sharedIds: params.sharedIds });
  }
}

export { DenormalizeEntitiesChunkHandler };
