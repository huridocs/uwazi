import { Db } from 'mongodb';

// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/configuration/fact... Remove this comment to see the full error message
import { DefaultDispatcher } from '../queue.v2/configuration/factories.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoTra... Remove this comment to see the full error message
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager.js';

import { PXExtractParagraphsFromEntities } from '../application/PXExtractParagraphFromEntities';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';

type Props = {
  tenantName: string;
  connection?: Db;
  mongoTransactionManager?: MongoTransactionManager;
  entitiesStatusDS?: PXEntitiesStatusDataSource;
};

export class PXExtractParagraphsFromEntitiesFactory {
  static async createDefault(props: Props) {
    const connection = props.connection ?? getConnection();
    const mongoTransactionManager = props.mongoTransactionManager ?? DefaultTransactionManager();

    const entitiesStatusDS =
      props.entitiesStatusDS ??
      PXEntitiesStatusDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      });

    const dispatcher = await DefaultDispatcher(props.tenantName, { lockWindow: 1000 * 60 });

    return new PXExtractParagraphsFromEntities({
      entitiesStatusDS,
      dispatcher,
      tenantName: props.tenantName,
    });
  }
}
