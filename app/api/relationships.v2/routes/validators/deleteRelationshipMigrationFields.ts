// @ts-expect-error TS(2307): Cannot find module '../common.v2/validation/routes... Remove this comment to see the full error message
import { createValidator, ValidatorSchema } from '../common.v2/validation/routesValidation.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/api.v2/rela... Remove this comment to see the full error message
import { DeleteRelationshipMigrationFieldRequest } from 'shared/types/api.v2/relationshipMigrationField.delete.js';

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
