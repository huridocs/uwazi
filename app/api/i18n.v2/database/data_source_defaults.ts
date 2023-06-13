import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { MongoTranslationsDataSource } from './MongoTranslationsDataSource';

const DefaultTranslationsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoTranslationsDataSource(
    db,
    DefaultSettingsDataSource(transactionManager),
    transactionManager
  );
};

export { DefaultTranslationsDataSource };
