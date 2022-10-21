import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultUserDataSource } from '../database/data_source_defaults';
import { GetUserService as GenericGetUserService } from './GetUserService';

const GetUserService = () =>
  new GenericGetUserService(DefaultUserDataSource(new MongoTransactionManager(getClient())));

export { GetUserService };
