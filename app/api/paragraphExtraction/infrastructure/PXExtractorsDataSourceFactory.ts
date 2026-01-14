import { Db } from 'mongodb';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

import { MongoTransactionManager } from '#api/common.v2/database/MongoTransactionManager.js';
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
