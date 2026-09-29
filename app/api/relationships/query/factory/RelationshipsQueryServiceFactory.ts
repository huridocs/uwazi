import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { RelationshipsV1DataSourceFactory } from '#api/core/infrastructure/factories/RelationshipsV1DataSourceFactory.js';
import { RelationshipsQueryService } from '#api/relationships/query/infrastructure/RelationshipsQueryService.js';

class RelationshipsQueryServiceFactory {
  static default() {
    return new RelationshipsQueryService({
      entitiesDAO: EntitiesDAOFactory.default(),
      filesDAO: FilesDAOFactory.default(),
      relationshipsDataSource: RelationshipsV1DataSourceFactory.default(),
    });
  }
}

export { RelationshipsQueryServiceFactory };
