import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTemplatesDataSource } from './MongoTemplatesDataSource';

const DefaultTemplatesDataSource = () => {
  const db = getConnection();
  return new MongoTemplatesDataSource(db);
};

export { DefaultTemplatesDataSource };
