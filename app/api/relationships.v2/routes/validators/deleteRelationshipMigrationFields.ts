import { createValidator, ValidatorSchema } from 'api/common.v2/validation/routesValidation';
import { DeleteRelationshipMigrationFieldRequest } from 'shared/types/api.v2/relationshipMigrationFieldRequests';

const schema: ValidatorSchema<DeleteRelationshipMigrationFieldRequest> = {
  properties: {
    id: {
      type: 'string',
    },
  },
};

export const validateDeleteRelationshipMigrationField = createValidator(schema);
