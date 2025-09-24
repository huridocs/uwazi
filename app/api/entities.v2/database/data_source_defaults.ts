// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoTra... Remove this comment to see the full error message
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/database/data_s... Remove this comment to see the full error message
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/database/data_... Remove this comment to see the full error message
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults.js';
import { MongoEntitiesDataSource } from './MongoEntitiesDataSource';

const DefaultEntitiesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoEntitiesDataSource(
    db,
    DefaultTemplatesDataSource(transactionManager),
    DefaultSettingsDataSource(transactionManager),
    transactionManager
  );
};

export { DefaultEntitiesDataSource };
