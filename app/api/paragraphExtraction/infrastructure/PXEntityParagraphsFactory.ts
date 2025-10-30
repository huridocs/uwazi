import { Db } from 'mongodb';

import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';

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
