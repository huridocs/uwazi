import { Db } from 'mongodb';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

import { MongoPXExtractorsQueryService } from './MongoPXExtractorsQueryService.js';

type Props = {
  connection?: Db;
  transactionManager?: TransactionManager;
};

export class PXExtractorsQueryServiceFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const transactionManager =
      props?.transactionManager || ExecutionContext.mongoTransactionManager;

    return new MongoPXExtractorsQueryService(db, transactionManager);
  }
}
