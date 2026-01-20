import { Db } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

import { PXGetEntityParagraphs } from '#api/paragraphExtraction/application/PXGetEntityParagraphs.js';
import { PXExtractorsQueryServiceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory.js';
import { PXExtractorsDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsDataSourceFactory.js';

type Props = {
  connection?: Db;
  mongoTransactionManager?: MongoTransactionManager;
};

export class PXEntityParagraphsFactory {
  static createDefault(props?: Props) {
    const connection = props?.connection || getConnection();
    const mongoTransactionManager =
      props?.mongoTransactionManager || TransactionManagerFactory.default();

    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection,
      transactionManager: mongoTransactionManager,
    });

    const settingsDS = SettingsDataSourceFactory.default(mongoTransactionManager);
    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
      extractorsQueryService,
    });

    return new PXGetEntityParagraphs({ extractorsQueryService, settingsDS, extractorsDS });
  }
}
