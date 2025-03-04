import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';

import { MongoPXExtractorsQueryService } from './MongoPXExtractorsQueryService';

export class PXExtractorsQueryServiceFactory {
  static createDefault() {
    const db = getConnection();
    const transactionManager = DefaultTransactionManager();

    return new MongoPXExtractorsQueryService(db, transactionManager);
  }
}
