import { createValidator, ValidatorSchema } from '#api/common.v2/validation/routesValidation.js';

interface HubTestData {
  hubId: string;
}

const schema: ValidatorSchema<HubTestData> = {
  properties: {
    hubId: { type: 'string' },
  },
};

export const validateMigration = createValidator(schema);
