import relationships from 'api/relationships';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { ObjectId } from 'mongodb';
import { EntityDBO } from 'api/entities.v2/database/schemas/EntityTypes';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { EntityNotFoundError } from 'api/core/application/errors';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { TemplateDBO } from '../mongodb/template/DBOs/TemplateDBO';

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
    const db = getConnection();

    const template = await db
      .collection<TemplateDBO>('templates')
      .findOne({ _id: ObjectId.createFromHexString(this.params.templateId) });

    const entity = await db.collection<EntityDBO>('entities').findOne({
      sharedId: this.params.sharedId,
      language: this.params.targetLanguage,
    });

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
