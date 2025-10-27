import { Db } from 'mongodb';

import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';

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
    const mongoTransactionManager =
      props.mongoTransactionManager ?? TransactionManagerFactory.default();

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
