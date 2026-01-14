import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

import { DefaultFilesDataSource } from '#api/files.v2/database/data_source_defaults.js';

import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXEntityStatusManager } from '#api/paragraphExtraction/application/PXEntityStatusManager';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

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
