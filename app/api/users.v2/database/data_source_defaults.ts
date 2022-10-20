import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoUserDataSource } from './MongoUserDataSource';

const DefaultUserDataSource = () => {
  const db = getConnection();
  return new MongoUserDataSource(db);
};

export { DefaultUserDataSource };
