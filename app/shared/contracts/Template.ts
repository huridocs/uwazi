import type { PropertySchema, PropertyTypeSchema } from '#shared/types/commonTypes.js';

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

type PropertyMatchConflict = 'type' | 'content' | 'relationType' | 'inheritType';

type PropertyMatch = {
  templateId: string;
  templateName: string;
  propertyId: string;
  label: string;
  type: PropertyTypeSchema;
  content?: string;
  relationType?: string;
  inherit?: { property: string; type: PropertyTypeSchema };
  conflicts: PropertyMatchConflict[];
};

type GetPropertyMatchesResponse = {
  name: string;
  matches: PropertyMatch[];
};

export type {
  Template,
  TemplateInput,
  TemplateProcessing,
  PropertyMatch,
  PropertyMatchConflict,
  GetPropertyMatchesResponse,
};
