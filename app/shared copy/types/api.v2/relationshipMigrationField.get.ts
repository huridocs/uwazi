type ResponseElement = {
  sourceTemplate: string;
  relationType: string;
  targetTemplate?: string;
  ignored: boolean;
  infered: boolean;
};

type GetRelationshipMigrationFieldsResponse = ResponseElement[];

export type { ResponseElement, GetRelationshipMigrationFieldsResponse };
