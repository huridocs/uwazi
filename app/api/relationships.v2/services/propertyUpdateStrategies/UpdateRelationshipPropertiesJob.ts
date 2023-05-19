import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { HeartbeatCallback, Job } from 'api/queue/contracts/Job';

export class UpdateRelationshipPropertiesJob extends Job {
  private entityIds: string[];

  updater?: EntityRelationshipsUpdateService;

  constructor(entityIds: string[]) {
    super();
    this.entityIds = entityIds;
  }

  async handle(heartbeat: HeartbeatCallback) {
    return this.entityIds.reduce(async (previous, entityId) => {
      await previous;
      await this.updater!.update([entityId]);
      await heartbeat();
    }, Promise.resolve());
  }
}
