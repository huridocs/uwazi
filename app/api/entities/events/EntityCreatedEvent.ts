import { Entity } from 'api/core/domain/entity/Entity';
import { MongoEntityMapper } from 'api/core/infrastructure/mongodb/entity/MongoEntityMapper';
import { AbstractEvent } from 'api/core/libs/eventsbus';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';

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
