import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoEntitiesDataSource } from './MongoEntitiesDataSource';

const DefaultEntitiesDataSource = () => {
  const db = getConnection();
  return new MongoEntitiesDataSource(db, new MongoSettingsDataSource(db));
};

export { DefaultEntitiesDataSource };
