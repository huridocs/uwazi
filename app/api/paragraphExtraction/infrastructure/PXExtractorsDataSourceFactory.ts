import { Db } from 'mongodb';

import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTemplatesDAO } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDAO.js';
import { MongoPXExtractorsDataSource } from './MongoPXExtractorsDataSource.js';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory.js';
import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService.js';

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

    const templatesDAO = new MongoTemplatesDAO({
      db: connection,
      transactionManager: mongoTransactionManager,
    });

    return new MongoPXExtractorsDataSource(
      connection,
      mongoTransactionManager,
      extractorsQueryService,
      templatesDAO
    );
  }
}
