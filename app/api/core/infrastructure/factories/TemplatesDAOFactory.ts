import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTemplatesDAO } from '../mongodb/template/MongoTemplatesDAO.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

class TemplatesDAOFactory {
  static default(): MongoTemplatesDAO {
    return new MongoTemplatesDAO({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.default(),
    });
  }
}

export { TemplatesDAOFactory };
