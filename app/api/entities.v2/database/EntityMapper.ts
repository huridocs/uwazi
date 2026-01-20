import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { EntitySchema } from '#shared/types/entityType.js';

import { MetadataSchema } from '#shared/types/commonTypes.js';
import { Entity } from '#api/entities.v2/model/Entity.js';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';

export const EntityMappers = {
  toModel(dbo: EntityDBO) {
    return new Entity(
      MongoIdHandler.mapToApp(dbo._id),
      dbo.sharedId,
      dbo.language,
      dbo.title,
      MongoIdHandler.mapToApp(dbo.template),
      dbo.metadata as any,
      dbo.icon,
      dbo.obsoleteMetadata
    );
  },

  toLegacyDTO(entity: Entity): EntitySchema {
    return {
      sharedId: entity.sharedId,
      language: entity.language,
      title: entity.title,
      template: entity.template,
      icon: entity.icon,
      metadata: entity.metadata as MetadataSchema,
    };
  },
};
