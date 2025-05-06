import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';

import { IXSaveLabeledData } from '../application/IXSaveLabeledData';
import { MongoIXExtractorsDataSource } from './MongoIXExtractorsDataSource';

export class IXSaveLabeledDataFactory {
  static createDefault() {
    const connection = getConnection();
    const mongoTransactionManager = DefaultTransactionManager();

    return new IXSaveLabeledData({
      entityDS: DefaultEntitiesDataSource(mongoTransactionManager),
      filesDS: DefaultFilesDataSource(mongoTransactionManager),
      templatesDS: DefaultTemplatesDataSource(mongoTransactionManager),
      extractorsDS: new MongoIXExtractorsDataSource(connection, mongoTransactionManager),
    });
  }
}
