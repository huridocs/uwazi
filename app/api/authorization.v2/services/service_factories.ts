import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { User } from 'api/users.v2/model/User';
import { DefaultPermissionsDataSource } from '../database/data_source_defaults';
import { AuthorizationService as GenericAuthorizationService } from './AuthorizationService';

const AuthorizationService = (user: User, transactionManager: MongoTransactionManager) =>
  new GenericAuthorizationService(DefaultPermissionsDataSource(transactionManager), user);

export { AuthorizationService };
