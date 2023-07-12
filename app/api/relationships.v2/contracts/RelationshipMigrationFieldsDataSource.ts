import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import {
  RelationShipMigrationFieldUniqueId,
  RelationshipMigrationField,
  RelationshipMigrationFieldInfo,
} from '../model/RelationshipMigrationField';

export interface RelationshipMigrationFieldsDataSource {
  get(fieldId: RelationShipMigrationFieldUniqueId): Promise<RelationshipMigrationField>;
  getAll(): ResultSet<RelationshipMigrationField>;
  upsert(field: RelationshipMigrationFieldInfo): Promise<void>;
  delete(fieldId: RelationShipMigrationFieldUniqueId): Promise<void>;
}
