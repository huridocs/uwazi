import { Db } from 'mongodb';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

import { PXExtractParagraphsFromEntities } from '../application/PXExtractParagraphFromEntities.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource.js';

type Props = {
  tenantName: string;
  connection?: Db;
  mongoTransactionManager?: TransactionManager;
  entitiesStatusDS?: PXEntitiesStatusDataSource;
};

export class PXExtractParagraphsFromEntitiesFactory {
  static async createDefault(props: Props) {
    const connection = props.connection ?? getConnection();
    const mongoTransactionManager =
      props.mongoTransactionManager ?? ExecutionContext.mongoTransactionManager;

    const entitiesStatusDS =
      props.entitiesStatusDS ??
      PXEntitiesStatusDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      });

    return new PXExtractParagraphsFromEntities({
      entitiesStatusDS,
      dispatcher: ExecutionContext.jobsDispatcher,
      tenantName: props.tenantName,
    });
  }
}
