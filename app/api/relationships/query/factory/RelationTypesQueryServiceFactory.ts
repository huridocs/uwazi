import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { RelationshipTypesDataSourceFactory } from '#api/core/infrastructure/factories/RelationshipTypesDataSourceFactory.js';
import relationships from '#api/relationships/relationships.js';
import { RelationTypesQueryService } from '../infrastructure/RelationTypesQueryService.js';

class RelationTypesQueryServiceFactory {
  static default(): RelationTypesQueryService {
    return new RelationTypesQueryService({
      relationshipTypesDS: RelationshipTypesDataSourceFactory.default({
        transactionManager: ExecutionContext.transactionManager,
      }),
      relationships,
    });
  }
}

export { RelationTypesQueryServiceFactory };
