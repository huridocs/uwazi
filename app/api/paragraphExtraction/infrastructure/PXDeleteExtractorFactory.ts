import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PXDeleteExtractor } from '../application/PXDeleteExtractor.js';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory.js';

export class PXDeleteExtractorFactory {
  static createDefault() {
    const connection = getConnection();
    const { transactionManager } = ExecutionContext;

    return new PXDeleteExtractor({
      extractorsDS: PXExtractorsDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager: transactionManager,
      }),
      transactionManager,
    });
  }
}
