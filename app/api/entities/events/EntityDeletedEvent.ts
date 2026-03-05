import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';
import { EntitySchema } from '#shared/types/entityType.js';

interface EntityDeletedData {
  entity: EntitySchema[];
}

class EntityDeletedEvent extends AbstractEvent<EntityDeletedData> {
  static fromDomain(sharedId: string) {
    return new EntityDeletedEvent({
      entity: [{ sharedId }] as any[], // Todo: this is concerning...
    });
  }
}

export { EntityDeletedEvent };
