type DeleteRelationshipMigrationFieldRequest = {
  id: string;
};

type UpsertMigrationFieldRequest = {
  id?: string;
  sourceTemplate: string;
  relationType: string;
  targetTemplate: string;
  ignored?: boolean;
};

export type { DeleteRelationshipMigrationFieldRequest, UpsertMigrationFieldRequest };
