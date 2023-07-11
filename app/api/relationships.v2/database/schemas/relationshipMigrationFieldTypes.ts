import { ObjectId } from 'mongodb';

type RelationshipMigrationFieldDBO = {
  _id: ObjectId;
  sourceTemplate: ObjectId;
  relationType: ObjectId;
  targetTemplate: ObjectId;
  ignored: boolean;
};

type RelationshipMigrationFieldInfoDBO = Omit<RelationshipMigrationFieldDBO, '_id'>;

type RelationshipMigrationFieldUniqueIdDBO = Omit<RelationshipMigrationFieldInfoDBO, 'ignored'>;

export type {
  RelationshipMigrationFieldDBO,
  RelationshipMigrationFieldInfoDBO,
  RelationshipMigrationFieldUniqueIdDBO,
};
