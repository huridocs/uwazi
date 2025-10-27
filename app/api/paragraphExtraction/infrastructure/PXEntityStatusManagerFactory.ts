import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoSettingsDataSourceFactory } from 'api/core/infrastructure/factories/MongoSettingsDataSource';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';

import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
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

    const settingsDS = MongoSettingsDataSourceFactory.default(mongoTransactionManager);

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
