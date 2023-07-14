import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import {
  RelationShipMigrationFieldUniqueId,
  RelationshipMigrationField,
} from '../model/RelationshipMigrationField';
import {
  RelationshipMigrationFieldDBO,
  RelationshipMigrationFieldUniqueIdDBO,
} from './schemas/relationshipMigrationFieldTypes';

const mapFieldIdToDBO = (
  fieldId: RelationShipMigrationFieldUniqueId
): RelationshipMigrationFieldUniqueIdDBO => ({
  sourceTemplate: MongoIdHandler.mapToDb(fieldId.sourceTemplate),
  relationType: MongoIdHandler.mapToDb(fieldId.relationType),
  targetTemplate: fieldId.targetTemplate
    ? MongoIdHandler.mapToDb(fieldId.targetTemplate)
    : undefined,
});

const mapFieldToDBO = (field: RelationshipMigrationField): RelationshipMigrationFieldDBO => ({
  ...mapFieldIdToDBO(field.id),
  ignored: field.ignored,
});

const mapFieldIdToApp = (
  field: RelationshipMigrationFieldUniqueIdDBO
): RelationShipMigrationFieldUniqueId => {
  const targetTemplate = field.targetTemplate
    ? MongoIdHandler.mapToApp(field.targetTemplate)
    : undefined;
  return new RelationShipMigrationFieldUniqueId(
    MongoIdHandler.mapToApp(field.sourceTemplate),
    MongoIdHandler.mapToApp(field.relationType),
    targetTemplate
  );
};

const mapFieldToApp = (field: RelationshipMigrationFieldDBO): RelationshipMigrationField =>
  new RelationshipMigrationField(mapFieldIdToApp(field), field.ignored);

export { mapFieldToDBO, mapFieldIdToDBO, mapFieldToApp };
