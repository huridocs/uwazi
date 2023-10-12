import { StandardLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { StandardJSONWriter } from 'api/log.v2/infrastructure/writers/StandardJSONWriter';
import { IdGenerator } from '../contracts/IdGenerator';
import { getClient, getTenant } from './getConnectionForCurrentTenant';
import { MongoIdHandler } from './MongoIdGenerator';
import { MongoTransactionManager } from './MongoTransactionManager';

const DefaultTransactionManager = () => {
  const client = getClient();
  const logger = new StandardLogger(StandardJSONWriter, getTenant());
  return new MongoTransactionManager(client, logger);
};

const DefaultIdGenerator: IdGenerator = MongoIdHandler;

export { DefaultIdGenerator, DefaultTransactionManager };
