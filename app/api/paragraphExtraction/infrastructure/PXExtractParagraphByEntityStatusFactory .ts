import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';

import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXExtractParagraphsByEntityStatus } from '../application/PXExtractParagraphsByEntityStatus';
import { PXExtractParagraphsFromEntitiesFactory } from './PXExtractParagraphsFromEntitiesFactory';

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
