import { createValidator, ValidatorSchema } from 'api/common.v2/validation/routesValidation';
import { DeleteRelationshipMigrationFieldRequest } from 'shared/types/api.v2/relationshipMigrationField.delete';

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
