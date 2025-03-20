import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultDispatcher } from 'api/queue.v2/configuration/factories';

import { PXExtractParagraphsFromEntities } from '../application/PXExtractParagraphFromEntities';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';

export class PXExtractParagraphsFromEntitiesFactory {
  static async createDefault(tenantName: string) {
    const connection = getConnection();
    const mongoTransactionManager = DefaultTransactionManager();

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const dispatcher = await DefaultDispatcher(tenantName, { lockWindow: 1000 * 60 });

    return new PXExtractParagraphsFromEntities({
      entitiesStatusDS,
      dispatcher,
      tenantName,
    });
  }
}
