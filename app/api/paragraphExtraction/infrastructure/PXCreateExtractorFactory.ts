import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import relationshipTypeDS from '#api/relationtypes/index.js';

import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';

import { PXCreateExtractor } from '#api/paragraphExtraction/application/PXCreateExtractor.js';
import { PXExtractorsDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';

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
