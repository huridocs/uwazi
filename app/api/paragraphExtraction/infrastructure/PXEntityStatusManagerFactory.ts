import { DefaultTransactionManager } from '../common.v2/database/data_source_defaults.js';
import { getConnection } from '../common.v2/database/getConnectionForCurrentTenant.js';
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';
import { DefaultFilesDataSource } from '../files.v2/database/data_source_defaults.js';

import { DefaultEntitiesDataSource } from '../entities.v2/database/data_source_defaults.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXEntityStatusManager } from '../application/PXEntityStatusManager';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

export class PXEntityStatusManagerFactory {
  static createDefault() {
    const connection = getConnection();
    const mongoTransactionManager = DefaultTransactionManager();

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const settingsDS = DefaultSettingsDataSource(mongoTransactionManager);

    const filesDS = DefaultFilesDataSource(mongoTransactionManager);
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
