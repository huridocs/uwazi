import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';

import { PXCreateParagraphs } from '../application/PXCreateParagraphs';
import { MongoPXExtractorsDataSource } from './MongoPXExtractorsDataSource';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';

export class PXCreateParagraphsFactory {
  static createDefault() {
    const connection = getConnection();
    const mongoTransactionManager = DefaultTransactionManager();

    const extractorsDS = new MongoPXExtractorsDataSource(connection, mongoTransactionManager);
    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    return new PXCreateParagraphs({
      extractorsDS,
      entitiesStatusDS,
    });
  }
}
