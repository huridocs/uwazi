import { createValidator, ValidatorSchema } from '#api/common.v2/validation/routesValidation.js';
import { DeleteRelationshipMigrationFieldRequest } from '#shared/types/api.v2/relationshipMigrationField.delete.js';

const schema: ValidatorSchema<DeleteRelationshipMigrationFieldRequest> = {
  properties: {
    sourceTemplate: {
      type: 'string',
    },
    relationType: {
      type: 'string',
    },
  },
  optionalProperties: {
    targetTemplate: {
      type: 'string',
    },
  },
};

export const validateDeleteRelationshipMigrationField = createValidator(schema);
