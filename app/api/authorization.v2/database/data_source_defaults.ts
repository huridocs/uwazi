import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoPermissionsDataSource } from './MongoPermissionsDataSource';

const DefaultPermissionsDataSource = () => {
  const connection = getConnection();
  return new MongoPermissionsDataSource(connection);
};

export { DefaultPermissionsDataSource };
