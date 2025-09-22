import { Db } from 'mongodb';

import { getConnection } from '../common.v2/database/getConnectionForCurrentTenant.js';
import { DefaultTransactionManager } from '../common.v2/database/data_source_defaults.js';
import { MongoTransactionManager } from '../common.v2/database/MongoTransactionManager.js';
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';

import { PXGetEntityParagraphs } from '../application/PXGetEntityParagraphs';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

type Props = {
  connection?: Db;
  mongoTransactionManager?: MongoTransactionManager;
};

export class PXEntityParagraphsFactory {
  static createDefault(props?: Props) {
    const connection = props?.connection || getConnection();
    const mongoTransactionManager = props?.mongoTransactionManager || DefaultTransactionManager();

    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection,
      transactionManager: mongoTransactionManager,
    });

    const settingsDS = DefaultSettingsDataSource(mongoTransactionManager);
    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
      extractorsQueryService,
    });

    return new PXGetEntityParagraphs({ extractorsQueryService, settingsDS, extractorsDS });
  }
}
