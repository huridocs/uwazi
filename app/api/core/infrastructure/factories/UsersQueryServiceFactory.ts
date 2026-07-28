import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUsersQueryService } from '../mongodb/user/MongoUsersQueryService.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { UsersDAOFactory } from './UsersDAOFactory.js';

class UsersQueryServiceFactory {
  static default(): MongoUsersQueryService {
    return new MongoUsersQueryService({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.default(),
      dao: UsersDAOFactory.default(),
    });
  }
}

export { UsersQueryServiceFactory };
