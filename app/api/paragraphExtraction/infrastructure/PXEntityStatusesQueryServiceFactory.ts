import { Db } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoPXEntityStatusesQueryService } from '#api/paragraphExtraction/infrastructure/MongoPXEntityStatusesQueryService.js';

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
