import { AbstractEvent } from 'api/core/libs/eventsbus';
import { EntitySchema } from 'shared/types/entityType';

interface EntityUpdatedData {
  before: EntitySchema[];
  after: EntitySchema[];
  targetLanguageKey: string;
}

class EntityUpdatedEvent extends AbstractEvent<EntityUpdatedData> {}

export { EntityUpdatedEvent };

export type { EntityUpdatedData };
