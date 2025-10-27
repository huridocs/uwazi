import { Db } from 'mongodb';

import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';

import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoPXExtractorsDataSource } from './MongoPXExtractorsDataSource';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory';
import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';

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
