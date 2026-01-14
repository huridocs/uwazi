import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

import { PXCreateParagraphs } from '../application/PXCreateParagraphs';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

export class PXCreateParagraphsFactory {
  static createDefault() {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();

    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

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
