import { createValidator, ValidatorSchema } from 'api/common.v2/validation/routesValidation';

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
