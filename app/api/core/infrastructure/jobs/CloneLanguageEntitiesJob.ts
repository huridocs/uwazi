import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { LanguageUtils } from '#shared/language/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { search } from '#api/search/index.js';
import { Collection } from 'mongodb';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { V1CompatTenantDispatchable } from '#api/core/libs/queue/application/contracts/V1CompatTenantDispatchable.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { MongoEntityDAO } from '../mongodb/entity/MongoEntityDAO.js';
import { EntityPreviewBatchHandler } from './EntityPreviewBatchHandler.js';

type Params = {
  from: LanguageISO6391;
  to: LanguageISO6391;
};

type JobDependencies = {
  entityDAO: MongoEntityDAO;
  filesCollection: Collection;
  jobsDispatcher: JobsDispatcher;
};

class CloneLanguageEntitiesJob extends V1CompatTenantDispatchable<Params> {
  constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(
    _heartbeat: HeartbeatCallback,
    params: Params,
    _jobInfo?: JobInfo
  ): Promise<void> {
    const { from, to } = params;

    await this.deps.entityDAO.cloneForLanguage(from, to);

    await search.indexEntities({ language: to });

    const iso639_3 = LanguageUtils.fromISO639_1(to)?.ISO639_3;
    if (!iso639_3) return;

    const sharedIds: string[] = await this.deps.filesCollection.distinct('entity', {
      type: 'document',
      status: 'ready',
      language: iso639_3,
    });

    if (sharedIds.length === 0) return;

    const chunks = ArrayUtils.splitInChunks(sharedIds, 100);
    await this.deps.jobsDispatcher.dispatchMany(dispatch => {
      chunks.forEach(chunk =>
        dispatch(EntityPreviewBatchHandler, { languageKey: to, sharedIds: chunk })
      );
    });
  }
}

export { CloneLanguageEntitiesJob };
