import { Db } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

import { PXGetEntityParagraphs } from '../application/PXGetEntityParagraphs.js';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory.js';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory.js';

type Props = {
  connection?: Db;
  mongoTransactionManager?: TransactionManager;
};

export class PXEntityParagraphsFactory {
  static createDefault(props?: Props) {
    const connection = props?.connection || getConnection();
    const transactionManager =
      props?.mongoTransactionManager ?? ExecutionContext.transactionManager;

    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection,
      transactionManager,
    });

    const settingsDS = SettingsDataSourceFactory.default({
      transactionManager,
    });
    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager: transactionManager,
      extractorsQueryService,
    });

    return new PXGetEntityParagraphs({ extractorsQueryService, settingsDS, extractorsDS });
  }
}
