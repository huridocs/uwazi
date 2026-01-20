import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';

import { EntitySchema } from '#shared/types/entityType.js';

interface EntityCreatedData {
  entities: EntitySchema[];
  targetLanguageKey: string;
}

class EntityCreatedEvent extends AbstractEvent<EntityCreatedData> {
  static fromEntity(entity: Entity, targetLanguage: LanguageISO6391) {
    return new EntityCreatedEvent({
      entities: MongoEntityMapper.toDBO(entity) as any,
      targetLanguageKey: targetLanguage,
    });
  }
}

export { EntityCreatedEvent };
