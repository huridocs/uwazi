import { Entity } from '#api/core/domain/entity/Entity.js';
import { MongoEntityMapper } from '#api/core/infrastructure/mongodb/entity/MongoEntityMapper.js';
import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { EntitySchema } from '#shared/types/entityType.js';

type ProvidedTranslations = Partial<Record<string, string[]>>;

interface EntityCreatedData {
  entities: EntitySchema[];
  targetLanguageKey: string;
  /** Property names per language the client translated itself when creating the entity. */
  providedTranslations?: ProvidedTranslations;
}

class EntityCreatedEvent extends AbstractEvent<EntityCreatedData> {
  static fromEntity(
    entity: Entity,
    targetLanguage: LanguageISO6391,
    providedTranslations?: ProvidedTranslations
  ) {
    return new EntityCreatedEvent({
      entities: MongoEntityMapper.toDBO(entity) as any,
      targetLanguageKey: targetLanguage,
      ...(providedTranslations && { providedTranslations }),
    });
  }
}

export { EntityCreatedEvent };
export type { ProvidedTranslations };
