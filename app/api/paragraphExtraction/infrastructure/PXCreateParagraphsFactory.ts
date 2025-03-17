import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';

import { PXCreateParagraphs } from '../application/PXCreateParagraphs';
import { MongoPXExtractorsDataSource } from './MongoPXExtractorsDataSource';
import { MongoPXEntitiesStatusDataSource } from './MongoPXEntitiesStatusDataSource';

export class PXCreateParagraphsFactory {
  static createDefault() {
    const db = getConnection();
    const transactionManager = DefaultTransactionManager();
    const extractorsDS = new MongoPXExtractorsDataSource(db, transactionManager);
    const entitiesStatusDS = new MongoPXEntitiesStatusDataSource(db, transactionManager);

    return new PXCreateParagraphs({
      extractorsDS,
      entitiesStatusDS,
    });
  }
}
