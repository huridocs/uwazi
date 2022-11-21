import { getClient } from './getConnectionForCurrentTenant';
import { MongoIdGenerator } from './MongoIdGenerator';
import { MongoTransactionManager } from './MongoTransactionManager';

const DefaultTransactionManager = () => {
  const client = getClient();
  return new MongoTransactionManager(client);
};

const DefaultIdGenerator = MongoIdGenerator;

export { DefaultIdGenerator, DefaultTransactionManager };
