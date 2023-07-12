import { ObjectId } from 'mongodb';

type RelationshipMigrationFieldUniqueIdDBO = {
  sourceTemplate: ObjectId;
  relationType: ObjectId;
  targetTemplate?: ObjectId;
};

type RelationshipMigrationFieldInfoDBO = RelationshipMigrationFieldUniqueIdDBO & {
  ignored: boolean;
};

type RelationshipMigrationFieldDBO = RelationshipMigrationFieldInfoDBO & {
  _id: ObjectId;
};

export type {
  RelationshipMigrationFieldDBO,
  RelationshipMigrationFieldInfoDBO,
  RelationshipMigrationFieldUniqueIdDBO,
};
