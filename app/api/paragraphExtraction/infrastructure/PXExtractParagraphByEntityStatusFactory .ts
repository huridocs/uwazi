import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';
import { PXExtractParagraphsByEntityStatus } from '../application/PXExtractParagraphsByEntityStatus.js';
import { PXExtractParagraphsFromEntitiesFactory } from './PXExtractParagraphsFromEntitiesFactory.js';

type Props = {
  tenantName: string;
};

export class PXExtractParagraphsByEntityStatusFactory {
  static async createDefault({ tenantName }: Props) {
    const connection = getConnection();
    const transactionManager = ExecutionContext.getStore()
      ? ExecutionContext.transactionManager
      : TransactionManagerFactory.default();

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager: transactionManager,
    });

    const extractParagraphsFromEntities =
      await PXExtractParagraphsFromEntitiesFactory.createDefault({
        tenantName,
        connection,
        entitiesStatusDS,
        mongoTransactionManager: transactionManager,
      });

    return new PXExtractParagraphsByEntityStatus({
      entitiesStatusDS,
      extractParagraphsFromEntities,
    });
  }
}
