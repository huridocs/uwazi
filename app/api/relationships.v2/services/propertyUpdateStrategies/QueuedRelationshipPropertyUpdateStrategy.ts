// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { JobsDispatcher } from '../queue.v2/application/contracts/JobsDispatcher.js';
import { RelationshipPropertyUpdateStrategy as Strategy } from './RelationshipPropertyUpdateStrategy';
import { UpdateRelationshipPropertiesJob } from './UpdateRelationshipPropertiesJob';
import { UpdateTemplateRelationshipPropertiesJob } from './UpdateTemplateRelationshipPropertiesJob';

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
