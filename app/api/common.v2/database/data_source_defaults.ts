import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { IdGenerator } from '../contracts/IdGenerator';
import { getClient } from './getConnectionForCurrentTenant';
import { MongoIdHandler } from './MongoIdGenerator';
import { MongoTransactionManager } from './MongoTransactionManager';

const DefaultTransactionManager = () => {
  const client = getClient();
  const logger = DefaultLogger();
  return new MongoTransactionManager(client, logger);
};

const DefaultIdGenerator: IdGenerator = MongoIdHandler;

export { DefaultIdGenerator, DefaultTransactionManager };
