import { DefaultLogger } from '#api/core/libs/logger/infrastructure/StandardLogger.js';
import { dbSessionContext } from '#api/odm/sessionsContext.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { getClient } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';

const DefaultTransactionManager = () => {
  const v1withTransactionStoredManager = dbSessionContext.getTransactionManager();
  if (v1withTransactionStoredManager) {
    return v1withTransactionStoredManager;
  }
  const client = getClient();
  const logger = DefaultLogger();
  return new MongoTransactionManager(client, logger);
};

const DefaultIdGenerator: IdGenerator = MongoIdHandler;

export { DefaultIdGenerator, DefaultTransactionManager };
