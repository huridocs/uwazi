import { Db } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

import { MongoPXExtractorsQueryService } from './MongoPXExtractorsQueryService.js';
import { PostgresPXExtractorsQueryService } from './postgresql/PostgresPXExtractorsQueryService.js';

type Props = {
  connection?: Db;
  transactionManager?: TransactionManager;
};

export class PXExtractorsQueryServiceFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      const pgTransactionManager = ExecutionContext.postgresTransactionManager;

      return new PostgresPXExtractorsQueryService({
        tenantId: tenant.name,
        pgTransactionManager,
      });
    }

    const transactionManager = props?.transactionManager ?? ExecutionContext.transactionManager;
    return new MongoPXExtractorsQueryService(db, transactionManager);
  }
}
