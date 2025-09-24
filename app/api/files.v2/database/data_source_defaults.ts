// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoTra... Remove this comment to see the full error message
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager.js';
import { MongoFilesDataSource } from './MongoFilesDataSource';

const DefaultFilesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  // @ts-expect-error TS(2554): Expected 0 arguments, but got 2.
  return new MongoFilesDataSource(db, transactionManager);
};

export { DefaultFilesDataSource };
