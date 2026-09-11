import { Db } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';

import { PXGetExtractorStatuses } from '../application/PXGetExtractorStatuses.js';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory.js';

type Props = {
  connection?: Db;
  mongoTransactionManager?: TransactionManager;
};

export class PXExtractorsStatusesFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const transactionManager = props?.mongoTransactionManager || TransactionManagerFactory.mongo();

    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection: db,
      transactionManager,
    });

    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const filesDS = FilesDataSourceFactory.default({ transactionManager });

    return new PXGetExtractorStatuses({ extractorsQueryService, settingsDS, filesDS });
  }
}
