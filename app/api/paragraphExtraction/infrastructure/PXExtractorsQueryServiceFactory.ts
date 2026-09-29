import { Db } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

import { MongoPXExtractorsQueryService } from './MongoPXExtractorsQueryService.js';

type Props = {
  connection?: Db;
  transactionManager?: TransactionManager;
};

export class PXExtractorsQueryServiceFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const transactionManager = props?.transactionManager || TransactionManagerFactory.mongo();

    return new MongoPXExtractorsQueryService(db, transactionManager);
  }
}
