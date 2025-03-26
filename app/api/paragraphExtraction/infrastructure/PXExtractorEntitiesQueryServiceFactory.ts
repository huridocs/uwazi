import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';

import { MongoPXExtractorEntitiesQueryService } from './MongoPXExtractorEntitiesQueryService';

export class PXExtractorEntitiesQueryServiceFactory {
  static createDefault() {
    const db = getConnection();
    const transactionManager = DefaultTransactionManager();

    return new MongoPXExtractorEntitiesQueryService(db, transactionManager);
  }
}
