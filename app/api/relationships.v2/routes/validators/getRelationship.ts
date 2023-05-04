import { createValidator, ValidatorSchema } from 'api/common.v2/validation/routesValidation';

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
