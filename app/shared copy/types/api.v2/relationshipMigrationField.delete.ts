type MigrationFieldUniqueIdentifier = {
  sourceTemplate: string;
  relationType: string;
  targetTemplate?: string;
};

type DeleteRelationshipMigrationFieldRequest = MigrationFieldUniqueIdentifier;

export type { DeleteRelationshipMigrationFieldRequest, MigrationFieldUniqueIdentifier };
