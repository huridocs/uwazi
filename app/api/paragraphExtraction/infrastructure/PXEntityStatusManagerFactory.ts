import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

import { DefaultDeprecatedEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';
import { PXEntityStatusManager } from '../application/PXEntityStatusManager.js';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory.js';

export class PXEntityStatusManagerFactory {
  static createDefault() {
    const connection = getConnection();
    const transactionManager = ExecutionContext.getStore()
      ? ExecutionContext.transactionManager
      : TransactionManagerFactory.default();
    const mongoTransactionManager = TransactionManagerFactory.mongo();

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager: transactionManager,
    });

    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager: transactionManager,
    });

    const settingsDS = SettingsDataSourceFactory.default({
      transactionManager,
    });

    const filesDS = FilesDataSourceFactory.default({ transactionManager });
    // Legacy V1 entities read path; kept on Mongo while PX moves its own persistence.
    const entitiesDS = DefaultDeprecatedEntitiesDataSource(mongoTransactionManager);

    return new PXEntityStatusManager({
      entitiesStatusDS,
      extractorsDS,
      settingsDS,
      entitiesDS,
      filesDS,
    });
  }
}
