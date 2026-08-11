import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUserGroupsDAO } from '../mongodb/user/MongoUserGroupsDAO.js';
import { UsersDAOFactory } from './UsersDAOFactory.js';

class UserGroupsDAOFactory {
  static default(): MongoUserGroupsDAO {
    return new MongoUserGroupsDAO(
      getConnection(),
      ExecutionContext.transactionManager,
      UsersDAOFactory.default()
    );
  }
}

export { UserGroupsDAOFactory };
