// @ts-expect-error TS(2307): Cannot find module '../common.v2/validation/routes... Remove this comment to see the full error message
import { createValidator, ValidatorSchema } from '../common.v2/validation/routesValidation.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/api.v2/rela... Remove this comment to see the full error message
import { MigrationRequest } from 'shared/types/api.v2/relationships.migrate.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/api.v2/rela... Remove this comment to see the full error message
import { TestOneHubRequest } from 'shared/types/api.v2/relationships.testOneHub.js';

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
