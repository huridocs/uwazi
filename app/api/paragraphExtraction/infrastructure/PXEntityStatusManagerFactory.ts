import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';
import { PXEntitiesStatusDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory.js';
import { PXEntityStatusManager } from '#api/paragraphExtraction/application/PXEntityStatusManager.js';
import { PXExtractorsDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';

export class PXEntityStatusManagerFactory {
  static createDefault() {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const settingsDS = SettingsDataSourceFactory.default(mongoTransactionManager);

    const filesDS = FilesDataSourceFactory.default(mongoTransactionManager);
    const entitiesDS = DefaultEntitiesDataSource(mongoTransactionManager);

    return new PXEntityStatusManager({
      entitiesStatusDS,
      extractorsDS,
      settingsDS,
      entitiesDS,
      filesDS,
    });
  }
}
