import { createValidator, ValidatorSchema } from 'api/common.v2/validation/routesValidation';
import { TestOneHubRequest } from 'shared/types/api.v2/relationshipsMigrationRequests';

interface MigrationData {
  dryRun: boolean;
}

const schema: ValidatorSchema<MigrationData> = {
  properties: {
    dryRun: { type: 'boolean' },
  },
};

const testOneHubSchema: ValidatorSchema<TestOneHubRequest> = {
  properties: {
    hubId: { type: 'string' },
    migrationPlan: {
      elements: {
        properties: {
          sourceTemplate: { type: 'string' },
          sourceTemplateId: { type: 'string' },
          relationType: { type: 'string' },
          relationTypeId: { type: 'string' },
          targetTemplate: { type: 'string' },
        },
        optionalProperties: {
          targetTemplateId: { type: 'string' },
          inferred: { type: 'boolean' },
          ignored: { type: 'boolean' },
        },
      },
    },
  },
};

const validateMigration = createValidator(schema);

const validateTestOneHub = createValidator(testOneHubSchema);

export { validateMigration, validateTestOneHub };
