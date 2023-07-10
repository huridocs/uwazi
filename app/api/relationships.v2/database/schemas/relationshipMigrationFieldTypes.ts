import { ObjectId } from 'mongodb';

type RelationshipMigrationFieldDBO = {
  id: ObjectId;
  sourceTemplate: ObjectId;
  relationType: ObjectId;
  targetTemplate: ObjectId;
  ignored: boolean;
};

export type { RelationshipMigrationFieldDBO };
