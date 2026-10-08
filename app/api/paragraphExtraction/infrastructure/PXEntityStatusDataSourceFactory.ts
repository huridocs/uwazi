import { Db } from 'mongodb';

import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

import { MongoPXEntitiesStatusDataSource } from './MongoPXEntitiesStatusDataSource.js';
import { PostgresPXEntitiesStatusDataSource } from './postgresql/PostgresPXEntitiesStatusDataSource.js';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory.js';

type Props = {
  connection: Db;
  mongoTransactionManager: TransactionManager;
};

export class PXEntitiesStatusDataSourceFactory {
  static createDefault(props: Props) {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      const pgTransactionManager = ExecutionContext.postgresTransactionManager;

      return new PostgresPXEntitiesStatusDataSource({
        tenantId: tenant.name,
        pgTransactionManager,
      });
    }

    const settingsDS = SettingsDataSourceFactory.default({
      transactionManager: props.mongoTransactionManager,
    });
    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection: props.connection,
      transactionManager: props.mongoTransactionManager,
    });

    return new MongoPXEntitiesStatusDataSource(
      props.connection,
      props.mongoTransactionManager,
      settingsDS,
      extractorsQueryService
    );
  }
}
