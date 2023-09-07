import { Dispatchable } from 'api/queue.v2/application/contracts/Dispatchable';
import { DispatchableClass } from 'api/queue.v2/application/contracts/JobsDispatcher';
import {
  UpdateTemplateRelationshipPropertiesJob as createUpdateTemplateRelationshipPropertiesJob,
  UpdateRelationshipPropertiesJob as createUpdateRelationshipPropertiesJob,
} from 'api/relationships.v2/services/service_factories';
import { UpdateRelationshipPropertiesJob } from 'api/relationships.v2/services/propertyUpdateStrategies/UpdateRelationshipPropertiesJob';
import { UpdateTemplateRelationshipPropertiesJob } from 'api/relationships.v2/services/propertyUpdateStrategies/UpdateTemplateRelationshipPropertiesJob';

export function registerJobs(
  register: <T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    factory: (namespace: string) => Promise<T>
  ) => void
) {
  register(UpdateRelationshipPropertiesJob, async () => createUpdateRelationshipPropertiesJob());
  register(UpdateTemplateRelationshipPropertiesJob, createUpdateTemplateRelationshipPropertiesJob);
}
