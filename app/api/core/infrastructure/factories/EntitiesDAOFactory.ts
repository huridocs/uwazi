import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { User } from '#api/users.v2/model/User.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntitiesDAO } from '../mongodb/entity/MongoEntitiesDAO.js';
import { FilesDAOFactory } from './FilesDAOFactory.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';

export class EntitiesDAOFactory {
  static default(overrides?: {
    user?: User;
    transactionManager?: TransactionManager;
    accessContext?: AccessContext;
  }): MongoEntitiesDAO {
    const filesDAO = ExecutionContext.tenant.featureFlags?.postgresFiles
      ? FilesDAOFactory.default()
      : undefined;

    const user = overrides?.user ?? ExecutionContext.actor ?? User.createFrom(null);
    const accessContext = overrides?.accessContext ?? AccessContext.forActor(user);

    return new MongoEntitiesDAO(
      getConnection(),
      overrides?.transactionManager ?? ExecutionContext.transactionManager,
      user,
      {
        filesDAO,
        accessContext,
      }
    );
  }
}
