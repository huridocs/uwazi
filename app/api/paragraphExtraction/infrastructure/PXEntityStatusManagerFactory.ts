import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';
import { PXEntityStatusManager } from '../application/PXEntityStatusManager.js';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory.js';

export class PXEntityStatusManagerFactory {
  static createDefault() {
    const connection = getConnection();
    const { transactionManager } = ExecutionContext;

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
    const entitiesDS = EntitiesDataSourceFactory.default();

    return new PXEntityStatusManager({
      entitiesStatusDS,
      extractorsDS,
      settingsDS,
      entitiesDS,
      filesDS,
    });
  }
}
