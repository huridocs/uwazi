import relationships from '#api/relationships/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { User } from '#api/users.v2/model/User.js';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { EntityNotFoundError } from '#api/core/application/errors.js';
import { TemplatesDAOFactory } from '../factories/TemplatesDAOFactory.js';
import { EntitiesDAOFactory } from '../factories/EntitiesDAOFactory.js';

type Params = UserAwareDispatchableParams & {
  templateId: string;
  sharedId: string;
  targetLanguage: LanguageISO6391;
};

type JobDependencies = {
  relationships: typeof relationships;
};

class RelationshipSyncJob extends UserAwareDispatchable<Params> {
  constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(): Promise<void> {
    const dao = TemplatesDAOFactory.default();
    const templates = await dao.get([this.params.templateId]);
    const template = templates[0] || null;

    const entity = await EntitiesDAOFactory.default({
      user: User.createFrom({ _id: this.params.userId, role: 'admin' }),
    }).getBySharedId(this.params.sharedId, this.params.targetLanguage);

    if (!entity) {
      throw new NonRetryableJobError(new EntityNotFoundError(this.params.sharedId));
    }

    await this.deps.relationships.saveEntityBasedReferences(
      entity,
      this.params.targetLanguage,
      template
    );
  }
}

export { RelationshipSyncJob };
