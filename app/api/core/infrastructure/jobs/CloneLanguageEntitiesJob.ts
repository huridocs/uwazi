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
import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { EntityIndexerService } from '../elasticSearch/entities/EntityIndexerService.js';
import { MongoEntityDAO } from '../mongodb/entity/MongoEntityDAO.js';
import { EntityPreviewBatchHandler } from './EntityPreviewBatchHandler.js';

type Pair = {
  from: LanguageISO6391;
  to: LanguageISO6391;
};

type Params = {
  pairs: Pair[];
};

type JobDependencies = {
  entityDAO: MongoEntityDAO;
  filesCollection: Collection;
  jobsDispatcher: JobsDispatcher;
  webSockets: WebSockets;
  settingsDS: SettingsDataSource;
  entityIndexer: EntityIndexerService;
};

class CloneLanguageEntitiesJob extends V1CompatTenantDispatchable<Params> {
  constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(
    heartbeat: HeartbeatCallback,
    params: Params,
    jobInfo?: JobInfo
  ): Promise<void> {
    const isLastAttempt = jobInfo !== undefined && jobInfo.retryCount === jobInfo.maxRetries;

    try {
      for (const { from, to } of params.pairs) {
        // eslint-disable-next-line no-await-in-loop
        await this.deps.entityDAO.cloneForLanguage(from, to, async batch =>
          this.deps.entityIndexer.sync(batch.map(e => e.sharedId))
        );
        // eslint-disable-next-line no-await-in-loop
        await heartbeat();
        // eslint-disable-next-line no-await-in-loop
        await search.indexEntities({ language: to });

        const ISO639_3 = LanguageUtils.fromISO639_1(to)?.ISO639_3;
        if (ISO639_3) {
          // eslint-disable-next-line no-await-in-loop
          const sharedIds: string[] = await this.deps.filesCollection.distinct('entity', {
            type: 'document',
            status: 'ready',
            language: ISO639_3,
          });

          if (sharedIds.length > 0) {
            const chunks = ArrayUtils.splitInChunks(sharedIds, 100);
            // eslint-disable-next-line no-await-in-loop
            await this.deps.jobsDispatcher.dispatchMany(dispatch => {
              chunks.forEach(chunk =>
                dispatch(EntityPreviewBatchHandler, { languageKey: to, sharedIds: chunk })
              );
            });
          }
        }

        // eslint-disable-next-line no-await-in-loop
        await this.deps.settingsDS.setLanguageInstalling(to, false);
      }
    } catch (e) {
      if (isLastAttempt) {
        for (const { to } of params.pairs) {
          // eslint-disable-next-line no-await-in-loop
          await this.deps.settingsDS.setLanguageInstalling(to, false);
        }
      }
      throw e;
    }

    if (jobInfo) {
      this.deps.webSockets.emitToTenant(jobInfo.namespace, 'translationsInstallDone');
    }
  }
}

export { CloneLanguageEntitiesJob };
