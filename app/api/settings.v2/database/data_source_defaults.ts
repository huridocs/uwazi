import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoSettingsDataSource } from './MongoSettingsDataSource';

const DefaultSettingsDataSource = () => {
  const db = getConnection();
  return new MongoSettingsDataSource(db);
};

export { DefaultSettingsDataSource };
