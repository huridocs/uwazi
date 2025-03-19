import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import relationshipTypeDS from 'api/relationtypes';

import { PXCreateExtractor } from '../application/PXCreateExtractor';
import { MongoPXExtractorsDataSource } from './MongoPXExtractorsDataSource';

export class PXCreateExtractorFactory {
  static createDefault() {
    const db = getConnection();
    const transactionManager = DefaultTransactionManager();

    return new PXCreateExtractor({
      relationshipTypeDS,
      extractorDS: new MongoPXExtractorsDataSource(db, transactionManager),
      idGenerator: MongoIdHandler,
      templatesDS: DefaultTemplatesDataSource(transactionManager),
    });
  }
}
