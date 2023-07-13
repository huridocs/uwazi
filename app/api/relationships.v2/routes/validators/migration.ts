import { createValidator, ValidatorSchema } from 'api/common.v2/validation/routesValidation';
import {
  MigrationRequest,
  TestOneHubRequest,
} from 'shared/types/api.v2/relationshipsMigrationRequests';

const migrationPlanSchemaDef = {
  elements: {
    properties: {
      sourceTemplate: { type: 'string' as 'string' },
      sourceTemplateId: { type: 'string' as 'string' },
      relationType: { type: 'string' as 'string' },
      relationTypeId: { type: 'string' as 'string' },
      targetTemplate: { type: 'string' as 'string' },
    },
    optionalProperties: {
      targetTemplateId: { type: 'string' as 'string' },
      inferred: { type: 'boolean' as 'boolean' },
      ignored: { type: 'boolean' as 'boolean' },
    },
  },
};

const schema: ValidatorSchema<MigrationRequest> = {
  properties: {
    dryRun: { type: 'boolean' },
    migrationPlan: migrationPlanSchemaDef,
  },
};

const testOneHubSchema: ValidatorSchema<TestOneHubRequest> = {
  properties: {
    hubId: { type: 'string' },
    migrationPlan: migrationPlanSchemaDef,
  },
};

const validateMigration = createValidator(schema);

const validateTestOneHub = createValidator(testOneHubSchema);

export { validateMigration, validateTestOneHub };
