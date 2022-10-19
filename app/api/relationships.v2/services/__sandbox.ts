import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { User } from 'api/users.v2/model/User';
import { AuthorizationService as GenericAuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { MongoPermissionsDataSource } from 'api/authorization.v2/database/MongoPermissionsDataSource';

import { MongoRelationshipsDataSource } from '../database/MongoRelationshipsDataSource';
import { DeleteRelationshipService as GenericDeleteRelationshipService } from './DeleteRelationshipService';

const DefaultRelationshipDataSource = () => {
  const connection = getConnection();
  return new MongoRelationshipsDataSource(connection);
};

const DefaultTransactionManager = () => {
  const client = getClient();
  return new MongoTransactionManager(client);
};

const DefaultPermissionsDataSource = () => {
  const connection = getConnection();
  return new MongoPermissionsDataSource(connection);
};

const AuthorizationService = (user: User) =>
  new GenericAuthorizationService(DefaultPermissionsDataSource(), user);

const DeleteRelationshipService = (user: User) =>
  new GenericDeleteRelationshipService(
    DefaultRelationshipDataSource(),
    DefaultTransactionManager(),
    AuthorizationService(user)
  );

export { DeleteRelationshipService };
