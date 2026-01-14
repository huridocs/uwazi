import { MongoIdHandler } from '#api/common.v2/database/MongoIdGenerator.js';

import { DefaultTemplatesDataSource } from '#api/templates.v2/database/data_source_defaults.js';

import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import relationshipTypeDS from '../relationtypes.js';

import { DefaultDispatcher } from '../queue.v2/configuration/factories.js';

import { PXCreateExtractor } from '../application/PXCreateExtractor';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

interface PXCreateExtractorFactoryProps {
  tenantName: string;
}

export class PXCreateExtractorFactory {
  static async createDefault(props: PXCreateExtractorFactoryProps) {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();

    const dispatcher = DefaultDispatcher(props.tenantName, mongoTransactionManager, {
      lockWindow: 1000 * 60,
    });

    return new PXCreateExtractor({
      relationshipTypeDS,
      extractorDS: PXExtractorsDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      }),
      idGenerator: MongoIdHandler,
      templatesDS: TemplatesDataSourceFactory.default(mongoTransactionManager),
      transactionManager: mongoTransactionManager,
      dispatcher,
    });
  }
}
