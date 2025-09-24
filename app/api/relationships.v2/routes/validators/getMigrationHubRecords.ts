// @ts-expect-error TS(2307): Cannot find module '../common.v2/validation/routes... Remove this comment to see the full error message
import { createValidator, ValidatorSchema } from '../common.v2/validation/routesValidation.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/api.v2/migr... Remove this comment to see the full error message
import { GetMigrationHubRecordsRequest } from 'shared/types/api.v2/migrationHubRecords.get.js';

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
