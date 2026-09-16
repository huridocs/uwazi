import { Entity } from '#api/core/domain/entity/Entity.js';
import { MongoEntityMapper } from '#api/core/infrastructure/mongodb/entity/MongoEntityMapper.js';
import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';
import { EntitySchema } from '#shared/types/entityType.js';

interface EntityUpdatedData {
  before: EntitySchema[];
  after: EntitySchema[];
  targetLanguageKey: string;
}

type CreateForChangedLanguagesProps = {
  entity: Entity;
};

class EntityUpdatedEvent extends AbstractEvent<EntityUpdatedData> {
  static createForChangedLanguages({ entity }: CreateForChangedLanguagesProps) {
    const { changedLanguages } = entity;
    if (changedLanguages.length === 0) return [];

    const before = MongoEntityMapper.toDBO(entity.previousVersion) as unknown as EntitySchema[];
    const after = MongoEntityMapper.toDBO(entity) as unknown as EntitySchema[];

    return changedLanguages.map(
      targetLanguageKey => new EntityUpdatedEvent({ before, after, targetLanguageKey })
    );
  }
}

export { EntityUpdatedEvent };

export type { EntityUpdatedData };
