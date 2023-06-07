import { IdGenerator } from '../contracts/IdGenerator';
import { getClient } from './getConnectionForCurrentTenant';
import { MongoIdHandler } from './MongoIdGenerator';
import { MongoTransactionManager } from './MongoTransactionManager';

const DefaultTransactionManager = () => {
  const client = getClient();
  return new MongoTransactionManager(client);
};

const DefaultIdGenerator: IdGenerator = MongoIdHandler;

export { DefaultIdGenerator, DefaultTransactionManager };
