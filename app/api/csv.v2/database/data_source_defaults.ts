import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoCsvImportsDataSource } from './MongoCsvImportsDataSource';

const DefaultCsvImportsDataSource = () => {
  const db = getConnection();
  return new MongoCsvImportsDataSource(db);
};

export { DefaultCsvImportsDataSource };
