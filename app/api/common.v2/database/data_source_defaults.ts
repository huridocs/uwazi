import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { getClient } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { dbSessionContext } from '#api/odm/sessionsContext.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';

const DefaultTransactionManager = () => {
  const v1withTransactionStoredManager = dbSessionContext.getTransactionManager();
  if (v1withTransactionStoredManager) {
    return v1withTransactionStoredManager;
  }
  const client = getClient();
  const logger = LoggerFactory.default();
  return new MongoTransactionManager(client, logger);
};

const DefaultIdGenerator: IdGenerator = MongoIdHandler;

export { DefaultIdGenerator, DefaultTransactionManager };
