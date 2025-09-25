import { AbstractEvent } from '../../eventsbus/index.js';

import { EntitySchema } from '#shared/types/entityType.js';

interface EntityDeletedData {
  entity: EntitySchema[];
}

class EntityDeletedEvent extends AbstractEvent<EntityDeletedData> {}

export { EntityDeletedEvent };
