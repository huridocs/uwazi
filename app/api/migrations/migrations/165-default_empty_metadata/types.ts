import { ObjectId } from 'mongodb';

type PropertyType =
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
  type: PropertyType;
  generatedId?: boolean;
  content?: string;
  relationType?: string;
  inherit?: {
    property?: string;
    type?: PropertyType;
  };
}

interface Template {
  _id?: ObjectId;
  name: string;
  properties?: PropertySchema[];
  [k: string]: unknown | undefined;
}

interface DateRangeSchema {
  from?: number | null;
  to?: number | null;
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

type PropertyValueSchema =
  | null
  | string
  | number
  | boolean
  | LinkSchema
  | DateRangeSchema
  | LatLonSchema
  | LatLonSchema[];

interface SelectParentSchema {
  label: string;
  value: string;
}

interface InheritedValueSchema {
  value: PropertyValueSchema;
  label?: string;
  parent?: SelectParentSchema;
  [k: string]: unknown | undefined;
}

interface MetadataObject {
  value: PropertyValueSchema;
  attachment?: number;
  label?: string;
  inheritedValue?: InheritedValueSchema[];
  inheritedType?: string;
  timeLinks?: string;
  parent?: SelectParentSchema;
  [k: string]: unknown | undefined;
}

interface Metadata {
  [k: string]: MetadataObject[] | undefined;
}

interface Entity {
  _id?: ObjectId;
  sharedId?: string;
  language?: string;
  title?: string;
  metadata?: Metadata;
  [k: string]: unknown | undefined;
}

interface Fixture {
  templates: Template[];
  entities: Entity[];
}

export type { Entity, Fixture };
