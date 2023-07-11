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
  targetTemplate: MongoIdHandler.mapToDb(fieldId.targetTemplate),
});

const mapFieldInfoToDBO = (
  field: RelationshipMigrationFieldInfo
): RelationshipMigrationFieldInfoDBO => {
  const { ignored, ...fieldId } = field;
  return {
    ...mapFieldIdToDBO(fieldId),
    ignored,
  };
};

const mapFieldToDBO = (field: RelationshipMigrationField): RelationshipMigrationFieldDBO => {
  const { id, ...info } = field;
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
    MongoIdHandler.mapToApp(field.targetTemplate),
    field.ignored
  );

export { mapFieldToDBO, mapFieldIdToDBO, mapFieldInfoToDBO, mapFieldToApp };
