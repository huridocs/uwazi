import { MongoIdHandler } from '../common.v2/database/MongoIdGenerator.js';
import { RelationshipType } from '../relationshiptypes.v2/model/RelationshipType.js';
import { RelationshipTypeDBO } from '../schemas/RelationshipTypeDBO';

const mapRelationshipTypeToApp = (relationshipType: RelationshipTypeDBO): RelationshipType =>
  new RelationshipType(MongoIdHandler.mapToApp(relationshipType._id), relationshipType.name);

export { mapRelationshipTypeToApp };
