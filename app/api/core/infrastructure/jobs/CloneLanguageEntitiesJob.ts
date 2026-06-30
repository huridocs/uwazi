/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { LanguageUtils } from '#shared/language/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { search } from '#api/search/index.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { V1CompatTenantDispatchable } from '#api/core/libs/queue/application/contracts/V1CompatTenantDispatchable.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { MongoEntitiesDAO } from '../mongodb/entity/MongoEntitiesDAO.js';
import { EntityPreviewBatchHandler } from './EntityPreviewBatchHandler.js';
import { FilesDAO } from '../factories/FilesDAOFactory.js';

type Pair = {
  from: LanguageISO6391;
  to: LanguageISO6391;
};

type Params = {
  pairs: Pair[];
};

type JobDependencies = {
  entityDAO: MongoEntitiesDAO;
  filesDAO: FilesDAO;
  jobsDispatcher: JobsDispatcher;
  webSockets: WebSockets;
  settingsDS: SettingsDataSource;
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
        await this.deps.entityDAO.cloneForLanguage(from, to);
        await heartbeat();
        await search.indexEntities({ language: to });

        const ISO639_3 = LanguageUtils.fromISO639_1(to)?.ISO639_3;
        if (ISO639_3) {
          const sharedIds = await this.deps.filesDAO.getDistinctEntitySharedIds({
            type: 'document',
            status: 'ready',
            language: ISO639_3,
          });

          if (sharedIds.length > 0) {
            const chunks = ArrayUtils.splitInChunks(sharedIds, 100);

            await this.deps.jobsDispatcher.dispatchMany(dispatch => {
              chunks.forEach(chunk =>
                dispatch(EntityPreviewBatchHandler, { languageKey: to, sharedIds: chunk })
              );
            });
          }
        }
        await this.deps.settingsDS.setLanguageInstalling(to, false);
      }
    } catch (e) {
      if (isLastAttempt) {
        for (const { to } of params.pairs) {
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
