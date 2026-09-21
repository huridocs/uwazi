import { Db } from 'mongodb';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoPXEntityStatusesQueryService } from './MongoPXEntityStatusesQueryService.js';

type Props = {
  connection?: Db;
  transactionManager?: TransactionManager;
};

class PXEntityStatusesQueryServiceFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const transactionManager =
      props?.transactionManager || ExecutionContext.mongoTransactionManager;
    return new MongoPXEntityStatusesQueryService(db, transactionManager);
  }
}

export { PXEntityStatusesQueryServiceFactory };
