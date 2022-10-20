import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoRelationshipsDataSource } from './MongoRelationshipsDataSource';

const DefaultRelationshipsDataSource = () => {
  const connection = getConnection();
  return new MongoRelationshipsDataSource(connection);
};

export { DefaultRelationshipsDataSource as DefaultRelationshipDataSource };
