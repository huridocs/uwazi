import { DefaultLogger } from '#api/log.v2/infrastructure/StandardLogger.js';
import { dbSessionContext } from '#api/odm/sessionsContext.js';
import { IdGenerator } from '../contracts/IdGenerator.js';
import { getClient } from './getConnectionForCurrentTenant.js';
import { MongoIdHandler } from './MongoIdGenerator.js';
import { MongoTransactionManager } from './MongoTransactionManager.js';

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
