import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import {
  RelationShipMigrationFieldUniqueId,
  RelationshipMigrationField,
} from '../model/RelationshipMigrationField';

export interface RelationshipMigrationFieldsDataSource {
  get(fieldId: RelationShipMigrationFieldUniqueId): Promise<RelationshipMigrationField>;
  getAll(): ResultSet<RelationshipMigrationField>;
  create(field: RelationshipMigrationField): Promise<void>;
  upsert(field: RelationshipMigrationField): Promise<void>;
  delete(fieldId: RelationShipMigrationFieldUniqueId): Promise<void>;
}
