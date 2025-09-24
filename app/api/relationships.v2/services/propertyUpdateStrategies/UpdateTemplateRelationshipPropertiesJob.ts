// @ts-expect-error TS(2307): Cannot find module '../entities.v2/contracts/Entit... Remove this comment to see the full error message
import { EntitiesDataSource } from '../entities.v2/contracts/EntitiesDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { JobsDispatcher } from '../queue.v2/application/contracts/JobsDispatcher.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Template... Remove this comment to see the full error message
import { Template } from 'api/templates.v2/model/Template.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { Dispatchable, HeartbeatCallback } from '../queue.v2/application/contracts/Dispatchable.js';
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
      // @ts-expect-error TS(7006): Parameter 'entityIds' implicitly has an 'any' type... Remove this comment to see the full error message
      .forEachBatch(UpdateTemplateRelationshipPropertiesJob.BATCH_SIZE, async entityIds => {
        await this.dispatcher.dispatch(UpdateRelationshipPropertiesJob, { entityIds });
        await heartbeat();
      });
  }
}
