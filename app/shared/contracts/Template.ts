import type { PropertySchema } from '#shared/types/commonTypes.js';

type TemplateProcessing = {
  active?: boolean;
  totalJobs?: number;
  completedJobs?: number;
};

type Template = {
  _id: string;
  name: string;
  color?: string;
  default?: boolean;
  entityViewPage?: string;
  synced?: boolean;
  processing?: TemplateProcessing;
  commonProperties?: PropertySchema[];
  properties?: PropertySchema[];
};

type TemplateInput = Omit<Template, '_id'> & {
  _id?: string;
  reindex?: boolean;
};

export type { Template, TemplateInput, TemplateProcessing };
