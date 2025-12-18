import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { DenormalizeThesaurusEntitiesChunkHandler } from './DenormalizeThesaurusEntitiesChunkHandler';

type Params = {
  thesaurusId: string;
} & UserAwareDispatchableParams;

type JobDependencies = {
  entitiesDS: MultiLanguageEntityDataSource;
  jobsDispatcher: JobsDispatcher;
};

class DenormalizeThesaurusEntitiesHandler extends UserAwareDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, _jobInfo: JobInfo) {
    const sharedIds = await this.deps.entitiesDS.getSharedIdsUsingThesaurus(
      this.params.thesaurusId
    );

    const chunks = ArrayUtils.splitInChunks(sharedIds, 100);

    await this.deps.jobsDispatcher.dispatchMany(async dispatch =>
      chunks.forEach(chunk =>
        dispatch(DenormalizeThesaurusEntitiesChunkHandler, { sharedIds: chunk, ...this.params })
      )
    );
  }
}

export { DenormalizeThesaurusEntitiesHandler };
