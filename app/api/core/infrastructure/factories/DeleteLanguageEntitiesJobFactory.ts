import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { V1WebSocketsWrapper } from '../services/V1WebSocketsWrapper.js';
import { DeleteLanguageEntitiesJob } from '../jobs/DeleteLanguageEntitiesJob.js';
import { EntitiesDAOFactory } from './EntitiesDAOFactory.js';

class DeleteLanguageEntitiesJobFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof DeleteLanguageEntitiesJob>[0]>
  ): DeleteLanguageEntitiesJob {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const entityDAO = EntitiesDAOFactory.default({
      transactionManager,
    });
    return new DeleteLanguageEntitiesJob({
      entityDAO,
      webSockets: new V1WebSocketsWrapper(),
      ...overrides,
    });
  }
}

export { DeleteLanguageEntitiesJobFactory };
