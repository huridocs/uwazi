import { Db } from 'mongodb';

import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';

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
