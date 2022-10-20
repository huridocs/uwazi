import { User } from 'api/users.v2/model/User';
import { DefaultPermissionsDataSource } from '../database/data_source_defaults';
import { AuthorizationService as GenericAuthorizationService } from './AuthorizationService';

const AuthorizationService = (user: User) =>
  new GenericAuthorizationService(DefaultPermissionsDataSource(), user);

export { AuthorizationService };
