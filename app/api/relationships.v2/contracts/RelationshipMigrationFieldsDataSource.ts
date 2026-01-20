import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import {
  RelationshipMigrationFieldUniqueId,
  RelationshipMigrationField,
} from '#api/relationships.v2/model/RelationshipMigrationField.js';

export interface RelationshipMigrationFieldsDataSource {
  getAll(): ResultSet<RelationshipMigrationField>;
  create(field: RelationshipMigrationField): Promise<void>;
  upsert(field: RelationshipMigrationField): Promise<void>;
  delete(fieldId: RelationshipMigrationFieldUniqueId): Promise<void>;
}
