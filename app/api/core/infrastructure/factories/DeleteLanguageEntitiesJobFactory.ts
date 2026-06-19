import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntitiesDAO } from '#api/core/infrastructure/mongodb/entity/MongoEntitiesDAO.js';
import { User } from '#api/users.v2/model/User.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { V1WebSocketsWrapper } from '../services/V1WebSocketsWrapper.js';
import { DeleteLanguageEntitiesJob } from '../jobs/DeleteLanguageEntitiesJob.js';

class DeleteLanguageEntitiesJobFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof DeleteLanguageEntitiesJob>[0]>
  ): DeleteLanguageEntitiesJob {
    const transactionManager = TransactionManagerFactory.default() as MongoTransactionManager;
    const db = getConnection();
    const entityDAO = new MongoEntitiesDAO(db, transactionManager, User.createFrom(null));
    return new DeleteLanguageEntitiesJob({
      entityDAO,
      webSockets: new V1WebSocketsWrapper(),
      ...overrides,
    });
  }
}

export { DeleteLanguageEntitiesJobFactory };
