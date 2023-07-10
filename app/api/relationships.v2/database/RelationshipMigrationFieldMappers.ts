import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { RelationshipMigrationField } from '../model/RelationshipMigrationField';
import { RelationshipMigrationFieldDBO } from './schemas/relationshipMigrationFieldTypes';

const mapFieldToDBO = (field: RelationshipMigrationField): RelationshipMigrationFieldDBO => ({
  id: MongoIdHandler.mapToDb(field.id),
  sourceTemplate: MongoIdHandler.mapToDb(field.sourceTemplate),
  relationType: MongoIdHandler.mapToDb(field.relationType),
  targetTemplate: MongoIdHandler.mapToDb(field.targetTemplate),
  ignored: field.ignored,
});

const mapFieldToApp = (field: RelationshipMigrationFieldDBO): RelationshipMigrationField =>
  new RelationshipMigrationField(
    MongoIdHandler.mapToApp(field.id),
    MongoIdHandler.mapToApp(field.sourceTemplate),
    MongoIdHandler.mapToApp(field.relationType),
    MongoIdHandler.mapToApp(field.targetTemplate),
    field.ignored
  );

export { mapFieldToDBO, mapFieldToApp };
