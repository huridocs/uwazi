import { Db } from 'mongodb';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoPXExtractorsDataSource } from '#api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource.js';
import { PXExtractorsQueryServiceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory.js';
import { PXExtractorsQueryService } from '#api/paragraphExtraction/domain/PXExtractorsQueryService.js';

type Props = {
  connection?: Db;
  mongoTransactionManager?: MongoTransactionManager;
  extractorsQueryService?: PXExtractorsQueryService;
};

export class PXExtractorsDataSourceFactory {
  static createDefault(props: Props) {
    const connection = props.connection ?? getConnection();
    const mongoTransactionManager =
      props.mongoTransactionManager ?? TransactionManagerFactory.default();

    const extractorsQueryService =
      props.extractorsQueryService ??
      PXExtractorsQueryServiceFactory.createDefault({
        connection,
        transactionManager: mongoTransactionManager,
      });

    return new MongoPXExtractorsDataSource(
      connection,
      mongoTransactionManager,
      extractorsQueryService
    );
  }
}
