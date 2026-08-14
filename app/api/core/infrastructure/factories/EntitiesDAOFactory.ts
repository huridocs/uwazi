import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { User } from '#api/users.v2/model/User.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntitiesDAO } from '../mongodb/entity/MongoEntitiesDAO.js';
import { PostgresEntitiesDAO } from '../postgresql/entity/PostgresEntitiesDAO.js';
import { FilesDAOFactory } from './FilesDAOFactory.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { EntitiesDAO } from '#api/core/application/contracts/EntitiesDAO.js';
import { PostgresFilesDAO } from '../postgresql/files/PostgresFilesDAO.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { PostgresTransactionManagerFactory } from './PostgresTransactionManagerFactory.js';

export class EntitiesDAOFactory {
  static default(overrides?: {
    user?: User;
    transactionManager?: TransactionManager;
    accessContext?: AccessContext;
  }): EntitiesDAO {
    const user = overrides?.user ?? ExecutionContext.actor ?? User.createFrom(null);
    const accessContext = overrides?.accessContext ?? AccessContext.forActor(user);
    const transactionManager =
      overrides?.transactionManager ??
      (ExecutionContext.getStore()
        ? ExecutionContext.transactionManager
        : TransactionManagerFactory.default());

    if (ExecutionContext.currentTenant.featureFlags?.postgresEntities) {
      if (!ExecutionContext.currentTenant.featureFlags?.postgresFiles) {
        throw new Error(
          'PostgresEntitiesDAO only works along with PostgresFilesDAO, please enable postgresFiles feature flag.'
        );
      }

      return new PostgresEntitiesDAO({
        tenantId: ExecutionContext.currentTenant.name,
        pgTransactionManager: ExecutionContext.getStore()
          ? ExecutionContext.postgresTransactionManager
          : PostgresTransactionManagerFactory.default(),
        filesDAO: FilesDAOFactory.default() as any as PostgresFilesDAO,
        accessContext,
      });
    }

    const filesDAO = ExecutionContext.currentTenant.featureFlags?.postgresFiles
      ? FilesDAOFactory.default()
      : undefined;

    return new MongoEntitiesDAO(getConnection(), transactionManager, {
      filesDAO,
      accessContext,
    });
  }
}
