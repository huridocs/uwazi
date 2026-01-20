import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { RelationshipPropertyUpdateStrategy as Strategy } from '#api/relationships.v2/services/propertyUpdateStrategies/RelationshipPropertyUpdateStrategy.js';
import { UpdateRelationshipPropertiesJob } from '#api/relationships.v2/services/propertyUpdateStrategies/UpdateRelationshipPropertiesJob.js';
import { UpdateTemplateRelationshipPropertiesJob } from '#api/relationships.v2/services/propertyUpdateStrategies/UpdateTemplateRelationshipPropertiesJob.js';

export class QueuedRelationshipPropertyUpdateStrategy implements Strategy {
  private dispatcher: JobsDispatcher;

  constructor(dispatcher: JobsDispatcher) {
    this.dispatcher = dispatcher;
  }

  async update(entityIds: string[]): Promise<void> {
    await Promise.all(
      entityIds.map(async entityId =>
        this.dispatcher.dispatch(UpdateRelationshipPropertiesJob, { entityIds: [entityId] })
      )
    );
  }

  async updateByTemplate(templateId: string): Promise<void> {
    await this.dispatcher.dispatch(UpdateTemplateRelationshipPropertiesJob, { templateId });
  }
}
