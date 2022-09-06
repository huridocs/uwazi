import { RelationshipsDataSource } from '../database/RelationshipsDataSource';

interface PaginationOptions {
  page: number;
  size: number;
}

export class GetRelationshipsService {
  private relationshipsDS: RelationshipsDataSource;

  constructor(relationshipsDS: RelationshipsDataSource) {
    this.relationshipsDS = relationshipsDS;
  }

  async getByEntity(sharedId: string, { page, size }: PaginationOptions) {
    return this.relationshipsDS.getByEntity(sharedId, page, size);
  }
}
