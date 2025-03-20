import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';

import { PXCreateEntityStatus } from '../application/PXCreateEntityStatus';
import { MongoPXExtractorsDataSource } from './MongoPXExtractorsDataSource';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';

export class PXCreateEntityStatusFactory {
  static createDefault() {
    const connection = getConnection();
    const mongoTransactionManager = DefaultTransactionManager();

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const extractorsDS = new MongoPXExtractorsDataSource(connection, mongoTransactionManager);

    const filesDS = DefaultFilesDataSource(mongoTransactionManager);
    const settingsDS = DefaultSettingsDataSource(mongoTransactionManager);

    return new PXCreateEntityStatus({
      entitiesStatusDS,
      extractorsDS,
      filesDS,
      settingsDS,
    });
  }
}
