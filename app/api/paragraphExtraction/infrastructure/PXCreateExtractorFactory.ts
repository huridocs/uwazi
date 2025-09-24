// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoIdG... Remove this comment to see the full error message
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/database/data_... Remove this comment to see the full error message
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../relationtypes.js' or its co... Remove this comment to see the full error message
import relationshipTypeDS from '../relationtypes.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/configuration/fact... Remove this comment to see the full error message
import { DefaultDispatcher } from '../queue.v2/configuration/factories.js';

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
