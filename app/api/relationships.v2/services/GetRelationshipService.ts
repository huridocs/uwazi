import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { Relationship } from '../model/Relationship';

class GetRelationshipService {
  private relationshipsDS: RelationshipsDataSource;

  private authService: AuthorizationService;

  private entitiesDS: EntitiesDataSource;

  constructor(
    relationshipsDS: RelationshipsDataSource,
    authService: AuthorizationService,
    entitiesDS: EntitiesDataSource
  ) {
    this.relationshipsDS = relationshipsDS;
    this.authService = authService;
    this.entitiesDS = entitiesDS;
  }

  async getByEntity(
    sharedId: string
  ): Promise<{ relationships: Relationship[]; titleMap: Record<string, string> }> {
    const relationships = await this.relationshipsDS.getByEntities([sharedId]).all();
    const allowedRelationships = await this.authService.filterRelationships(relationships, 'read');
    const allowedSharedIds = Relationship.getSharedIds(allowedRelationships);
    const allowedEntities = await this.entitiesDS.getByIds([...allowedSharedIds]).all();
    const titlesById = objectIndex(
      allowedEntities,
      entity => entity.sharedId,
      entity => entity.title
    );

    return { relationships: allowedRelationships, titleMap: titlesById };
  }
}

export { GetRelationshipService };
