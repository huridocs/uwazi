import { ObjectId } from 'mongodb';

type RelationshipMigrationFieldUniqueIdDBO = {
  sourceTemplate: ObjectId;
  relationType: ObjectId;
  targetTemplate?: ObjectId;
};

type RelationshipMigrationFieldDBO = RelationshipMigrationFieldUniqueIdDBO & {
  ignored: boolean;
};

export type { RelationshipMigrationFieldDBO, RelationshipMigrationFieldUniqueIdDBO };
