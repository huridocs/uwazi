import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { PXDeleteExtractor } from '../application/PXDeleteExtractor';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

export class PXDeleteExtractorFactory {
  static createDefault() {
    const connection = getConnection();
    const mongoTransactionManager = DefaultTransactionManager();

    return new PXDeleteExtractor({
      extractorsDS: PXExtractorsDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      }),
      transactionManager: mongoTransactionManager,
    });
  }
}
