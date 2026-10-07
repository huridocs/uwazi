import { Db } from 'mongodb';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoPXEntityStatusesQueryService } from './MongoPXEntityStatusesQueryService.js';
import { PostgresPXEntityStatusesQueryService } from './postgresql/PostgresPXEntityStatusesQueryService.js';

type Props = {
  connection?: Db;
  transactionManager?: TransactionManager;
};

class PXEntityStatusesQueryServiceFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      const pgTransactionManager = ExecutionContext.getStore()
        ? ExecutionContext.postgresTransactionManager
        : TransactionManagerFactory.postgres();

      return new PostgresPXEntityStatusesQueryService({
        tenantId: tenant.name,
        pgTransactionManager,
      });
    }

    const transactionManager = props?.transactionManager || TransactionManagerFactory.mongo();
    return new MongoPXEntityStatusesQueryService(db, transactionManager);
  }
}

export { PXEntityStatusesQueryServiceFactory };
