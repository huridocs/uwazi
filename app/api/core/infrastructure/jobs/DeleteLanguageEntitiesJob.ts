import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { search } from '#api/search/index.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { V1CompatTenantDispatchable } from '#api/core/libs/queue/application/contracts/V1CompatTenantDispatchable.js';
import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { EntityIndexerService } from '../elasticSearch/entities/EntityIndexerService.js';
import { MongoEntitiesDAO } from '../mongodb/entity/MongoEntityDAO.js';

type Params = {
  language: LanguageISO6391;
};

type JobDependencies = {
  entityDAO: MongoEntitiesDAO;
  entityIndexer: EntityIndexerService;
  webSockets: WebSockets;
};

class DeleteLanguageEntitiesJob extends V1CompatTenantDispatchable<Params> {
  constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(
    _heartbeat: HeartbeatCallback,
    params: Params,
    jobInfo?: JobInfo
  ): Promise<void> {
    const { language } = params;

    await this.deps.entityDAO.deleteByLanguage(language, async batch =>
      this.deps.entityIndexer.sync(batch)
    );
    await search.deleteLanguage(language);

    if (jobInfo) {
      this.deps.webSockets.emitToTenant(jobInfo.namespace, 'translationsDeleteDone');
    }
  }
}

export { DeleteLanguageEntitiesJob };
