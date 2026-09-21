import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';
import { PXExtractParagraphsByEntityStatus } from '../application/PXExtractParagraphsByEntityStatus.js';
import { PXExtractParagraphsFromEntitiesFactory } from './PXExtractParagraphsFromEntitiesFactory.js';

type Props = {
  tenantName: string;
};

export class PXExtractParagraphsByEntityStatusFactory {
  static async createDefault({ tenantName }: Props) {
    const connection = getConnection();
    const { mongoTransactionManager } = ExecutionContext;

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
