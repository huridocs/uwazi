import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoFilesDAO } from '../mongodb/files/MongoFilesDAO.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

class FilesDAOFactory {
  static default(): MongoFilesDAO {
    return new MongoFilesDAO({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.default(),
    });
  }
}

export { FilesDAOFactory };
