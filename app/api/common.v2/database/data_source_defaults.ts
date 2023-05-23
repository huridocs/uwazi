import { Document } from 'mongodb';

import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';

import { IdGenerator } from '../contracts/IdGenerator';
import { MongoIdHandler } from './MongoIdGenerator';
import { MongoTemporaryDataSource } from './MongoTemporaryDataSource';
import { MongoTransactionManager } from './MongoTransactionManager';

const DefaultTransactionManager = () => {
  const client = getClient();
  return new MongoTransactionManager(client);
};

const DefaultIdGenerator: IdGenerator = MongoIdHandler;

const DefaultTemporaryDataSource = <Schema extends Document>(
  name: string,
  transactionManager: MongoTransactionManager
) => {
  const db = getConnection();
  return new MongoTemporaryDataSource<Schema>(name, db, transactionManager);
};

const DefaultTemporaryDataSourceFactory = DefaultTemporaryDataSource;

export { DefaultIdGenerator, DefaultTemporaryDataSourceFactory, DefaultTransactionManager };
