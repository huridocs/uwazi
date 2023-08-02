import { createValidator, ValidatorSchema } from 'api/common.v2/validation/routesValidation';
import { UpdateRelationshipMigrationFieldRequest } from 'shared/types/api.v2/relationshipMigrationField.update';

const schema: ValidatorSchema<UpdateRelationshipMigrationFieldRequest> = {
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
