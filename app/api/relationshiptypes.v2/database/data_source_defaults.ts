import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoRelationshipTypesDataSource } from './MongoRelationshipTypesDataSource';

const DefaultRelationshipTypesDataSource = () => {
  const db = getConnection();
  return new MongoRelationshipTypesDataSource(db);
};

export { DefaultRelationshipTypesDataSource };
