import { RelationshipsQueryService } from '#api/core/application/RelationshipsQueryService.js';
import { User } from '#api/users.v2/model/User.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { MongoRelationshipsV1DataSource } from '../mongodb/MongoRelationshipsV1DataSource.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { EntitiesDAOFactory } from './EntitiesDAOFactory.js';
import { FilesDAOFactory } from './FilesDAOFactory.js';

class RelationshipsQueryServiceFactory {
  static default(user: User) {
    const transactionManager = TransactionManagerFactory.default();
    const entitiesDAO = EntitiesDAOFactory.default({ user, transactionManager });
    return new RelationshipsQueryService({
      entitiesDAO,
      filesDAO: FilesDAOFactory.default(),
      relationshipsDataSource: new MongoRelationshipsV1DataSource(
        getConnection(),
        transactionManager,
        entitiesDAO
      ),
    });
  }
}

export { RelationshipsQueryServiceFactory };
