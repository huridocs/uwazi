import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { UwaziDispatcherFactory } from '#api/core/infrastructure/jobs/UwaziDispatcherFactory.js';
import { RelationshipTypesDataSourceFactory } from '#api/core/infrastructure/factories/RelationshipTypesDataSourceFactory.js';

import { PXCreateExtractor } from '../application/PXCreateExtractor.js';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory.js';

interface PXCreateExtractorFactoryProps {
  tenantName: string;
}

export class PXCreateExtractorFactory {
  static async createDefault(props: PXCreateExtractorFactoryProps) {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();

    const dispatcher = UwaziDispatcherFactory(props.tenantName, mongoTransactionManager, {
      lockWindow: 1000 * 60,
    });
    const relationshipTypeDS = RelationshipTypesDataSourceFactory.default({
      transactionManager: mongoTransactionManager,
    });

    return new PXCreateExtractor({
      relationshipTypeDS,
      extractorDS: PXExtractorsDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      }),
      idGenerator: MongoIdHandler,
      templatesDS: TemplatesDataSourceFactory.default({
        transactionManager: mongoTransactionManager,
      }),
      transactionManager: mongoTransactionManager,
      dispatcher,
    });
  }
}
