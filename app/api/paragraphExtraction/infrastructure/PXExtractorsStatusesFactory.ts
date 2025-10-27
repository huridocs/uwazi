import { Db } from 'mongodb';

import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
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
    const transactionManager =
      props?.mongoTransactionManager || TransactionManagerFactory.default();

    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection: db,
      transactionManager,
    });

    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const filesDS = DefaultFilesDataSource(transactionManager);

    return new PXGetExtractorStatuses({ extractorsQueryService, settingsDS, filesDS });
  }
}
