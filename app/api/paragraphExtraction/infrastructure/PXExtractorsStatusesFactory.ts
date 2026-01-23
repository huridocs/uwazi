import { Db } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';

import { PXGetExtractorStatuses } from '#api/paragraphExtraction/application/PXGetExtractorStatuses.js';
import { PXExtractorsQueryServiceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';

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
