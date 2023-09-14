import { ObjectId } from 'mongodb';

type ObjectIdSchema = string | ObjectId;

interface PropertySchema {
  _id?: ObjectIdSchema;
  label: string;
  name: string;
  isCommonProperty?: boolean;
  type:
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
  prioritySorting?: boolean;
  generatedId?: boolean;
  content?: string;
  relationType?: string;
  inherit?: {
    property?: string;
    type?:
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
}

interface TemplateSchema {
  _id?: ObjectIdSchema;
  name: string;
  color?: string;
  default?: boolean;
  entityViewPage?: string;
  synced?: boolean;
  /**
   * @minItems 1
   */
  commonProperties?: [PropertySchema, ...PropertySchema[]];
  properties?: PropertySchema[];
  [k: string]: unknown | undefined;
}
interface LatLonSchema {
  label?: string;
  lat: number;
  lon: number;
}

interface LinkSchema {
  label?: string | null;
  url?: string | null;
}

interface DateRangeSchema {
  from?: number | null;
  to?: number | null;
}

type PropertyValueSchema =
  | null
  | string
  | number
  | boolean
  | LinkSchema
  | DateRangeSchema
  | LatLonSchema
  | LatLonSchema[];

interface MetadataObjectSchema {
  value: PropertyValueSchema;
  attachment?: number;
  label?: string;
  suggestion_confidence?: number;
  suggestion_model?: string;
  provenance?: '' | 'BULK_ACCEPT';
  inheritedValue?: {
    value: PropertyValueSchema;
    label?: string;
    [k: string]: unknown | undefined;
  }[];
  inheritedType?: string;
  timeLinks?: string;
  [k: string]: unknown | undefined;
}

interface MetadataSchema {
  [k: string]: MetadataObjectSchema[] | undefined;
}

interface PermissionSchema {
  refId: ObjectIdSchema;
  type: 'user' | 'group' | 'public';
  level: 'read' | 'write' | 'mixed';
}

interface EntitySchema {
  _id?: ObjectIdSchema;
  sharedId?: string;
  language?: string;
  mongoLanguage?: string;
  title?: string;
  template?: ObjectIdSchema;
  published?: boolean;
  generatedToc?: boolean;
  icon?: {
    _id?: string | null;
    label?: string;
    type?: string;
  };
  creationDate?: number;
  user?: ObjectIdSchema;
  metadata?: MetadataSchema;
  obsoleteMetadata?: string[];
  suggestedMetadata?: MetadataSchema;
  permissions?: PermissionSchema[];
  [k: string]: unknown | undefined;
}

export type { TemplateSchema, EntitySchema };
