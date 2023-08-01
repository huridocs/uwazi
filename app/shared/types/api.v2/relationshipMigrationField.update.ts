import { MigrationFieldUniqueIdentifier } from './relationshipMigrationField.delete';
import { ResponseElement } from './relationshipMigrationField.get';

type UpdateRelationshipMigrationFieldRequest = MigrationFieldUniqueIdentifier & {
  ignored?: boolean;
};

type UpdateRelationshipMigrationFieldResponse = ResponseElement;

export type { UpdateRelationshipMigrationFieldResponse, UpdateRelationshipMigrationFieldRequest };
