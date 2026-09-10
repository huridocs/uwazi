import { Db } from 'mongodb';

import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';

import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoPXExtractorsDataSource } from './MongoPXExtractorsDataSource.js';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory.js';
import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService.js';

type Props = {
  connection?: Db;
  mongoTransactionManager?: TransactionManager;
  extractorsQueryService?: PXExtractorsQueryService;
};

export class PXExtractorsDataSourceFactory {
  static createDefault(props: Props) {
    const connection = props.connection ?? getConnection();
    const mongoTransactionManager =
      props.mongoTransactionManager ?? TransactionManagerFactory.mongo();

    const extractorsQueryService =
      props.extractorsQueryService ??
      PXExtractorsQueryServiceFactory.createDefault({
        connection,
        transactionManager: mongoTransactionManager,
      });

    const templatesDAO = TemplatesDAOFactory.default();

    return new MongoPXExtractorsDataSource(
      connection,
      mongoTransactionManager,
      extractorsQueryService,
      templatesDAO
    );
  }
}
