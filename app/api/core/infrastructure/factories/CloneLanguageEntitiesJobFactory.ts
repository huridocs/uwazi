import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntitiesDAO } from '#api/core/infrastructure/mongodb/entity/MongoEntitiesDAO.js';
import { User } from '#api/users.v2/model/User.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { V1WebSocketsWrapper } from '../services/V1WebSocketsWrapper.js';
import { CloneLanguageEntitiesJob } from '../jobs/CloneLanguageEntitiesJob.js';

class CloneLanguageEntitiesJobFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof CloneLanguageEntitiesJob>[0]>
  ): CloneLanguageEntitiesJob {
    const transactionManager = TransactionManagerFactory.default() as MongoTransactionManager;
    const db = getConnection();
    const entityDAO = new MongoEntitiesDAO(db, transactionManager, User.createFrom(null));
    const filesCollection = db.collection('files');
    const { jobsDispatcher } = ExecutionContext;
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    return new CloneLanguageEntitiesJob({
      entityDAO,
      filesCollection,
      jobsDispatcher,
      webSockets: new V1WebSocketsWrapper(),
      settingsDS,
      ...overrides,
    });
  }
}

export { CloneLanguageEntitiesJobFactory };
