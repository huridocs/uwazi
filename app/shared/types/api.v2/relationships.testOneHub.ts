import { MigrationPlan } from './relationships.migrate';

type TestOneHubRequest = {
  hubId: string;
  migrationPlan: MigrationPlan;
};

export type { TestOneHubRequest };
