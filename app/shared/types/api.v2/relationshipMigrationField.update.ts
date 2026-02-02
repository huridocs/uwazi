import { MigrationFieldUniqueIdentifier } from './relationshipMigrationField.delete.js';
import { ResponseElement } from './relationshipMigrationField.get.js';

type UpdateRelationshipMigrationFieldRequest = MigrationFieldUniqueIdentifier & {
  ignored?: boolean;
};

type UpdateRelationshipMigrationFieldResponse = ResponseElement;

export type { UpdateRelationshipMigrationFieldResponse, UpdateRelationshipMigrationFieldRequest };
