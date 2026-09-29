import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { DenormalizeEntitiesChunkHandler } from './DenormalizeEntitiesChunkHandler.js';
import { UwaziJobHandler } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import {
  DenormalizeThesaurusEntitiesParams,
  DenormalizeRelationshipsParams,
} from './DenormalizeEntitiesJobParams.js';

type Params = DenormalizeThesaurusEntitiesParams | DenormalizeRelationshipsParams;

type JobDependencies = {
  entitiesDS: EntitiesDataSource;
  jobsDispatcher: JobsDispatcher;
};

function collectNew(ids: string[], seen: Set<string>): string[] {
  const fresh = ids.filter(id => !seen.has(id));
  fresh.forEach(id => seen.add(id));
  return fresh;
}

async function computeReferencingClosure(
  sharedIds: string[],
  deps: {
    getSharedIdsReferencing: (ids: string[]) => Promise<string[]>;
    getSharedIdsInheritingRelationshipFrom: (ids: string[]) => Promise<string[]>;
  }
): Promise<string[]> {
  const seen = new Set(sharedIds);
  const closure: string[] = [];

  // Layer 1: entities that reference the updated entities directly.
  const direct = collectNew(await deps.getSharedIdsReferencing(sharedIds), seen);
  closure.push(...direct);

  // Layer 2: entities that inherit a relationship from a direct referencer.
  // We only denormalize two hops, so we stop here instead of chasing further.
  if (direct.length > 0) {
    const inheriting = collectNew(await deps.getSharedIdsInheritingRelationshipFrom(direct), seen);
    closure.push(...inheriting);
  }

  return closure;
}

@PrivilegedJob()
class DenormalizeEntitiesHandler extends UwaziJobHandler<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params, _jobInfo: JobInfo) {
    const sharedIds =
      params.kind === 'thesaurus'
        ? await this.deps.entitiesDS.getSharedIdsUsingThesaurus(params.thesaurusId, params.valueIds)
        : await computeReferencingClosure(params.sharedIds, this.deps.entitiesDS);

    const chunks = ArrayUtils.splitInChunks(sharedIds, 100);

    await this.deps.jobsDispatcher.dispatchMany(async dispatch =>
      chunks.forEach(chunk =>
        dispatch(DenormalizeEntitiesChunkHandler, { ...params, sharedIds: chunk })
      )
    );
  }
}

export { DenormalizeEntitiesHandler, computeReferencingClosure };
