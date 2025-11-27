import { Entity } from 'api/core/domain/entity/Entity';
import { MongoEntityMapper } from 'api/core/infrastructure/mongodb/entity/MongoEntityMapper';
import { AbstractEvent } from 'api/core/libs/eventsbus';
import { EntitySchema } from 'shared/types/entityType';

interface EntityDeletedData {
  entity: EntitySchema[];
}

class EntityDeletedEvent extends AbstractEvent<EntityDeletedData> {
  static fromDomain(entity: Entity) {
    return new EntityDeletedEvent({
      entity: MongoEntityMapper.toDBO(entity) as any[], // TOdo: this is concerning...
    });
  }
}

export { EntityDeletedEvent };
