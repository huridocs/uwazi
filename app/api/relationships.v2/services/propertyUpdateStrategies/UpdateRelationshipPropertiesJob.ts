import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { Job } from 'api/queue/contracts/Job';

export class UpdateRelationshipPropertiesJob implements Job {
  private entityIds: string[];

  constructor(entityIds: string[]) {
    this.entityIds = entityIds;
  }

  async handle() {
    await updater.update(this.entityIds);
  }
}
