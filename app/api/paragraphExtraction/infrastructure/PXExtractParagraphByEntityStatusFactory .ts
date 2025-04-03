import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';

import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXExtractParagraphsByEntityStatus } from '../application/PXExtractParagraphsByEntityStatus';
import { PXExtractParagraphsFromEntitiesFactory } from './PXExtractParagraphsFromEntitiesFactory';

type Props = {
  tenantName: string;
};

export class PXExtractParagraphsByEntityStatusFactory {
  static async createDefault({ tenantName }: Props) {
    const connection = getConnection();
    const mongoTransactionManager = DefaultTransactionManager();

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
