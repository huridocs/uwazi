import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import {
  RelationshipMigrationFieldUniqueId,
  RelationshipMigrationField,
} from '#api/relationships.v2/model/RelationshipMigrationField.js';
import {
  RelationshipMigrationFieldDBO,
  RelationshipMigrationFieldUniqueIdDBO,
} from '#api/relationships.v2/database/schemas/relationshipMigrationFieldTypes.js';

const mapFieldIdToDBO = (
  fieldId: RelationshipMigrationFieldUniqueId
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
): RelationshipMigrationFieldUniqueId => {
  const targetTemplate = field.targetTemplate
    ? MongoIdHandler.mapToApp(field.targetTemplate)
    : undefined;
  return new RelationshipMigrationFieldUniqueId(
    MongoIdHandler.mapToApp(field.sourceTemplate),
    MongoIdHandler.mapToApp(field.relationType),
    targetTemplate
  );
};

const mapFieldToApp = (field: RelationshipMigrationFieldDBO): RelationshipMigrationField =>
  new RelationshipMigrationField(mapFieldIdToApp(field), field.ignored);

export { mapFieldToDBO, mapFieldIdToDBO, mapFieldToApp };
