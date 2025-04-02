import { Db } from 'mongodb';

import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';

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
      mongoTransactionManager,
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
