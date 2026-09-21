import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';

import { DefaultDeprecatedEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';
import { PXEntityStatusManager } from '../application/PXEntityStatusManager.js';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory.js';

export class PXEntityStatusManagerFactory {
  static createDefault() {
    const connection = getConnection();
    const { mongoTransactionManager } = ExecutionContext;

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const settingsDS = SettingsDataSourceFactory.default({
      transactionManager: mongoTransactionManager,
    });

    const filesDS = FilesDataSourceFactory.default({ transactionManager: mongoTransactionManager });
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
