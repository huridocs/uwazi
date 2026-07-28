import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { RelationshipType } from '#api/core/domain/relationshipType/RelationshipType.js';
import { RelationshipTypeDBO } from '../schemas/RelationshipTypeDBO.js';

const mapRelationshipTypeToApp = (relationshipType: RelationshipTypeDBO): RelationshipType =>
  new RelationshipType(MongoIdHandler.mapToApp(relationshipType._id), relationshipType.name);

export { mapRelationshipTypeToApp };
