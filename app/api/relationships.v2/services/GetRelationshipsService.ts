import { RelationshipsDataSource } from '../database/RelationshipsDataSource';

export class GetRelationshipsService {
  private relationshipsDS: RelationshipsDataSource;

  constructor(relationshipsDS: RelationshipsDataSource) {
    this.relationshipsDS = relationshipsDS;
  }

  getByEntity(sharedId: string) {
    return this.relationshipsDS.getByEntity(sharedId);
  }
}
