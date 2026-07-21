import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

import { User } from '#api/users.v2/model/User.js';
import { DefaultPermissionsDataSource } from '../database/data_source_defaults.js';
import { AuthorizationService as GenericAuthorizationService } from './AuthorizationService.js';

const AuthorizationService = (user: User, _transactionManager?: MongoTransactionManager) => {
  const transactionManager = _transactionManager || TransactionManagerFactory.default();
  const permissionDS = DefaultPermissionsDataSource(transactionManager);
  return new GenericAuthorizationService(permissionDS, user);
};

export { AuthorizationService };
