import { RelationshipsDataSource } from '../database/RelationshipsDataSource';
import { AuthorizationService } from './AuthorizationService';

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
