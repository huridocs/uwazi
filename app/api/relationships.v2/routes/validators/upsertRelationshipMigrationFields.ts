// @ts-expect-error TS(2307): Cannot find module '../common.v2/validation/routes... Remove this comment to see the full error message
import { createValidator, ValidatorSchema } from '../common.v2/validation/routesValidation.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/api.v2/rela... Remove this comment to see the full error message
import { UpdateRelationshipMigrationFieldRequest } from 'shared/types/api.v2/relationshipMigrationField.update.js';

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
