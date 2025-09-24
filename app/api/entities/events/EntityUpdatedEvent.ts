import { AbstractEvent } from '../../eventsbus/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';

interface EntityUpdatedData {
  before: EntitySchema[];
  after: EntitySchema[];
  targetLanguageKey: string;
}

class EntityUpdatedEvent extends AbstractEvent<EntityUpdatedData> {}

export { EntityUpdatedEvent };

export type { EntityUpdatedData };
