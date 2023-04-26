import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { Relationship } from '../model/Relationship';

class GetRelationshipService {
  private relationshipsDS: RelationshipsDataSource;

  private authService: AuthorizationService;

  // eslint-disable-next-line max-params
  constructor(relationshipsDS: RelationshipsDataSource, authService: AuthorizationService) {
    this.relationshipsDS = relationshipsDS;
    this.authService = authService;
  }

  async getByEntity(sharedId: string): Promise<Relationship[]> {
    const relationships = await this.relationshipsDS.getByEntities([sharedId]).all();

    const involvedSharedIds: Set<string> = new Set(
      relationships.flatMap(relationship => [relationship.from.entity, relationship.to.entity])
    );
    const allowedSharedIds = new Set(
      await this.authService.filterEntities('read', [...involvedSharedIds])
    );
    const allowedRelationships = relationships.filter(
      relationship =>
        allowedSharedIds.has(relationship.from.entity) &&
        allowedSharedIds.has(relationship.to.entity)
    );

    return allowedRelationships;
  }
}

export { GetRelationshipService };
