import { RelationshipsQueryService } from '#api/relationships/query/application/RelationshipsQueryService.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';

class RelationshipsQueryServiceFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const entitiesDAO = EntitiesDAOFactory.default({ transactionManager });
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
