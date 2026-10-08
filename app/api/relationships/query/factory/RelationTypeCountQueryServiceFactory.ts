import { GetRelationshipTypesUseCaseFactory } from '#api/core/infrastructure/factories/GetRelationshipTypesUseCaseFactory.js';
import relationships from '#api/relationships/relationships.js';
import { RelationTypeCountQueryService } from '../infrastructure/RelationTypeCountQueryService.js';

class RelationTypeCountQueryServiceFactory {
  static default() {
    return new RelationTypeCountQueryService({
      getRelationshipTypes: GetRelationshipTypesUseCaseFactory.default(),
      relationships,
    });
  }
}

export { RelationTypeCountQueryServiceFactory };
