import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { DenormalizeThesaurusEntitiesChunkHandler } from './DenormalizeThesaurusEntitiesChunkHandler.js';

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
