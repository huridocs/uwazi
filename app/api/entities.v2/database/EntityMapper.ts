import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
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
      dbo.obsoleteMetadata
    );
  },
};
