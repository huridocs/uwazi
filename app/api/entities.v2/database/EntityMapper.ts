import { MongoIdHandler } from 'api/core/infrastructure/mongodb/common/MongoIdGenerator';
import { EntitySchema } from 'api/migrations/migrations/143-parse-numeric-fields/types';
import { MetadataSchema } from 'shared/types/commonTypes';
import { Entity } from '../model/Entity';
import { EntityDBO } from './schemas/EntityTypes';

export const EntityMappers = {
  toModel(dbo: EntityDBO) {
    return new Entity(
      MongoIdHandler.mapToApp(dbo._id),
      dbo.sharedId,
      dbo.language,
      dbo.title,
      MongoIdHandler.mapToApp(dbo.template),
      dbo.metadata,
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
