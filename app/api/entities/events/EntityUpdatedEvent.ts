import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';

import { EntitySchema } from '#shared/types/entityType.js';

interface EntityUpdatedData {
  before: EntitySchema[];
  after: EntitySchema[];
  targetLanguageKey: string;
}

class EntityUpdatedEvent extends AbstractEvent<EntityUpdatedData> {}

export { EntityUpdatedEvent };

export type { EntityUpdatedData };
