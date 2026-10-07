import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PXDeleteExtractor } from '../application/PXDeleteExtractor.js';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory.js';

export class PXDeleteExtractorFactory {
  static createDefault() {
    const connection = getConnection();
    const transactionManager = ExecutionContext.getStore()
      ? ExecutionContext.transactionManager
      : TransactionManagerFactory.default();

    return new PXDeleteExtractor({
      extractorsDS: PXExtractorsDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager: transactionManager,
      }),
      transactionManager,
    });
  }
}
