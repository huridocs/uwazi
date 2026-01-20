import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';
import { PXDeleteExtractor } from '#api/paragraphExtraction/application/PXDeleteExtractor.js';
import { PXExtractorsDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsDataSourceFactory.js';

export class PXDeleteExtractorFactory {
  static createDefault() {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();

    return new PXDeleteExtractor({
      extractorsDS: PXExtractorsDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      }),
      transactionManager: mongoTransactionManager,
    });
  }
}
