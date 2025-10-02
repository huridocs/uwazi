import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import relationshipTypeDS from 'api/relationtypes';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';

import { PXCreateExtractor } from '../application/PXCreateExtractor';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

interface PXCreateExtractorFactoryProps {
  tenantName: string;
}

export class PXCreateExtractorFactory {
  static async createDefault(props: PXCreateExtractorFactoryProps) {
    const connection = getConnection();
    const mongoTransactionManager = DefaultTransactionManager();

    const dispatcher = await DefaultDispatcher(props.tenantName, {
      lockWindow: 1000 * 60,
    });

    return new PXCreateExtractor({
      relationshipTypeDS,
      extractorDS: PXExtractorsDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      }),
      idGenerator: MongoIdHandler,
      templatesDS: DefaultTemplatesDataSource(mongoTransactionManager),
      transactionManager: mongoTransactionManager,
      dispatcher,
    });
  }
}
