import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';

import { PXCreateParagraphs } from '../application/PXCreateParagraphs';
import { MongoPXExtractorsDataSource } from './MongoPXExtractorsDataSource';

export class PXCreateParagraphsFactory {
  static createDefault() {
    const db = getConnection();
    const transactionManager = DefaultTransactionManager();

    return new PXCreateParagraphs({
      extractorsDS: new MongoPXExtractorsDataSource(db, transactionManager),
      idGenerator: MongoIdHandler,
    });
  }
}
