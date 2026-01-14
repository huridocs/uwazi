import { Db } from 'mongodb';

import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { MongoTransactionManager } from '#api/common.v2/database/MongoTransactionManager.js';
import { MongoPXEntityStatusesQueryService } from './MongoPXEntityStatusesQueryService';

type Props = {
  connection?: Db;
  transactionManager?: MongoTransactionManager;
};

class PXEntityStatusesQueryServiceFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const transactionManager = props?.transactionManager || TransactionManagerFactory.default();
    return new MongoPXEntityStatusesQueryService(db, transactionManager);
  }
}

export { PXEntityStatusesQueryServiceFactory };
