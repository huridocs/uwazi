type ResponseElement = {
  sourceTemplate: string;
  relationType: string;
  targetTemplate?: string;
  ignored: boolean;
  infered: boolean;
};

type GetRelationshipMigrationFieldsResponse = ResponseElement[];

type CreateRelationshipMigRationFieldResponse = ResponseElement;

type UpdateRelationshipMigrationFieldResponse = ResponseElement;

export type {
  ResponseElement,
  CreateRelationshipMigRationFieldResponse,
  GetRelationshipMigrationFieldsResponse,
  UpdateRelationshipMigrationFieldResponse,
};
