import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { JobsDispatcher } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { Template } from 'api/templates.v2/model/Template';
import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { UpdateRelationshipPropertiesJob } from './UpdateRelationshipPropertiesJob';

export class UpdateTemplateRelationshipPropertiesJob implements Dispatchable {
  static BATCH_SIZE = 200;

  private entitiesDataSource: EntitiesDataSource;

  private dispatcher: JobsDispatcher;

  constructor(entitiesDataSource: EntitiesDataSource, dispatcher: JobsDispatcher) {
    this.entitiesDataSource = entitiesDataSource;
    this.dispatcher = dispatcher;
  }

  async handleDispatch(heartbeat: HeartbeatCallback, params: { templateId: Template['id'] }) {
    await this.entitiesDataSource
      .getIdsByTemplate(params.templateId)
      .forEachBatch(UpdateTemplateRelationshipPropertiesJob.BATCH_SIZE, async entityIds => {
        await this.dispatcher.dispatch(UpdateRelationshipPropertiesJob, { entityIds });
        await heartbeat();
      });
  }
}
