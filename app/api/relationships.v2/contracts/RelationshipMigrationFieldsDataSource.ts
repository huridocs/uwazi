import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { RelationshipMigrationField } from '../model/RelationshipMigrationField';

export interface RelationshipMigrationFieldsDataSource {
  get(
    sourceTemplate: string,
    relationType: string,
    targetTemplate: string
  ): Promise<RelationshipMigrationField>;
  getAll(): ResultSet<RelationshipMigrationField>;
  upsert(field: RelationshipMigrationField): Promise<void>;
  delete(id: string): Promise<void>;
}
