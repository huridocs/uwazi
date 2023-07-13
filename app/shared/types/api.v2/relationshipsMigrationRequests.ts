type PlanElement = {
  sourceTemplate: string;
  sourceTemplateId: string;
  relationType: string;
  relationTypeId: string;
  targetTemplate: string;
  targetTemplateId?: string;
  inferred?: boolean;
  ignored?: boolean;
};

type MigrationPlan = PlanElement[];

type TestOneHubRequest = {
  hubId: string;
  migrationPlan: PlanElement[];
};

type MigrationRequest = {
  dryRun: boolean;
  migrationPlan: MigrationPlan;
};

export type { MigrationPlan, MigrationRequest, PlanElement, TestOneHubRequest };
