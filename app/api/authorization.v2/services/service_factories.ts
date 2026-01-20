import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';

import { User } from '#api/users.v2/model/User.js';
import { DefaultPermissionsDataSource } from '#api/authorization.v2/database/data_source_defaults.js';
import { AuthorizationService as GenericAuthorizationService } from '#api/authorization.v2/services/AuthorizationService.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

const AuthorizationService = (user: User, _transactionManager?: MongoTransactionManager) => {
  const transactionManager = _transactionManager || TransactionManagerFactory.default();
  const permissionDS = DefaultPermissionsDataSource(transactionManager);
  return new GenericAuthorizationService(permissionDS, user);
};

export { AuthorizationService };
