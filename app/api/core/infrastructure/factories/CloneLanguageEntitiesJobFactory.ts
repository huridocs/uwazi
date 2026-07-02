import { User } from '#api/users.v2/model/User.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { V1WebSocketsWrapper } from '../services/V1WebSocketsWrapper.js';
import { CloneLanguageEntitiesJob } from '../jobs/CloneLanguageEntitiesJob.js';
import { MongoEntitiesDAOFactory } from './MongoEntitiesDAOFactory.js';
import { FilesDAOFactory } from './FilesDAOFactory.js';

class CloneLanguageEntitiesJobFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof CloneLanguageEntitiesJob>[0]>
  ): CloneLanguageEntitiesJob {
    const transactionManager = TransactionManagerFactory.default() as MongoTransactionManager;
    const entityDAO = MongoEntitiesDAOFactory.default({
      transactionManager,
      user: User.createFrom(null),
    });
    const filesDAO = FilesDAOFactory.default();
    const { jobsDispatcher } = ExecutionContext;
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    return new CloneLanguageEntitiesJob({
      entityDAO,
      filesDAO,
      jobsDispatcher,
      webSockets: new V1WebSocketsWrapper(),
      settingsDS,
      ...overrides,
    });
  }
}

export { CloneLanguageEntitiesJobFactory };
