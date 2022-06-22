import { AbstractEvent } from 'api/eventsbus';
import { EntitySchema } from 'shared/types/entityType';

interface EntityUpdatedData {
  before: EntitySchema[];
  after: EntitySchema[];
  targetLanguageKey: string;
}

class EntityUpdatedEvent extends AbstractEvent<EntityUpdatedData> {}

export { EntityUpdatedEvent };
