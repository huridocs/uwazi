import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { User } from '#api/users.v2/model/User.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntitiesDAO } from '../mongodb/entity/MongoEntitiesDAO.js';
import { FilesDAOFactory } from './FilesDAOFactory.js';
import { PostgresFilesDAO } from '../postgresql/files/PostgresFilesDAO.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

export class MongoEntitiesDAOFactory {
  static default(overrides?: {
    user?: User;
    transactionManager?: TransactionManager;
  }): MongoEntitiesDAO {
    const filesDAO: PostgresFilesDAO | undefined = ExecutionContext.tenant.featureFlags
      ?.postgresFiles
      ? (FilesDAOFactory.default() as PostgresFilesDAO)
      : undefined;

    return new MongoEntitiesDAO(
      getConnection(),
      overrides?.transactionManager ?? ExecutionContext.transactionManager,
      overrides?.user ?? ExecutionContext.actor ?? User.createFrom(null),
      { filesDAO }
    );
  }
}
