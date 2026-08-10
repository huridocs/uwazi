import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { DenormalizeThesaurusEntitiesChunkHandler } from './DenormalizeThesaurusEntitiesChunkHandler.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

type Params = {
  thesaurusId: string;
} & UwaziJobParams;

type JobDependencies = {
  entitiesDS: EntitiesDataSource;
  jobsDispatcher: JobsDispatcher;
};

@PrivilegedJob()
class DenormalizeThesaurusEntitiesHandler extends UwaziJobHandler<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params, _jobInfo: JobInfo) {
    const sharedIds = await this.deps.entitiesDS.getSharedIdsUsingThesaurus(params.thesaurusId);

    const chunks = ArrayUtils.splitInChunks(sharedIds, 100);

    await this.deps.jobsDispatcher.dispatchMany(async dispatch =>
      chunks.forEach(chunk =>
        dispatch(DenormalizeThesaurusEntitiesChunkHandler, { sharedIds: chunk, ...params })
      )
    );
  }
}

export { DenormalizeThesaurusEntitiesHandler };
