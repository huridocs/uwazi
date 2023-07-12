import { createValidator, ValidatorSchema } from 'api/common.v2/validation/routesValidation';
import { UpsertMigrationFieldRequest } from 'shared/types/api.v2/relationshipMigrationFieldRequests';

const schema: ValidatorSchema<UpsertMigrationFieldRequest> = {
  properties: {
    sourceTemplate: {
      type: 'string',
    },
    relationType: {
      type: 'string',
    },
  },
  optionalProperties: {
    ignored: {
      type: 'boolean',
    },
    targetTemplate: {
      type: 'string',
    },
  },
};

export const validateUpsertRelationshipMigrationField = createValidator(schema);
