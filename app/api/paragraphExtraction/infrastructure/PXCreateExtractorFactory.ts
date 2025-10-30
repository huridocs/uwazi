import { MongoIdHandler } from 'api/core/infrastructure/mongodb/common/MongoIdGenerator';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
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
    const mongoTransactionManager = TransactionManagerFactory.default();

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
      templatesDS: TemplatesDataSourceFactory.default(mongoTransactionManager),
      transactionManager: mongoTransactionManager,
      dispatcher,
    });
  }
}
