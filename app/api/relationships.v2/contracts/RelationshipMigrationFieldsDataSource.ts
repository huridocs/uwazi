import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import {
  RelationshipMigrationFieldUniqueId,
  RelationshipMigrationField,
} from '../model/RelationshipMigrationField';

export interface RelationshipMigrationFieldsDataSource {
  getAll(): ResultSet<RelationshipMigrationField>;
  create(field: RelationshipMigrationField): Promise<void>;
  upsert(field: RelationshipMigrationField): Promise<void>;
  delete(fieldId: RelationshipMigrationFieldUniqueId): Promise<void>;
}
