import { Db } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';

import { PXExtractParagraphsFromEntities } from '#api/paragraphExtraction/application/PXExtractParagraphFromEntities.js';
import { PXEntitiesStatusDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory.js';
import { PXEntitiesStatusDataSource } from '#api/paragraphExtraction/domain/PXEntitiesStatusDataSource.js';

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

    const dispatcher = DefaultDispatcher(props.tenantName, mongoTransactionManager, {
      lockWindow: 1000 * 60,
    });

    return new PXExtractParagraphsFromEntities({
      entitiesStatusDS,
      dispatcher,
      tenantName: props.tenantName,
    });
  }
}
