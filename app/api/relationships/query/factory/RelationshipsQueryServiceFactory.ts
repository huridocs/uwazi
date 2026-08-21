import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { MongoRelationshipsV1DataSourceFactory } from '#api/core/infrastructure/factories/MongoRelationshipsV1DataSourceFactory.js';
import { RelationshipsQueryService } from '#api/relationships/query/infrastructure/RelationshipsQueryService.js';

class RelationshipsQueryServiceFactory {
  static default() {
    return new RelationshipsQueryService({
      entitiesDAO: EntitiesDAOFactory.default(),
      filesDAO: FilesDAOFactory.default(),
      relationshipsDataSource: MongoRelationshipsV1DataSourceFactory.default(),
    });
  }
}

export { RelationshipsQueryServiceFactory };
