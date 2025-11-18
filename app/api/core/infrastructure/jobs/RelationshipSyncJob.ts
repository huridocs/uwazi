import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import { V1CompatTenantDispatchable } from 'api/core/libs/queue/application/contracts/V1CompatTenantDispatchable';
import relationships from 'api/relationships';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { ObjectId } from 'mongodb';
import { EntityDBO } from 'api/entities.v2/database/schemas/EntityTypes';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { TemplateDBO } from '../mongodb/template/DBOs/TemplateDBO';

type Params = {
  templateId: string;
  sharedId: string;
  targetLanguage: LanguageISO6391;
};

type JobDependencies = {
  relationships: typeof relationships;
};

class RelationshipSyncJob extends V1CompatTenantDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(
    _heartbeat: HeartbeatCallback,
    { sharedId, targetLanguage, templateId }: Params,
    _jobInfo: JobInfo
  ) {
    const db = getConnection();
    const template = await db
      .collection<TemplateDBO>('templates')
      .findOne({ _id: ObjectId.createFromHexString(templateId) });
    const entity = await db
      .collection<EntityDBO>('entities')
      .findOne({ sharedId, language: targetLanguage });
    await this.deps.relationships.saveEntityBasedReferences(entity, targetLanguage, template);
  }
}

export { RelationshipSyncJob };
