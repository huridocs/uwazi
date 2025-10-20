import { AbstractEvent } from 'api/core/libs/eventsbus';
import { EntitySchema } from 'shared/types/entityType';

interface EntityCreatedData {
  entities: EntitySchema[];
  targetLanguageKey: string;
}

class EntityCreatedEvent extends AbstractEvent<EntityCreatedData> {}

export { EntityCreatedEvent };
