import { Db } from 'mongodb';

import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { MongoTransactionManager } from '#api/common.v2/database/MongoTransactionManager.js';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

import { DefaultFilesDataSource } from '../files.v2/database/data_source_defaults.js';

import { PXGetExtractorStatuses } from '../application/PXGetExtractorStatuses';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory';

type Props = {
  connection?: Db;
  mongoTransactionManager?: MongoTransactionManager;
};

export class PXExtractorsStatusesFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const transactionManager =
      props?.mongoTransactionManager || TransactionManagerFactory.default();

    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection: db,
      transactionManager,
    });

    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const filesDS = FilesDataSourceFactory.default(transactionManager);

    return new PXGetExtractorStatuses({ extractorsQueryService, settingsDS, filesDS });
  }
}
