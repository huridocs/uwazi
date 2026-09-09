import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { V1WebSocketsWrapper } from '../services/V1WebSocketsWrapper.js';
import { CloneLanguageEntitiesJob } from '../jobs/CloneLanguageEntitiesJob.js';
import { EntitiesDAOFactory } from './EntitiesDAOFactory.js';
import { FilesDAOFactory } from './FilesDAOFactory.js';

class CloneLanguageEntitiesJobFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof CloneLanguageEntitiesJob>[0]>
  ): CloneLanguageEntitiesJob {
    const { transactionManager } = ExecutionContext;
    const entityDAO = EntitiesDAOFactory.default({
      transactionManager,
    });
    const filesDAO = FilesDAOFactory.default();
    const { jobsDispatcher } = ExecutionContext;
    const settingsDS = SettingsDataSourceFactory.default({
      transactionManager: ExecutionContext.mongoTransactionManager,
    });
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
