import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { User } from 'api/users.v2/model/User';
import { DefaultPermissionsDataSource } from '../database/data_source_defaults';
import { AuthorizationService as GenericAuthorizationService } from './AuthorizationService';

const AuthorizationService = (user: User, _transactionManager?: MongoTransactionManager) => {
  const transactionManager = _transactionManager || DefaultTransactionManager();
  const permissionDS = DefaultPermissionsDataSource(transactionManager);
  return new GenericAuthorizationService(permissionDS, user);
};

export { AuthorizationService };
