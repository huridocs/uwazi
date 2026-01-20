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

type MigrationRequest = {
  dryRun: boolean;
  migrationPlan: MigrationPlan;
};

type MigrationResponse = {
  total: number;
  used: number;
  totalTextReferences: number;
  usedTextReferences: number;
  errors: number;
  time: number;
  dryRun: boolean;
};

export type { MigrationPlan, MigrationRequest, MigrationResponse, PlanElement };
