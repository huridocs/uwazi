import { Db } from 'mongodb';

import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoSettingsDataSourceFactory } from 'api/core/infrastructure/factories/MongoSettingsDataSource';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';

import { PXGetExtractorStatuses } from '../application/PXGetExtractorStatuses';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory';

type Props = {
  connection?: Db;
  mongoTransactionManager?: MongoTransactionManager;
};

export class PXExtractorsStatusesFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const transactionManager = props?.mongoTransactionManager || DefaultTransactionManager();

    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection: db,
      transactionManager,
    });

    const settingsDS = MongoSettingsDataSourceFactory.default(transactionManager);
    const filesDS = DefaultFilesDataSource(transactionManager);

    return new PXGetExtractorStatuses({ extractorsQueryService, settingsDS, filesDS });
  }
}
