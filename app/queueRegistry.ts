import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { DispatchableClass } from 'api/queue.v2/application/contracts/JobsDispatcher';
// import {
//   UpdateTemplateRelationshipPropertiesJob as createUpdateTemplateRelationshipPropertiesJob,
//   UpdateRelationshipPropertiesJob as createUpdateRelationshipPropertiesJob,
// } from 'api/relationships.v2/services/service_factories';
// import { UpdateRelationshipPropertiesJob } from 'api/relationships.v2/services/propertyUpdateStrategies/UpdateRelationshipPropertiesJob';
// eslint-disable-next-line max-len
// import { UpdateTemplateRelationshipPropertiesJob } from 'api/relationships.v2/services/propertyUpdateStrategies/UpdateTemplateRelationshipPropertiesJob';

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export class TestJob implements Dispatchable {
  static BATCH_SIZE = 200;

  // eslint-disable-next-line class-methods-use-this
  async handleDispatch(_heartbeat: HeartbeatCallback) {
    await new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.floor(Math.random() * 10) === 0) {
            reject(new Error('Random error occurred'));
          }
          resolve({});
        },
        randomIntFromInterval(0, 5000)
      );
    });
  }
}

export function registerJobs(
  register: <T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    factory: (namespace: string) => Promise<T>
  ) => void
) {
  // register(UpdateRelationshipPropertiesJob, async () => createUpdateRelationshipPropertiesJob());
  // register(UpdateTemplateRelationshipPropertiesJob, createUpdateTemplateRelationshipPropertiesJob);
  register(TestJob, async () => new TestJob());
}
