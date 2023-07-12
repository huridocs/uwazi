import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import {
  RelationShipMigrationFieldUniqueId,
  RelationshipMigrationField,
  RelationshipMigrationFieldInfo,
} from '../model/RelationshipMigrationField';
import {
  RelationshipMigrationFieldDBO,
  RelationshipMigrationFieldInfoDBO,
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

const mapFieldInfoToDBO = (
  field: RelationshipMigrationFieldInfo
): RelationshipMigrationFieldInfoDBO => {
  const { ignored } = field;
  const fieldId = field.getId();
  return {
    ...mapFieldIdToDBO(fieldId),
    ignored,
  };
};

const mapFieldToDBO = (field: RelationshipMigrationField): RelationshipMigrationFieldDBO => {
  const { id } = field;
  const info = field.getInfo();
  return {
    _id: MongoIdHandler.mapToDb(id),
    ...mapFieldInfoToDBO(info),
  };
};

const mapFieldToApp = (field: RelationshipMigrationFieldDBO): RelationshipMigrationField =>
  new RelationshipMigrationField(
    MongoIdHandler.mapToApp(field._id),
    MongoIdHandler.mapToApp(field.sourceTemplate),
    MongoIdHandler.mapToApp(field.relationType),
    field.targetTemplate ? MongoIdHandler.mapToApp(field.targetTemplate) : undefined,
    field.ignored
  );

export { mapFieldToDBO, mapFieldIdToDBO, mapFieldInfoToDBO, mapFieldToApp };
