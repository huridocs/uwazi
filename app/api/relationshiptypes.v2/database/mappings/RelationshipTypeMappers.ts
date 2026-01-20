import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';

import { RelationshipType } from '#api/relationshiptypes.v2/model/RelationshipType.js';
import { RelationshipTypeDBO } from '#api/relationshiptypes.v2/database/schemas/RelationshipTypeDBO.js';

const mapRelationshipTypeToApp = (relationshipType: RelationshipTypeDBO): RelationshipType =>
  new RelationshipType(MongoIdHandler.mapToApp(relationshipType._id), relationshipType.name);

export { mapRelationshipTypeToApp };
