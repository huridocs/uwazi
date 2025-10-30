import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { User } from 'api/users.v2/model/User';
import { DefaultPermissionsDataSource } from '../database/data_source_defaults';
import { AuthorizationService as GenericAuthorizationService } from './AuthorizationService';

const AuthorizationService = (user: User, _transactionManager?: MongoTransactionManager) => {
  const transactionManager = _transactionManager || TransactionManagerFactory.default();
  const permissionDS = DefaultPermissionsDataSource(transactionManager);
  return new GenericAuthorizationService(permissionDS, user);
};

export { AuthorizationService };
