// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoIdG... Remove this comment to see the full error message
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator.js';
// @ts-expect-error TS(2307): Cannot find module '../migrations/migrations/143-p... Remove this comment to see the full error message
import { EntitySchema } from '../migrations/migrations/143-parse-numeric-fields/types.js';

import { MetadataSchema } from 'shared/types/commonTypes.js';
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
