// @ts-expect-error TS(2307): Cannot find module '../common.v2/validation/routes... Remove this comment to see the full error message
import { createValidator, ValidatorSchema } from '../common.v2/validation/routesValidation.js';

interface GetRelationshipData {
  sharedId: string;
}

const schema: ValidatorSchema<GetRelationshipData> = {
  properties: {
    sharedId: {
      type: 'string',
    },
  },
};

export const validateGetRelationships = createValidator(schema);
