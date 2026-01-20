import { MigrationFieldUniqueIdentifier } from '#shared/types/api.v2/relationshipMigrationField.delete.js';
import { ResponseElement } from '#shared/types/api.v2/relationshipMigrationField.get.js';

type UpdateRelationshipMigrationFieldRequest = MigrationFieldUniqueIdentifier & {
  ignored?: boolean;
};

type UpdateRelationshipMigrationFieldResponse = ResponseElement;

export type { UpdateRelationshipMigrationFieldResponse, UpdateRelationshipMigrationFieldRequest };
