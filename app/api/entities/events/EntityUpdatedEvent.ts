import { AbstractEvent } from 'api/eventsbus';
import { EntitySchema } from 'shared/types/entityType';

interface EntityUpdatedData {
  before: EntitySchema;
  after: EntitySchema;
}

class EntityUpdatedEvent extends AbstractEvent<EntityUpdatedData> {}

export { EntityUpdatedEvent };
