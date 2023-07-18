import { createValidator, ValidatorSchema } from 'api/common.v2/validation/routesValidation';
import { GetMigrationHubRecordsRequest } from 'shared/types/api.v2/migrationHubRecords.get';

const schema: ValidatorSchema<GetMigrationHubRecordsRequest> = {
  properties: {
    page: {
      type: 'uint32',
    },
    pageSize: {
      type: 'uint32',
    },
  },
};

export const validateGetMigrationHubRecordsRequest = createValidator(schema);
