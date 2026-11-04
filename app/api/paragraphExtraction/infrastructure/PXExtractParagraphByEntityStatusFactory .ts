import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';
import { PXExtractParagraphsByEntityStatus } from '../application/PXExtractParagraphsByEntityStatus.js';
import { PXExtractParagraphsFromEntitiesFactory } from './PXExtractParagraphsFromEntitiesFactory.js';

export class PXExtractParagraphsByEntityStatusFactory {
  static async createDefault() {
    const connection = getConnection();
    const { transactionManager } = ExecutionContext;

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager: transactionManager,
    });

    const extractParagraphsFromEntities =
      await PXExtractParagraphsFromEntitiesFactory.createDefault({
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
