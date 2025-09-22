import { DefaultTransactionManager } from '../common.v2/database/data_source_defaults.js';
import { MongoTransactionManager } from '../common.v2/database/MongoTransactionManager.js';
import { User } from '../users.v2/model/User.js';
import { DefaultPermissionsDataSource } from '../database/data_source_defaults';
import { AuthorizationService as GenericAuthorizationService } from './AuthorizationService';

const AuthorizationService = (user: User, _transactionManager?: MongoTransactionManager) => {
  const transactionManager = _transactionManager || DefaultTransactionManager();
  const permissionDS = DefaultPermissionsDataSource(transactionManager);
  return new GenericAuthorizationService(permissionDS, user);
};

export { AuthorizationService };
