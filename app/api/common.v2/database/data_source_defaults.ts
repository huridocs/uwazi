import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { dbSessionContext } from 'api/odm/sessionsContext';
import { IdGenerator } from '../../core/libs/IdGenerator';
import { getClient } from './getConnectionForCurrentTenant';
import { MongoIdHandler } from './MongoIdGenerator';
import { MongoTransactionManager } from './MongoTransactionManager';

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
