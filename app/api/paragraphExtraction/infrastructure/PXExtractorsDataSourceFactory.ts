import { Db } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoPXExtractorsDataSource } from './MongoPXExtractorsDataSource.js';
import { PostgresPXExtractorsDataSource } from './postgresql/PostgresPXExtractorsDataSource.js';
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
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      const pgTransactionManager = ExecutionContext.postgresTransactionManager;

      const extractorsQueryService =
        props.extractorsQueryService ??
        PXExtractorsQueryServiceFactory.createDefault({ connection });

      return new PostgresPXExtractorsDataSource({
        tenantId: tenant.name,
        pgTransactionManager,
        extractorsQueryService,
        templatesDAO: TemplatesDAOFactory.default(),
      });
    }

    const mongoTransactionManager =
      props.mongoTransactionManager ?? ExecutionContext.transactionManager;

    const extractorsQueryService =
      props.extractorsQueryService ??
      PXExtractorsQueryServiceFactory.createDefault({
        connection,
        transactionManager: mongoTransactionManager,
      });

    return new MongoPXExtractorsDataSource(
      connection,
      mongoTransactionManager,
      extractorsQueryService,
      TemplatesDAOFactory.default()
    );
  }
}
