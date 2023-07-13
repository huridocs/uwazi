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

type TestOneHubRequest = {
  hubId: string;
  migrationPlan: PlanElement[];
};

export type { PlanElement, TestOneHubRequest };
