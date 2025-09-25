
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator.js';

import { RelationshipType } from 'api/relationshiptypes.v2/model/RelationshipType.js';
import { RelationshipTypeDBO } from '../schemas/RelationshipTypeDBO';

const mapRelationshipTypeToApp = (relationshipType: RelationshipTypeDBO): RelationshipType =>
  new RelationshipType(MongoIdHandler.mapToApp(relationshipType._id), relationshipType.name);

export { mapRelationshipTypeToApp };
