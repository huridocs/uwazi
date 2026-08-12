import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import relationships from '#api/relationships/relationships.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { User } from '#api/users.v2/model/User.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { EntityNotFoundError } from '#api/core/application/errors.js';
import { TemplatesDAOFactory } from '../factories/TemplatesDAOFactory.js';
import { EntitiesDAOFactory } from '../factories/EntitiesDAOFactory.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

type Params = UwaziJobParams & {
  templateId: string;
  sharedId: string;
  targetLanguage: LanguageISO6391;
};

type JobDependencies = {
  relationships: typeof relationships;
};

@PrivilegedJob()
class RelationshipSyncJob extends UwaziJobHandler<Params> {
  constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params): Promise<void> {
    const dao = TemplatesDAOFactory.default();
    const templates = await dao.get([params.templateId]);
    const template = templates[0] || null;

    const entity = await EntitiesDAOFactory.default({
      user: User.createFrom({ _id: params.userId, role: 'admin' }),
    }).getBySharedId(params.sharedId, params.targetLanguage);

    if (!entity) {
      throw new NonRetryableJobError(new EntityNotFoundError(params.sharedId));
    }

    await this.deps.relationships.saveEntityBasedReferences(
      entity,
      params.targetLanguage,
      template
    );
  }
}

export { RelationshipSyncJob };
