import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { MongoTransactionManager } from '#api/common.v2/database/MongoTransactionManager.js';

import { User } from '#api/users.v2/model/User.js';
import { DefaultPermissionsDataSource } from '../database/data_source_defaults';
import { AuthorizationService as GenericAuthorizationService } from './AuthorizationService';

const AuthorizationService = (user: User, _transactionManager?: MongoTransactionManager) => {
  const transactionManager = _transactionManager || TransactionManagerFactory.default();
  const permissionDS = DefaultPermissionsDataSource(transactionManager);
  return new GenericAuthorizationService(permissionDS, user);
};

export { AuthorizationService };
