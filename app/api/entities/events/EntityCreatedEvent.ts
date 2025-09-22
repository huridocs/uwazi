import { AbstractEvent } from '../../eventsbus/index.js';
import { EntitySchema } from '../../shared/types/entityType.js';

interface EntityCreatedData {
  entities: EntitySchema[];
  targetLanguageKey: string;
}

class EntityCreatedEvent extends AbstractEvent<EntityCreatedData> {}

export { EntityCreatedEvent };
