import { DeprecatedEntitiesDataSource } from '#api/entities.v2/contracts/DeprecatedEntitiesDataSource.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { Template } from '#api/core/domain/template/Template.js';
import {
  Dispatchable,
  HeartbeatCallback,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { UpdateRelationshipPropertiesJob } from './UpdateRelationshipPropertiesJob.js';

export class UpdateTemplateRelationshipPropertiesJob implements Dispatchable {
  static BATCH_SIZE = 200;

  private entitiesDataSource: DeprecatedEntitiesDataSource;

  private dispatcher: JobsDispatcher;

  constructor(entitiesDataSource: DeprecatedEntitiesDataSource, dispatcher: JobsDispatcher) {
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
