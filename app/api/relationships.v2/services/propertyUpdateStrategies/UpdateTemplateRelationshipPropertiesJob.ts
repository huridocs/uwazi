import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { HeartbeatCallback, Job } from 'api/queue.v2/contracts/Job';
import { JobsDispatcher } from 'api/queue.v2/contracts/JobsDispatcher';
import { Template } from 'api/templates.v2/model/Template';
import { UpdateRelationshipPropertiesJob } from './UpdateRelationshipPropertiesJob';

export class UpdateTemplateRelationshipPropertiesJob extends Job {
  static BATCH_SIZE = 200;

  private template: Template['id'];

  entitiesDataSource?: EntitiesDataSource;

  dispatcher?: JobsDispatcher;

  constructor(template: Template['id']) {
    super();
    this.template = template;
  }

  async handle(heartbeat: HeartbeatCallback) {
    if (!this.entitiesDataSource) {
      throw new Error('Missing dependency: entitiesDataSource');
    }

    if (!this.dispatcher) {
      throw new Error('Missing dependency: dispatcher');
    }

    await this.entitiesDataSource
      .getIdsByTemplate(this.template)
      .forEachBatch(UpdateTemplateRelationshipPropertiesJob.BATCH_SIZE, async sharedIds => {
        await this.dispatcher!.dispatch(new UpdateRelationshipPropertiesJob(sharedIds));
        await heartbeat();
      });
  }
}
