// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoIdG... Remove this comment to see the full error message
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator.js';
// @ts-expect-error TS(2307): Cannot find module '../relationshiptypes.v2/model/... Remove this comment to see the full error message
import { RelationshipType } from 'api/relationshiptypes.v2/model/RelationshipType.js';
import { RelationshipTypeDBO } from '../schemas/RelationshipTypeDBO';

const mapRelationshipTypeToApp = (relationshipType: RelationshipTypeDBO): RelationshipType =>
  new RelationshipType(MongoIdHandler.mapToApp(relationshipType._id), relationshipType.name);

export { mapRelationshipTypeToApp };
