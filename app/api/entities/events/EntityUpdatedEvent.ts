import { Entity } from '#api/core/domain/entity/Entity.js';
import { MongoEntityMapper } from '#api/core/infrastructure/mongodb/entity/MongoEntityMapper.js';
import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

interface EntityUpdatedData {
  before: EntitySchema[];
  after: EntitySchema[];
  targetLanguageKey: string;
  /** Absent when the emitter does not track them; read through `changedLanguagesOf`. */
  changedLanguages?: string[];
}

type FromEntityProps = {
  entity: Entity;
  targetLanguage: LanguageISO6391;
};

class EntityUpdatedEvent extends AbstractEvent<EntityUpdatedData> {
  static fromEntity({ entity, targetLanguage }: FromEntityProps) {
    return new EntityUpdatedEvent({
      before: MongoEntityMapper.toDBO(entity.previousVersion) as unknown as EntitySchema[],
      after: MongoEntityMapper.toDBO(entity) as unknown as EntitySchema[],
      targetLanguageKey: targetLanguage,
      changedLanguages: entity.changedLanguages,
    });
  }

  static changedLanguagesOf({ changedLanguages, targetLanguageKey }: EntityUpdatedData) {
    return changedLanguages ?? [targetLanguageKey];
  }
}

export { EntityUpdatedEvent };

export type { EntityUpdatedData };
