import { EntitiesDataSource } from '#api/entities.v2/contracts/EntitiesDataSource.js';

import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

import { Template } from '#api/core/domain/template/Template.js';

import { Dispatchable, HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { UpdateRelationshipPropertiesJob } from '#api/relationships.v2/services/propertyUpdateStrategies/UpdateRelationshipPropertiesJob.js';

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
