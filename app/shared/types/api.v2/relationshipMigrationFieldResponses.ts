type ResponseElement = {
  sourceTemplate: string;
  relationType: string;
  targetTemplate?: string;
  ignored: boolean;
  infered: boolean;
};

type GetRelationshipMigrationFieldsResponse = ResponseElement[];

type UpsertRelationshipMigrationFieldResponse = ResponseElement;

export type {
  ResponseElement,
  GetRelationshipMigrationFieldsResponse,
  UpsertRelationshipMigrationFieldResponse,
};
