type DeleteRelationshipMigrationFieldRequest = {
  sourceTemplate: string;
  relationType: string;
  targetTemplate: string;
};

type UpsertMigrationFieldRequest = {
  sourceTemplate: string;
  relationType: string;
  targetTemplate: string;
  ignored?: boolean;
};

export type { DeleteRelationshipMigrationFieldRequest, UpsertMigrationFieldRequest };
