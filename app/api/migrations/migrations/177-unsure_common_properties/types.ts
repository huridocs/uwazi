import { ObjectId } from 'mongodb';

type PropertyTypeSchema =
  | 'date'
  | 'daterange'
  | 'geolocation'
  | 'image'
  | 'link'
  | 'markdown'
  | 'media'
  | 'multidate'
  | 'multidaterange'
  | 'multiselect'
  | 'nested'
  | 'numeric'
  | 'preview'
  | 'relationship'
  | 'select'
  | 'text'
  | 'generatedid'
  | 'newRelationship';

interface PropertySchema {
  _id?: ObjectId;
  label: string;
  name: string;
  isCommonProperty?: boolean;
  type: PropertyTypeSchema;
  prioritySorting?: boolean;
  generatedId?: boolean;
  content?: string;
  relationType?: string;
  inherit?: {
    property?: string;
    type?: PropertyTypeSchema;
  };
  filter?: boolean;
  noLabel?: boolean;
  fullWidth?: boolean;
  defaultfilter?: boolean;
  required?: boolean;
  sortable?: boolean;
  showInCard?: boolean;
  style?: string;
  nestedProperties?: string[];
  query?: unknown[];
  denormalizedProperty?: string;
  targetTemplates?: false | string[];
}

interface TemplateSchema {
  _id?: ObjectId;
  name: string;
  color?: string;
  default?: boolean;
  entityViewPage?: string;
  synced?: boolean;
  processing?: {
    active?: boolean;
    totalJobs?: number;
    completedJobs?: number;
  };
  /**
   * @minItems 1
   */
  commonProperties?: [PropertySchema, ...PropertySchema[]];
  properties?: PropertySchema[];
  [k: string]: unknown | undefined;
}

interface Fixture {
  templates: TemplateSchema[];
}

export type { TemplateSchema, PropertySchema, Fixture };
