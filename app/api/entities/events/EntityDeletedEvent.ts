import { AbstractEvent } from 'api/eventsbus';
import { EntitySchema } from '../../shared/types/entityType.js';

interface EntityDeletedData {
  entity: EntitySchema[];
}

class EntityDeletedEvent extends AbstractEvent<EntityDeletedData> {}

export { EntityDeletedEvent };
