import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';

export class GetRelationshipsService {
  private relationshipsDS: RelationshipsDataSource;

  private authService: AuthorizationService;

  constructor(relationshipsDS: RelationshipsDataSource, authService: AuthorizationService) {
    this.relationshipsDS = relationshipsDS;
    this.authService = authService;
  }

  async getByEntity(sharedId: string) {
    await this.authService.validateAccess('read', [sharedId]);
    return this.relationshipsDS.getByEntity(sharedId);
  }
}
