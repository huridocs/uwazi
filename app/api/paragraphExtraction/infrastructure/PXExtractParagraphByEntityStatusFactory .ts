import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

import { PXEntitiesStatusDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory.js';
import { PXExtractParagraphsByEntityStatus } from '#api/paragraphExtraction/application/PXExtractParagraphsByEntityStatus.js';
import { PXExtractParagraphsFromEntitiesFactory } from '#api/paragraphExtraction/infrastructure/PXExtractParagraphsFromEntitiesFactory.js';

type Props = {
  tenantName: string;
};

export class PXExtractParagraphsByEntityStatusFactory {
  static async createDefault({ tenantName }: Props) {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const extractParagraphsFromEntities =
      await PXExtractParagraphsFromEntitiesFactory.createDefault({
        tenantName,
        connection,
        entitiesStatusDS,
        mongoTransactionManager,
      });

    return new PXExtractParagraphsByEntityStatus({
      entitiesStatusDS,
      extractParagraphsFromEntities,
    });
  }
}
