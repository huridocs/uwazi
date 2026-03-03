import { createValidator, ValidatorSchema } from '#api/common.v2/validation/routesValidation.js';
import { GetMigrationHubRecordsRequest } from '#shared/types/api.v2/migrationHubRecords.get.js';

const schema: ValidatorSchema<GetMigrationHubRecordsRequest> = {
  properties: {
    page: {
      type: 'string',
    },
    pageSize: {
      type: 'string',
    },
  },
};

export const validateGetMigrationHubRecordsRequest = createValidator(schema);
