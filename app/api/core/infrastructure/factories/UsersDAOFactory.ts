import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUsersDAO } from '../mongodb/user/MongoUsersDAO.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

class UsersDAOFactory {
  static default(): MongoUsersDAO {
    return new MongoUsersDAO(getConnection(), TransactionManagerFactory.default());
  }
}

export { UsersDAOFactory };
