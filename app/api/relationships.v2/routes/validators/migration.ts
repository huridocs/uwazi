import { createValidator, ValidatorSchema } from 'api/common.v2/validation/routesValidation';

interface MigrationData {
  dryRun: boolean;
}

const schema: ValidatorSchema<MigrationData> = {
  properties: {
    dryRun: { type: 'boolean' },
  },
};

export const validateMigration = createValidator(schema);
