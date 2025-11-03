import { MongoIdHandler } from 'api/core/infrastructure/mongodb/common/MongoIdGenerator';
import { RelationshipType } from 'api/relationshiptypes.v2/model/RelationshipType';
import { RelationshipTypeDBO } from '../schemas/RelationshipTypeDBO';

const mapRelationshipTypeToApp = (relationshipType: RelationshipTypeDBO): RelationshipType =>
  new RelationshipType(MongoIdHandler.mapToApp(relationshipType._id), relationshipType.name);

export { mapRelationshipTypeToApp };
