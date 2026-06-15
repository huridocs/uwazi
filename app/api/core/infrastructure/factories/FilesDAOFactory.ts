import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoFilesDAO } from '../mongodb/files/MongoFilesDAO.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

class FilesDAOFactory {
  static default(): MongoFilesDAO {
    return new MongoFilesDAO({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.default() as MongoTransactionManager,
    });
  }
}

export { FilesDAOFactory };
