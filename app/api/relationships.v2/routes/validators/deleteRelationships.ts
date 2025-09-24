// @ts-expect-error TS(2307): Cannot find module '../common.v2/validation/routes... Remove this comment to see the full error message
import { createValidator, ValidatorSchema } from '../common.v2/validation/routesValidation.js';

interface DeleteRelationshipsData {
  ids: string[];
}

const schema: ValidatorSchema<DeleteRelationshipsData> = {
  properties: {
    ids: {
      elements: {
        type: 'string',
      },
    },
  },
};

export const validateDeleteRelationships = createValidator(schema);
