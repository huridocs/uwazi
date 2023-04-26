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
    //  const filtered = await this.authService.filterRead(relationships);
    return relationships;
  }
}

export { GetRelationshipService };
