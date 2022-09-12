import { AbstractEvent } from 'api/eventsbus';
import { EntitySchema } from 'shared/types/entityType';

interface EntityDeletedData {
  entity: EntitySchema[];
}

class EntityDeletedEvent extends AbstractEvent<EntityDeletedData> {}

export { EntityDeletedEvent };
