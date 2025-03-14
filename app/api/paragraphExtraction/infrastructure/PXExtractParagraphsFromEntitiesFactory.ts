import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultDispatcher } from 'api/queue.v2/configuration/factories';

import { PXExtractParagraphsFromEntities } from '../application/PXExtractParagraphFromEntities';
import { MongoPXExtractionsDataSource } from './MongoPXExtractionsDataSource';

export class PXExtractParagraphsFromEntitiesFactory {
  static async createDefault(tenantName: string) {
    const db = getConnection();
    const transactionManager = DefaultTransactionManager();

    const extractionsDS = new MongoPXExtractionsDataSource(db, transactionManager);

    const dispatcher = await DefaultDispatcher(tenantName, { lockWindow: 1000 * 60 });

    return new PXExtractParagraphsFromEntities({
      extractionsDS,
      dispatcher,
      tenantName,
    });
  }
}
