import { Db } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';

import { MongoPXExtractorsQueryService } from './MongoPXExtractorsQueryService.js';

type Props = {
  connection?: Db;
  transactionManager?: MongoTransactionManager;
};

export class PXExtractorsQueryServiceFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const transactionManager = props?.transactionManager || TransactionManagerFactory.default();

    return new MongoPXExtractorsQueryService(db, transactionManager);
  }
}
